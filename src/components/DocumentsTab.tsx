import { useCallback, useRef, useState } from "react";
import { useDocuments, useUploadDocument, useDeleteDocument } from "@/hooks/useDocuments";
import { Button } from "@/components/ui/button";
import {
  Upload, FileText, Image, Film, Music, Trash2, Download, File, Eye,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const fileIcons: Record<string, any> = {
  image: Image,
  video: Film,
  audio: Music,
  "application/pdf": FileText,
};

function getIcon(type: string | null) {
  if (!type) return File;
  for (const [key, icon] of Object.entries(fileIcons)) {
    if (type.startsWith(key) || type === key) return icon;
  }
  return FileText;
}

function getIconColor(type: string | null) {
  if (!type) return "text-muted-foreground bg-secondary";
  if (type.startsWith("image")) return "text-primary bg-primary/10";
  if (type.startsWith("video")) return "text-destructive bg-destructive/10";
  if (type.startsWith("audio")) return "text-primary/70 bg-primary/5";
  return "text-primary bg-primary/10";
}

function getFileCategory(type: string | null): string {
  if (!type) return "other";
  if (type.startsWith("image")) return "image";
  if (type.startsWith("video")) return "video";
  if (type.startsWith("audio")) return "audio";
  return "document";
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
  const [notes, setNotes] = useState("");

  const handleFiles = useCallback(
    async (files: FileList | null) => {
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
    },
    [projectId, uploadDoc]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

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

  // Stats
  const totalSize = docs.reduce((sum, d) => sum + (d.file_size || 0), 0);
  const lastUpdated = docs.length > 0 ? docs[0].created_at : null;

  // File type counts
  const typeCounts: Record<string, number> = {};
  docs.forEach((d) => {
    const cat = getFileCategory(d.file_type);
    typeCounts[cat] = (typeCounts[cat] || 0) + 1;
  });

  const categoryMeta: Record<string, { label: string; icon: any; color: string }> = {
    document: { label: "Documents", icon: FileText, color: "text-primary bg-primary/10" },
    image: { label: "Images", icon: Image, color: "text-primary bg-primary/10" },
    video: { label: "Videos", icon: Film, color: "text-destructive bg-destructive/10" },
    audio: { label: "Audio", icon: Music, color: "text-primary/70 bg-primary/5" },
    other: { label: "Other", icon: File, color: "text-muted-foreground bg-secondary" },
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* Main Content (2/3) */}
      <div className="space-y-6 md:col-span-2">
        {/* File Upload Area */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-foreground">Documents & Files</h2>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="mb-6 cursor-pointer rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/30 hover:bg-primary/5"
          >
            <Upload className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="font-medium text-foreground">Drop files here or click to upload</p>
            <p className="text-sm text-muted-foreground">
              Support for documents, images, videos, and audio
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* File List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <FileText className="mb-2 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No files yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {docs.map((doc) => {
                const Icon = getIcon(doc.file_type);
                const colorClass = getIconColor(doc.file_type);
                return (
                  <div
                    key={doc.id}
                    className="group flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-secondary/30"
                  >
                    <div className={cn("rounded-lg p-3", colorClass)}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatSize(doc.file_size)} · Uploaded{" "}
                        {format(new Date(doc.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDownload(doc.file_url, doc.name)}
                      >
                        <Download className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => deleteDoc.mutate({ id: doc.id, fileUrl: doc.file_url })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-foreground">Project Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-64 w-full resize-none rounded-lg border border-border bg-background p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Add your notes here..."
          />
        </div>
      </div>

      {/* Sidebar (1/3) */}
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Files</span>
              <span className="font-semibold text-foreground">{docs.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Storage Used</span>
              <span className="font-semibold text-foreground">{formatSize(totalSize)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span className="font-semibold text-foreground">
                {lastUpdated
                  ? formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* File Types */}
        {Object.keys(typeCounts).length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-foreground">File Types</h3>
            <div className="space-y-3">
              {Object.entries(typeCounts).map(([cat, count]) => {
                const meta = categoryMeta[cat] || categoryMeta.other;
                const CatIcon = meta.icon;
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        meta.color
                      )}
                    >
                      <CatIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{meta.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {count} file{count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {docs.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Recent Activity</h3>
            <div className="space-y-3">
              {docs.slice(0, 5).map((doc) => (
                <div key={doc.id} className="text-sm">
                  <p className="font-medium text-foreground">File uploaded</p>
                  <p className="text-muted-foreground">
                    {doc.name} ·{" "}
                    {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
