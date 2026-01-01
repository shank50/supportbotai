import { AlertTriangle, Phone } from "lucide-react";

interface EscalationNoticeProps {
  timestamp: string;
  message?: string;
}

export function EscalationNotice({
  timestamp,
  message = "I'm connecting you with a human support agent. You'll hear from us shortly."
}: EscalationNoticeProps) {
  return (
    <div
      className="w-full max-w-[85%] mx-auto rounded-xl p-4 animate-slide-up"
      style={{
        background: "linear-gradient(135deg, hsl(35 90% 50% / 0.1) 0%, hsl(25 80% 45% / 0.05) 100%)",
        border: "1px solid hsl(35 90% 50% / 0.2)",
      }}
      data-testid="notice-escalation"
    >
      <div className="flex gap-3 items-start">
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-chart-3/20 flex items-center justify-center">
          <Phone className="h-5 w-5 text-chart-3" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-relaxed">{message}</p>
          <span
            className="text-xs text-muted-foreground mt-2 block"
            data-testid="text-escalation-time"
          >
            {timestamp}
          </span>
        </div>
      </div>
    </div>
  );
}
