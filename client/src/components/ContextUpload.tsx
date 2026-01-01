import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, FileJson, File } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContextUploadProps {
    sessionId: string;
    onUploadSuccess: (context: { fileName: string; fileType: string }) => void;
    onUploadError: (error: string) => void;
    disabled?: boolean;
}

const fileTypeIcons: Record<string, React.ReactNode> = {
    TXT: <FileText className="h-4 w-4" />,
    JSON: <FileJson className="h-4 w-4" />,
    MD: <FileText className="h-4 w-4" />,
    PDF: <File className="h-4 w-4" />,
    CSV: <FileText className="h-4 w-4" />,
};

const ACCEPTED_TYPES = ".txt,.json,.md,.pdf,.docx,.doc";
const MAX_SIZE_MB = 10;

export function ContextUpload({ sessionId, onUploadSuccess, onUploadError, disabled }: ContextUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragging(true);
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const uploadFile = async (file: File) => {
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            onUploadError(`File too large. Maximum size is ${MAX_SIZE_MB}MB.`);
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(`/api/session/${sessionId}/context`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Upload failed");
            }

            onUploadSuccess({
                fileName: data.context.fileName,
                fileType: data.context.fileType,
            });
        } catch (error: any) {
            onUploadError(error.message || "Failed to upload file");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled) return;

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            uploadFile(files[0]);
        }
    }, [disabled, sessionId]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            uploadFile(files[0]);
        }
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleClick = () => {
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div
            className={`upload-zone rounded-xl p-4 text-center cursor-pointer transition-all ${isDragging ? "drag-over" : ""
                } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary/30"}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            data-testid="upload-zone"
        >
            <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled}
            />

            <div className="flex flex-col items-center gap-2">
                {isUploading ? (
                    <>
                        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                    </>
                ) : (
                    <>
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Upload className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium">
                                Drop your context file here
                            </p>
                            <p className="text-xs text-muted-foreground">
                                TXT, JSON, MD, PDF, CSV · Max {MAX_SIZE_MB}MB
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// Compact version for header
interface ContextUploadButtonProps {
    sessionId: string;
    onUploadSuccess: (context: { fileName: string; fileType: string }) => void;
    onUploadError: (error: string) => void;
    disabled?: boolean;
}

export function ContextUploadButton({ sessionId, onUploadSuccess, onUploadError, disabled }: ContextUploadButtonProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const uploadFile = async (file: File) => {
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            onUploadError(`File too large. Maximum size is ${MAX_SIZE_MB}MB.`);
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(`/api/session/${sessionId}/context`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Upload failed");
            }

            onUploadSuccess({
                fileName: data.context.fileName,
                fileType: data.context.fileType,
            });
        } catch (error: any) {
            onUploadError(error.message || "Failed to upload file");
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            uploadFile(files[0]);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled}
            />
            <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                className="gap-2 text-xs"
                data-testid="button-upload-context"
            >
                {isUploading ? (
                    <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                ) : (
                    <Upload className="h-3 w-3" />
                )}
                {isUploading ? "Uploading..." : "Upload Context"}
            </Button>
        </>
    );
}
