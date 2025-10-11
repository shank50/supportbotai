import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
        "flex gap-3 animate-in fade-in duration-200",
        isBot ? "mr-auto" : "ml-auto flex-row-reverse"
      )}
      data-testid={`message-${sender}`}
    >
      {isBot && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn("flex flex-col gap-1", isBot ? "items-start" : "items-end max-w-md")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            isBot
              ? "bg-card rounded-bl-md"
              : "bg-primary text-primary-foreground rounded-br-md"
          )}
          data-testid="text-message"
        >
          {isTyping ? (
            <div className="flex gap-1" data-testid="indicator-typing">
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
            <p className="text-base">{message}</p>
          )}
        </div>
        <span className="text-xs text-muted-foreground" data-testid="text-timestamp">
          {timestamp}
        </span>
      </div>
    </div>
  );
}
