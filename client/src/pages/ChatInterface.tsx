import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SessionBadge } from "@/components/SessionBadge";
import { ChatMessage } from "@/components/ChatMessage";
import { MessageInput } from "@/components/MessageInput";
import { EscalationNotice } from "@/components/EscalationNotice";
import { EmptyState } from "@/components/EmptyState";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Message {
  id: string;
  sessionId: string;
  sender: "user" | "bot";
  content: string;
  timestamp: string;
  metadata: any;
}

interface Escalation {
  id: string;
  sessionId: string;
  reason: string | null;
  timestamp: string;
  resolved: boolean;
}

interface SessionData {
  session: {
    id: string;
    createdAt: string;
    lastActivityAt: string;
  };
  messages: Message[];
  escalations: Escalation[];
}

export default function ChatInterface() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initSession = async () => {
      try {
        const response = await fetch("/api/session", { method: "POST" });
        const data = await response.json();
        setSessionId(data.sessionId);
      } catch (error) {
        console.error("Failed to create session:", error);
      }
    };
    initSession();
  }, []);

  const { data: sessionData, isLoading } = useQuery<SessionData>({
    queryKey: ["/api/session", sessionId],
    enabled: !!sessionId,
    refetchInterval: 2000,
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/chat", { sessionId, message });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/session", sessionId] });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessionData]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const handleSendMessage = (text: string) => {
    chatMutation.mutate(text);
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question);
  };

  if (!sessionId || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  const messages = sessionData?.messages || [];
  const escalations = sessionData?.escalations || [];

  const renderConversation = () => {
    const items: Array<{ 
      type: "message" | "escalation"; 
      id: string; 
      timestamp: Date;
      data: Message | Escalation 
    }> = [
      ...messages.map((msg) => ({ 
        type: "message" as const, 
        id: msg.id, 
        timestamp: new Date(msg.timestamp),
        data: msg 
      })),
      ...escalations.map((esc) => ({ 
        type: "escalation" as const, 
        id: esc.id,
        timestamp: new Date(esc.timestamp),
        data: esc 
      })),
    ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return items.map((item) => {
      if (item.type === "message") {
        const msg = item.data as Message;
        return (
          <ChatMessage
            key={msg.id}
            message={msg.content}
            sender={msg.sender}
            timestamp={formatTime(msg.timestamp)}
          />
        );
      } else {
        const esc = item.data as Escalation;
        return (
          <EscalationNotice
            key={esc.id}
            timestamp={formatTime(esc.timestamp)}
            message="I'm escalating this to a human support agent. You'll hear from us shortly."
          />
        );
      }
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold" data-testid="text-title">
            AI Support
          </h1>
          <SessionBadge sessionId={sessionId.slice(0, 8)} isActive={true} />
        </div>
        <ThemeToggle />
      </header>

      <div className="flex-1 overflow-hidden flex flex-col">
        {messages.length === 0 && escalations.length === 0 ? (
          <EmptyState onQuestionClick={handleSuggestedQuestion} />
        ) : (
          <ScrollArea className="flex-1">
            <div ref={scrollRef} className="p-4 max-w-4xl mx-auto space-y-4">
              {renderConversation()}
              {chatMutation.isPending && (
                <ChatMessage
                  message=""
                  sender="bot"
                  timestamp={formatTime(new Date().toISOString())}
                  isTyping={true}
                />
              )}
            </div>
          </ScrollArea>
        )}

        <div className="border-t p-4 bg-background">
          <div className="max-w-4xl mx-auto">
            <MessageInput
              onSend={handleSendMessage}
              disabled={chatMutation.isPending}
              placeholder="Type your message here..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
