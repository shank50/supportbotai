import fs from "fs";
import path from "path";
import { storage } from "./storage";
import { log } from "./vite";

const UPLOADS_DIR = path.resolve(import.meta.dirname, "..", "uploads");
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Ensure uploads directory exists
export function ensureUploadsDir(): void {
    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
}

// Get session upload directory
export function getSessionUploadDir(sessionId: string): string {
    return path.join(UPLOADS_DIR, sessionId);
}

// Create session upload directory
export function createSessionUploadDir(sessionId: string): string {
    const dir = getSessionUploadDir(sessionId);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

// Delete session upload directory
export function deleteSessionUploadDir(sessionId: string): void {
    const dir = getSessionUploadDir(sessionId);
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        log(`Cleaned up uploads for session: ${sessionId.slice(0, 8)}...`);
    }
}

// Clean up expired sessions
async function cleanupExpiredSessions(): Promise<void> {
    try {
        const sessions = await storage.getAllSessions();
        const now = Date.now();

        for (const session of sessions) {
            const lastActivity = new Date(session.lastActivityAt).getTime();
            const isExpired = now - lastActivity > SESSION_TIMEOUT_MS;

            if (isExpired) {
                deleteSessionUploadDir(session.id);
            }
        }
    } catch (error) {
        console.error("Error during session cleanup:", error);
    }
}

// Start periodic cleanup
let cleanupInterval: NodeJS.Timeout | null = null;

export function startCleanupJob(): void {
    ensureUploadsDir();

    if (cleanupInterval) {
        clearInterval(cleanupInterval);
    }

    cleanupInterval = setInterval(cleanupExpiredSessions, CLEANUP_INTERVAL_MS);
    log("Session cleanup job started (every 5 minutes)");

    // Run once at startup
    cleanupExpiredSessions();
}

export function stopCleanupJob(): void {
    if (cleanupInterval) {
        clearInterval(cleanupInterval);
        cleanupInterval = null;
    }
}
