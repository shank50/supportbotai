import { MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContextUpload } from "./ContextUpload";
import { MessageInput } from "./MessageInput";

interface EmptyStateProps {
  onQuestionClick: (question: string) => void;
  sessionId: string;
  onContextUpload: (context: { fileName: string; fileType: string }) => void;
  onContextError: (error: string) => void;
  onSendMessage: (message: string) => void;
  isSending?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "How do I reset my password?",
  "What are your business hours?",
  "How can I track my order?",
  "Do you offer refunds?",
];

export function EmptyState({
  onQuestionClick,
  sessionId,
  onContextUpload,
  onContextError,
  onSendMessage,
  isSending = false
}: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-lg space-y-8 animate-fade-in">
        {/* Hero section */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl gradient-primary flex items-center justify-center glow-primary">
                <MessageSquare className="h-10 w-10 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-chart-3 flex items-center justify-center animate-glow-pulse">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight" data-testid="text-welcome">
              How can I help you?
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              Ask me anything about the current FAQ, or upload your own file for different context.
            </p>
          </div>
        </div>

        {/* Chat input */}
        <div className="max-w-md mx-auto">
          <MessageInput
            onSend={onSendMessage}
            disabled={isSending}
            placeholder="Type your question here..."
          />
        </div>

        {/* Suggested questions */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Or try one of these:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {SUGGESTED_QUESTIONS.map((question) => (
              <Button
                key={question}
                variant="outline"
                size="sm"
                onClick={() => onQuestionClick(question)}
                disabled={isSending}
                className="text-xs hover-elevate bg-card/50 hover:bg-card hover:border-primary/30 transition-all"
                data-testid={`button-suggested-${question.slice(0, 20)}`}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>

        {/* Context upload */}
        <div className="max-w-sm mx-auto pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-3">Want to use your own knowledge base?</p>
          <ContextUpload
            sessionId={sessionId}
            onUploadSuccess={onContextUpload}
            onUploadError={onContextError}
          />
        </div>
      </div>
    </div>
  );
}
