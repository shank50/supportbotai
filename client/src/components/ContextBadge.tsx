import { FileText, FileJson, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContextBadgeProps {
    fileName: string;
    fileType: string;
    onRemove?: () => void;
    showRemove?: boolean;
}

const fileTypeIcons: Record<string, React.ReactNode> = {
    TXT: <FileText className="h-3.5 w-3.5" />,
    JSON: <FileJson className="h-3.5 w-3.5" />,
    MD: <FileText className="h-3.5 w-3.5" />,
    PDF: <File className="h-3.5 w-3.5" />,
    CSV: <FileText className="h-3.5 w-3.5" />,
};

export function ContextBadge({ fileName, fileType, onRemove, showRemove = true }: ContextBadgeProps) {
    const icon = fileTypeIcons[fileType] || <File className="h-3.5 w-3.5" />;

    // Truncate long filenames
    const displayName = fileName.length > 20
        ? fileName.slice(0, 17) + "..." + fileName.slice(-4)
        : fileName;

    return (
        <div
            className="context-chip inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm animate-fade-in"
            data-testid="badge-context"
        >
            <span className="opacity-70">{icon}</span>
            <span className="font-medium">{displayName}</span>
            {showRemove && onRemove && (
                <button
                    onClick={onRemove}
                    className="ml-1 p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                    aria-label="Remove context file"
                    data-testid="button-remove-context"
                >
                    <X className="h-3 w-3" />
                </button>
            )}
        </div>
    );
}

// Default context indicator
export function DefaultContextBadge() {
    return (
        <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-muted/50 text-muted-foreground border border-border/50"
            data-testid="badge-default-context"
        >
            <FileText className="h-3.5 w-3.5 opacity-70" />
            <span>Default FAQs</span>
        </div>
    );
}
