import { type Session, type InsertSession, type Message, type InsertMessage, type Escalation, type InsertEscalation } from "@shared/schema";
import { db } from "./db";
import { sessions, messages, escalations } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createSession(): Promise<Session>;
  getSession(id: string): Promise<Session | undefined>;
  updateSessionActivity(id: string): Promise<void>;
  
  createMessage(message: InsertMessage): Promise<Message>;
  getSessionMessages(sessionId: string): Promise<Message[]>;
  
  createEscalation(escalation: InsertEscalation): Promise<Escalation>;
  getSessionEscalations(sessionId: string): Promise<Escalation[]>;
  
  // Analytics methods
  getAllSessions(): Promise<Session[]>;
  getAllMessages(): Promise<Message[]>;
  getAllEscalations(): Promise<Escalation[]>;
}

export class DatabaseStorage implements IStorage {
  async createSession(): Promise<Session> {
    const [session] = await db.insert(sessions).values({}).returning();
    return session;
  }

  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session;
  }

  async updateSessionActivity(id: string): Promise<void> {
    await db
      .update(sessions)
      .set({ lastActivityAt: new Date() })
      .where(eq(sessions.id, id));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getSessionMessages(sessionId: string): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(messages.timestamp);
  }

  async createEscalation(escalation: InsertEscalation): Promise<Escalation> {
    const [newEscalation] = await db.insert(escalations).values(escalation).returning();
    return newEscalation;
  }

  async getSessionEscalations(sessionId: string): Promise<Escalation[]> {
    return db
      .select()
      .from(escalations)
      .where(eq(escalations.sessionId, sessionId))
      .orderBy(desc(escalations.timestamp));
  }

  // Analytics methods
  async getAllSessions(): Promise<Session[]> {
    return db.select().from(sessions).orderBy(desc(sessions.createdAt));
  }

  async getAllMessages(): Promise<Message[]> {
    return db.select().from(messages).orderBy(desc(messages.timestamp));
  }

  async getAllEscalations(): Promise<Escalation[]> {
    return db.select().from(escalations).orderBy(desc(escalations.timestamp));
  }
}

export const storage = new DatabaseStorage();
