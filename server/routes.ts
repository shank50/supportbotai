import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { generateChatResponse, summarizeConversation } from "./gemini";
import { parseFile, isValidFileType, isValidFileSize, SUPPORTED_EXTENSIONS } from "./fileParser";
import { createSessionUploadDir, deleteSessionUploadDir } from "./cleanup";
import { z } from "zod";

const chatRequestSchema = z.object({
  sessionId: z.string(),
  message: z.string().min(1),
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, res, cb) => {
      const sessionId = req.params.sessionId;
      const uploadDir = createSessionUploadDir(sessionId);
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (isValidFileType(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type. Allowed: ${SUPPORTED_EXTENSIONS.join(', ')}`));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "OK" });
  });

  // Create session
  app.post("/api/session", async (req, res) => {
    try {
      const session = await storage.createSession();
      res.json({ sessionId: session.id });
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  // Get session details
  app.get("/api/session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      const messages = await storage.getSessionMessages(sessionId);
      const escalations = await storage.getSessionEscalations(sessionId);
      const context = storage.getSessionContext(sessionId);
      res.json({
        session,
        messages,
        escalations,
        context: context ? {
          fileName: context.originalFileName,
          fileType: context.fileType,
          parsedAt: context.parsedAt
        } : null
      });
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  // Upload context file
  app.post("/api/session/:sessionId/context", upload.single('file'), async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      await storage.updateSessionActivity(sessionId);

      // Parse the uploaded file
      const parsedContext = await parseFile(req.file.path, req.file.originalname);

      // Store in memory for this session
      storage.setSessionContext(sessionId, parsedContext);

      res.json({
        success: true,
        context: {
          fileName: parsedContext.originalFileName,
          fileType: parsedContext.fileType,
          parsedAt: parsedContext.parsedAt,
          contentPreview: parsedContext.content.slice(0, 200) + (parsedContext.content.length > 200 ? '...' : '')
        }
      });
    } catch (error: any) {
      console.error("Error uploading context:", error);
      res.status(400).json({ error: error.message || "Failed to upload context file" });
    }
  });

  // Get current context info
  app.get("/api/session/:sessionId/context", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const context = storage.getSessionContext(sessionId);
      if (!context) {
        return res.json({
          hasCustomContext: false,
          context: null,
          defaultContext: "Default FAQ database"
        });
      }

      res.json({
        hasCustomContext: true,
        context: {
          fileName: context.originalFileName,
          fileType: context.fileType,
          parsedAt: context.parsedAt
        }
      });
    } catch (error) {
      console.error("Error fetching context:", error);
      res.status(500).json({ error: "Failed to fetch context" });
    }
  });

  // Delete custom context (revert to default)
  app.delete("/api/session/:sessionId/context", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      storage.deleteSessionContext(sessionId);
      deleteSessionUploadDir(sessionId);

      res.json({ success: true, message: "Reverted to default FAQ context" });
    } catch (error) {
      console.error("Error deleting context:", error);
      res.status(500).json({ error: "Failed to delete context" });
    }
  });

  // Chat endpoint
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

      // Get custom context if available
      const customContext = storage.getSessionContext(sessionId);

      const aiResponse = await generateChatResponse({
        conversationHistory: historyForAI,
        userMessage: message,
        customContext: customContext?.content
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

  // Get conversation summary
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
