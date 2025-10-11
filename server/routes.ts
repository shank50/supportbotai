import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateChatResponse, summarizeConversation } from "./gemini";
import { z } from "zod";

const chatRequestSchema = z.object({
  sessionId: z.string(),
  message: z.string().min(1),
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/session", async (req, res) => {
    try {
      const session = await storage.createSession();
      res.json({ sessionId: session.id });
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.get("/api/session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      const messages = await storage.getSessionMessages(sessionId);
      const escalations = await storage.getSessionEscalations(sessionId);
      res.json({ session, messages, escalations });
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { sessionId, message } = chatRequestSchema.parse(req.body);
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      await storage.updateSessionActivity(sessionId);
      const userMessage = await storage.createMessage({
        sessionId, sender: "user", content: message, metadata: null
      });
      const conversationHistory = await storage.getSessionMessages(sessionId);
      const historyForAI = conversationHistory.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant", content: msg.content
      }));
      const aiResponse = await generateChatResponse({
        conversationHistory: historyForAI, userMessage: message
      });
      const botMessage = await storage.createMessage({
        sessionId, sender: "bot", content: aiResponse.message,
        metadata: {
          matchedFAQ: aiResponse.matchedFAQ,
          suggestedActions: aiResponse.suggestedActions
        }
      });
      let escalation = null;
      if (aiResponse.shouldEscalate) {
        escalation = await storage.createEscalation({
          sessionId,
          reason: aiResponse.escalationReason || "User requested human assistance"
        });
      }
      res.json({ userMessage, botMessage, escalation, shouldEscalate: aiResponse.shouldEscalate });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Error processing chat:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  app.get("/api/session/:sessionId/summary", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      const messages = await storage.getSessionMessages(sessionId);
      if (messages.length === 0) {
        return res.json({ summary: "No messages in this conversation yet." });
      }
      const messagesForSummary = messages.map((msg) => ({
        sender: msg.sender, content: msg.content
      }));
      const summary = await summarizeConversation(messagesForSummary);
      res.json({ summary });
    } catch (error) {
      console.error("Error generating summary:", error);
      res.status(500).json({ error: "Failed to generate summary" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
