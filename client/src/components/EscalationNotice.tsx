import { AlertTriangle } from "lucide-react";

interface EscalationNoticeProps {
  timestamp: string;
  message?: string;
}

export function EscalationNotice({ 
  timestamp, 
  message = "I'm escalating this to a human support agent. You'll hear from us shortly." 
}: EscalationNoticeProps) {
  return (
    <div
      className="w-full bg-escalation/10 border-l-4 border-escalation rounded-lg p-4 flex gap-3 items-start animate-in fade-in duration-200"
      data-testid="notice-escalation"
    >
      <AlertTriangle className="h-5 w-5 text-escalation shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{message}</p>
        <span className="text-xs text-muted-foreground mt-1 block" data-testid="text-escalation-time">
          {timestamp}
        </span>
      </div>
    </div>
  );
}
