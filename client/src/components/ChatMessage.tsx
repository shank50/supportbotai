import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  message: string;
  sender: "user" | "bot";
  timestamp: string;
  isTyping?: boolean;
}

export function ChatMessage({ message, sender, timestamp, isTyping = false }: ChatMessageProps) {
  const isBot = sender === "bot";

  return (
    <div
      className={cn(
        "flex gap-3 max-w-[85%]",
        isBot
          ? "mr-auto animate-slide-in-left"
          : "ml-auto flex-row-reverse animate-slide-in-right"
      )}
      data-testid={`message-${sender}`}
    >
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
        isBot
          ? "bg-card border border-border"
          : "gradient-primary"
      )}>
        {isBot ? (
          <Bot className="h-4 w-4 text-primary" />
        ) : (
          <User className="h-4 w-4 text-primary-foreground" />
        )}
      </div>

      {/* Message bubble */}
      <div className={cn("flex flex-col gap-1", isBot ? "items-start" : "items-end")}>
        <div
          className={cn(
            "px-4 py-3",
            isBot ? "chat-bubble-bot" : "chat-bubble-user"
          )}
          data-testid="text-message"
        >
          {isTyping ? (
            <div className="flex gap-1.5 py-1" data-testid="indicator-typing">
              <span className="typing-dot w-2 h-2 bg-muted-foreground/60 rounded-full" />
              <span className="typing-dot w-2 h-2 bg-muted-foreground/60 rounded-full" />
              <span className="typing-dot w-2 h-2 bg-muted-foreground/60 rounded-full" />
            </div>
          ) : (
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message}</p>
          )}
        </div>
        <span
          className="text-[11px] text-muted-foreground px-1"
          data-testid="text-timestamp"
        >
          {timestamp}
        </span>
      </div>
    </div>
  );
}
