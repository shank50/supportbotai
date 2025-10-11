import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  sender: varchar("sender", { enum: ["user", "bot"] }).notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  metadata: jsonb("metadata"),
});

export const escalations = pgTable("escalations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  reason: text("reason"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  resolved: boolean("resolved").notNull().default(false),
});

export type InsertSession = Omit<typeof sessions.$inferInsert, "id" | "createdAt" | "lastActivityAt">;
export type Session = typeof sessions.$inferSelect;

export type InsertMessage = Omit<typeof messages.$inferInsert, "id" | "timestamp">;
export type Message = typeof messages.$inferSelect;

export type InsertEscalation = Omit<typeof escalations.$inferInsert, "id" | "timestamp" | "resolved">;
export type Escalation = typeof escalations.$inferSelect;
