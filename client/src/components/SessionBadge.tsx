import { Badge } from "@/components/ui/badge";

interface SessionBadgeProps {
  sessionId: string;
  isActive?: boolean;
}

export function SessionBadge({ sessionId, isActive = true }: SessionBadgeProps) {
  return (
    <Badge 
      variant="secondary" 
      className="font-mono text-xs gap-2 items-center"
      data-testid="badge-session"
    >
      {isActive && (
        <span className="h-2 w-2 rounded-full bg-success" data-testid="indicator-active" />
      )}
      {sessionId}
    </Badge>
  );
}
