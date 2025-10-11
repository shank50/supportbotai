import { GoogleGenAI } from "@google/genai";
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
}

interface ChatResponse {
  message: string;
  shouldEscalate: boolean;
  escalationReason?: string;
  matchedFAQ?: FAQ;
  suggestedActions?: string[];
}

function getFAQContext(): string {
  return faqs.faqs
    .map((faq) => `Q: ${faq.question}\nA: ${faq.answer}\nCategory: ${faq.category}\n`)
    .join("\n");
}

export async function generateChatResponse(context: ChatContext): Promise<ChatResponse> {
  const faqContext = getFAQContext();
  
  const conversationSummary = context.conversationHistory
    .slice(-6)
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  const prompt = `You are an AI customer support assistant. Your goal is to help customers by:
1. Matching their questions to relevant FAQs
2. Providing clear, helpful responses
3. Detecting when escalation to a human agent is needed

Available FAQs:
${faqContext}

Recent conversation:
${conversationSummary}

Current user message: "${context.userMessage}"

IMPORTANT ESCALATION RULES:
- Escalate if the user explicitly asks to speak with a human, agent, or representative
- Escalate if the user expresses strong frustration, anger, or dissatisfaction
- Escalate if the question is too complex or not covered by FAQs
- Escalate if the user mentions legal, compliance, or security concerns
- Escalate if you've provided 2+ responses and the issue isn't resolved

Respond in JSON format:
{
  "message": "Your response to the user (be conversational and helpful)",
  "shouldEscalate": true/false,
  "escalationReason": "Brief reason for escalation (only if shouldEscalate is true)",
  "matchedFAQId": "faq-xxx (if applicable)",
  "suggestedActions": ["action1", "action2"] (optional next steps for user)
}`;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const responseText = result.text || "";
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        message: "I'm having trouble processing your request right now. Let me connect you with a human agent who can help.",
        shouldEscalate: true,
        escalationReason: "Failed to parse AI response",
      };
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    
    return {
      message: parsedResponse.message || "I'm here to help! Could you provide more details?",
      shouldEscalate: parsedResponse.shouldEscalate || false,
      escalationReason: parsedResponse.escalationReason,
      matchedFAQ: parsedResponse.matchedFAQId
        ? faqs.faqs.find((faq) => faq.id === parsedResponse.matchedFAQId)
        : undefined,
      suggestedActions: parsedResponse.suggestedActions || [],
    };
  } catch (error) {
    console.error("Error generating chat response:", error);
    return {
      message: "I apologize, but I'm experiencing technical difficulties. Let me escalate this to a human agent who can assist you better.",
      shouldEscalate: true,
      escalationReason: "Technical error in AI processing",
    };
  }
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
