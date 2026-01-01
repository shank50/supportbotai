interface SessionBadgeProps {
  sessionId: string;
  isActive?: boolean;
}

export function SessionBadge({ sessionId, isActive = true }: SessionBadgeProps) {
  return (
    <div
      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-card/50 border border-border/50 text-xs font-mono text-muted-foreground"
      data-testid="badge-session"
    >
      {isActive && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-success animate-pulse"
          data-testid="indicator-active"
        />
      )}
      <span>{sessionId}</span>
    </div>
  );
}
