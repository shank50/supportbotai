import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onQuestionClick: (question: string) => void;
}

const SUGGESTED_QUESTIONS = [
  "How do I reset my password?",
  "What are your business hours?",
  "How can I track my order?",
  "Do you offer refunds?",
];

export function EmptyState({ onQuestionClick }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-6">
            <MessageSquare className="h-12 w-12 text-primary" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold" data-testid="text-welcome">
            Welcome to AI Support
          </h2>
          <p className="text-muted-foreground">
            Ask me anything about our services. I'm here to help!
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Suggested questions:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {SUGGESTED_QUESTIONS.map((question) => (
              <Button
                key={question}
                variant="outline"
                size="sm"
                onClick={() => onQuestionClick(question)}
                className="text-xs"
                data-testid={`button-suggested-${question.slice(0, 20)}`}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
