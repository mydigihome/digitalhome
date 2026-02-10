import { useCallback, useRef } from "react";
import { useDocuments, useUploadDocument, useDeleteDocument } from "@/hooks/useDocuments";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Image, Film, Music, Trash2, Download, File } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const fileIcons: Record<string, any> = {
  "image": Image,
  "video": Film,
  "audio": Music,
  "application/pdf": FileText,
};

function getIcon(type: string | null) {
  if (!type) return File;
  for (const [key, icon] of Object.entries(fileIcons)) {
    if (type.startsWith(key) || type === key) return icon;
  }
  return FileText;
}

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsTab({ projectId }: { projectId: string }) {
  const { data: docs = [], isLoading } = useDocuments(projectId);
  const uploadDoc = useUploadDocument();
  const deleteDoc = useDeleteDocument();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 50MB)`);
        continue;
      }
      try {
        await uploadDoc.mutateAsync({ projectId, file });
        toast.success(`${file.name} uploaded`);
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  }, [projectId, uploadDoc]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDownload = async (fileUrl: string, name: string) => {
    const { data } = await supabase.storage.from("project-documents").download(fileUrl);
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary/30 px-6 py-10 text-center transition-colors hover:border-primary/30 hover:bg-primary/5"
      >
        <Upload className="h-8 w-8 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground">Drop files here or click to upload</p>
        <p className="text-xs text-muted-foreground/60">PDF, images, docs, audio, video — max 50MB</p>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {/* File grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <FileText className="mb-2 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No files yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {docs.map((doc) => {
            const Icon = getIcon(doc.file_type);
            return (
              <div key={doc.id} className="group rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="truncate text-sm font-medium">{doc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(doc.file_size)} · {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                </p>
                <div className="mt-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(doc.file_url, doc.name)}>
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => deleteDoc.mutate({ id: doc.id, fileUrl: doc.file_url })}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
