import { GoogleGenAI, SchemaType } from "@google/genai";
import faqs from "./faqs.json";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const ai = new GoogleGenAI({ apiKey });

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

interface ChatContext {
  conversationHistory: Array<{ role: string; content: string }>;
  userMessage: string;
  customContext?: string; // Added for custom file context
}

interface ChatResponse {
  message: string;
  shouldEscalate: boolean;
  escalationReason?: string;
  matchedFAQ?: FAQ;
  suggestedActions?: string[];
}

function getDefaultFAQContext(): string {
  return faqs.faqs
    .map((faq) => `Q: ${faq.question}\nA: ${faq.answer}\nCategory: ${faq.category}\n`)
    .join("\n");
}

export async function generateChatResponse(context: ChatContext): Promise<ChatResponse> {
  // Use custom context if provided, otherwise use default FAQs
  const knowledgeBase = context.customContext || getDefaultFAQContext();
  const contextType = context.customContext ? "Custom Knowledge Base" : "FAQs";

  const conversationSummary = context.conversationHistory
    .slice(-6)
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  // Truncate context if it's too large to prevent token limits/timeouts
  // 30,000 characters is a safe limit for stability while still being reasonably large
  const MAX_CONTEXT_LENGTH = 30000;
  let cleanKnowledgeBase = knowledgeBase;

  if (cleanKnowledgeBase.length > MAX_CONTEXT_LENGTH) {
    console.warn(`Context truncated from ${cleanKnowledgeBase.length} to ${MAX_CONTEXT_LENGTH} characters`);
    cleanKnowledgeBase = cleanKnowledgeBase.substring(0, MAX_CONTEXT_LENGTH) + "\n...[Context Truncated]...";
  }

  const prompt = `You are an AI customer support assistant. Your goal is to help customers by:
1. Matching their questions to the provided knowledge base
2. Providing clear, helpful responses
3. Detecting when escalation to a human agent is needed

${contextType}:
${cleanKnowledgeBase}

Recent conversation:
${conversationSummary}

Current user message: "${context.userMessage}"

IMPORTANT RULES:
- If the knowledge base contains the answer, ANSWER IT directly.
- Only escalate if the user *explicitly* asks for a human or if the question is completely unrelated to the provided context.
- Do NOT escalate just because the context is long or complex. Read it carefully.
- If you are unsure, try to answer based on the context first, and ask for clarification if needed.
- If using custom context, ignore generic FAQs unless relevant.

Response Schema (JSON):
{
  "message": "string",
  "shouldEscalate": boolean,
  "escalationReason": "string (optional)",
  "matchedFAQId": "string (optional)",
  "suggestedActions": ["string"] (optional)
}`;
  //multiple fallbacks, if one fails
  const MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"];
  let lastError;

  for (let attempt = 0; attempt < 3; attempt++) {
    const modelName = MODELS[attempt] || MODELS[MODELS.length - 1];

    try {
      console.log(`Attempt ${attempt + 1}: Generating response with ${modelName} (Context: ${cleanKnowledgeBase.length} chars)`);

      const result = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json", // Use native JSON mode
        }
      });
      const responseText = result.text || "";

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (e) {
        console.error("JSON Parse Error:", e);
        if (attempt < 2) continue;
        return {
          message: "I'm having trouble processing your request right now. Could you please rephrase that?",
          shouldEscalate: false,
          escalationReason: "Failed to parse AI response",
        };
      }

      return {
        message: parsedResponse.message || "I'm here to help! Could you provide more details?",
        shouldEscalate: parsedResponse.shouldEscalate || false,
        escalationReason: parsedResponse.escalationReason,
        matchedFAQ: parsedResponse.matchedFAQId
          ? faqs.faqs.find((faq) => faq.id === parsedResponse.matchedFAQId)
          : undefined,
        suggestedActions: parsedResponse.suggestedActions || [],
      };
    } catch (error: any) {
      console.error(`Attempt ${attempt + 1} failed with model ${modelName}:`, error.message);
      lastError = error;

      // Only retry on 503 or network errors
      if (!error.message?.includes("503") && !error.message?.includes("overloaded")) {
        break;
      }

      // Aggressive backoff: 2s, 4s, 8s
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 2000));
      }
    }
  }

  console.error("All attempts to generate chat response failed:", lastError);
  return {
    message: "I apologize, but all my AI models are currently experiencing high traffic. Please try again in a few moments.",
    shouldEscalate: false,
    escalationReason: "AI Service Overloaded (All Models)",
  };
}

export async function summarizeConversation(
  messages: Array<{ sender: string; content: string }>
): Promise<string> {
  const conversationText = messages
    .map((msg) => `${msg.sender === "user" ? "Customer" : "AI Assistant"}: ${msg.content}`)
    .join("\n");

  const prompt = `Summarize this customer support conversation in 2-3 sentences, focusing on the main issue and resolution status:

${conversationText}

Summary:`;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return result.text?.trim() || "Unable to generate summary.";
  } catch (error) {
    console.error("Error summarizing conversation:", error);
    return "Unable to generate summary at this time.";
  }
}
