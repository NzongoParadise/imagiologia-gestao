"use client";

import { useState, useCallback } from "react";
import { cn } from "@/utils/cn";
import { Upload, X, File, Image as ImageIcon, FileText, AlertCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";

interface FileWithPreview extends File {
  preview?: string;
}

interface FileUploaderProps {
  onUpload: (files: File[]) => Promise<void>;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

const defaultAccept = {
  "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".dicom", ".dcm"],
  "application/pdf": [".pdf"],
};

export function FileUploader({
  onUpload,
  accept = defaultAccept,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024,
  multiple = true,
  disabled = false,
  className,
}: FileUploaderProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      const remaining = maxFiles - files.length;
      if (acceptedFiles.length > remaining) {
        setError(`Máximo de ${maxFiles} ficheiros permitidos`);
        return;
      }
      setFiles((prev) => [
        ...prev,
        ...acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: file.type.startsWith("image/")
              ? URL.createObjectURL(file)
              : undefined,
          })
        ),
      ]);
    },
    [files.length, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
    multiple,
    disabled: disabled || uploading,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const file = prev[index];
      if (file.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      await onUpload(files);
      setFiles([]);
    } catch {
      setError("Erro ao fazer upload. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFileIcon = (file: FileWithPreview) => {
    if (file.type.startsWith("image/")) return ImageIcon;
    if (file.type === "application/pdf") return FileText;
    return File;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
            isDragActive ? "bg-primary/10" : "bg-muted"
          )}>
            <Upload className={cn(
              "h-6 w-6",
              isDragActive ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          {isDragActive ? (
            <p className="text-sm font-medium text-primary">Largue os ficheiros aqui...</p>
          ) : (
            <>
              <p className="text-sm font-medium">
                Arraste ficheiros ou <span className="text-primary">escolha</span>
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, DICOM, PDF até {formatSize(maxSize)}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            {files.map((file, index) => {
              const FileIcon = getFileIcon(file);
              return (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3"
                >
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="h-10 w-10 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                      <FileIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              );
            })}

            <button
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {uploading
                ? "A enviar..."
                : `Enviar ${files.length} ficheiro(s)`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

