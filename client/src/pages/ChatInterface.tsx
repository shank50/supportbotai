import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SessionBadge } from "@/components/SessionBadge";
import { ChatMessage } from "@/components/ChatMessage";
import { MessageInput } from "@/components/MessageInput";
import { EscalationNotice } from "@/components/EscalationNotice";
import { EmptyState } from "@/components/EmptyState";
import { ContextBadge, DefaultContextBadge } from "@/components/ContextBadge";
import { ContextUploadButton } from "@/components/ContextUpload";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare } from "lucide-react";

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

interface ContextInfo {
  fileName: string;
  fileType: string;
  parsedAt?: string;
}

interface SessionData {
  session: {
    id: string;
    createdAt: string;
    lastActivityAt: string;
  };
  messages: Message[];
  escalations: Escalation[];
  context: ContextInfo | null;
}

export default function ChatInterface() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentContext, setCurrentContext] = useState<ContextInfo | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      try {
        const response = await fetch("/api/session", { method: "POST" });
        const data = await response.json();
        setSessionId(data.sessionId);
      } catch (error) {
        console.error("Failed to create session:", error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to the server. Please refresh the page.",
          variant: "destructive",
        });
      }
    };
    initSession();
  }, []);

  // Fetch session data
  const { data: sessionData, isLoading } = useQuery<SessionData>({
    queryKey: ["/api/session", sessionId],
    enabled: !!sessionId,
    refetchInterval: 2000,
  });

  // Update context from session data
  useEffect(() => {
    if (sessionData?.context) {
      setCurrentContext(sessionData.context);
    }
  }, [sessionData?.context]);

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/chat", { sessionId, message });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/session", sessionId] });
    },
    onError: () => {
      toast({
        title: "Message Failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom
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

  const handleContextUpload = (context: { fileName: string; fileType: string }) => {
    setCurrentContext(context);
    toast({
      title: "Context Updated",
      description: `Now using "${context.fileName}" as context.`,
    });
    queryClient.invalidateQueries({ queryKey: ["/api/session", sessionId] });
  };

  const handleContextError = (error: string) => {
    toast({
      title: "Upload Failed",
      description: error,
      variant: "destructive",
    });
  };

  const handleRemoveContext = async () => {
    if (!sessionId) return;

    try {
      await fetch(`/api/session/${sessionId}/context`, { method: "DELETE" });
      setCurrentContext(null);
      toast({
        title: "Context Removed",
        description: "Reverted to default FAQ context.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/session", sessionId] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove context.",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (!sessionId || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="h-12 w-12 mx-auto rounded-xl gradient-primary flex items-center justify-center animate-glow-pulse">
            <MessageSquare className="h-6 w-6 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">Connecting...</p>
        </div>
      </div>
    );
  }

  const messages = sessionData?.messages || [];
  const escalations = sessionData?.escalations || [];

  // Render conversation items
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
          />
        );
      }
    });
  };

  const hasContent = messages.length > 0 || escalations.length > 0;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="floating-header sticky top-0 z-10 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Left: Logo and session */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-semibold" data-testid="text-title">
                Support Chat
              </h1>
              <div className="flex items-center gap-2">
                <SessionBadge sessionId={sessionId.slice(0, 8)} isActive={true} />
              </div>
            </div>
          </div>

          {/* Center: Context indicator */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">Current Context:</span>
            {currentContext ? (
              <ContextBadge
                fileName={currentContext.fileName}
                fileType={currentContext.fileType}
                onRemove={handleRemoveContext}
              />
            ) : (
              <DefaultContextBadge />
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {hasContent && (
              <ContextUploadButton
                sessionId={sessionId}
                onUploadSuccess={handleContextUpload}
                onUploadError={handleContextError}
              />
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {!hasContent ? (
          <EmptyState
            onQuestionClick={handleSendMessage}
            sessionId={sessionId}
            onContextUpload={handleContextUpload}
            onContextError={handleContextError}
            onSendMessage={handleSendMessage}
            isSending={chatMutation.isPending}
          />
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

        {/* Input area */}
        {hasContent && (
          <div className="p-4 pb-6">
            <div className="max-w-4xl mx-auto">
              <MessageInput
                onSend={handleSendMessage}
                disabled={chatMutation.isPending}
                placeholder="Type your message..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
