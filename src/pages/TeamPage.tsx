import { useState } from "react";
import { UserPlus, Mail, Users, Check, X, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import AppShell from "@/components/AppShell";
import { useCollaborators, useCreateCollaborator, useDeleteCollaborator, useUpdateCollaborator } from "@/hooks/useCollaborators";

const roleColors: Record<string, string> = {
  owner: "bg-primary/10 text-primary",
  editor: "bg-primary/10 text-primary",
  viewer: "bg-secondary text-muted-foreground",
};

export default function TeamPage() {
  const { data: collaborators = [], isLoading } = useCollaborators();
  const createCollaborator = useCreateCollaborator();
  const deleteCollaborator = useDeleteCollaborator();
  const updateCollaborator = useUpdateCollaborator();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");

  const active = collaborators.filter((c) => c.status === "active").length;
  const pending = collaborators.filter((c) => c.status === "pending").length;

  const sendInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Email is required");
      return;
    }
    try {
      await createCollaborator.mutateAsync({
        invited_email: inviteEmail.trim(),
        role: inviteRole,
      });
      toast.success(`Invite sent to ${inviteEmail}`);
      setShowInvite(false);
      setInviteEmail("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send invite");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCollaborator.mutateAsync(id);
      toast.success("Collaborator removed");
    } catch {
      toast.error("Failed to remove");
    }
  };

  const handleRoleChange = async (id: string, role: string) => {
    try {
      await updateCollaborator.mutateAsync({ id, role });
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  };

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-1 text-4xl font-bold text-foreground">Team</h1>
              <p className="text-muted-foreground">
                Invite friends, family, or team members to collaborate on your projects
              </p>
            </div>
            <Button onClick={() => setShowInvite(true)}>
              <UserPlus className="mr-2 h-4 w-4" /> Invite Collaborator
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Collaborators</p>
                <p className="text-2xl font-bold text-foreground">{collaborators.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Check className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-foreground">{active}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                <Mail className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Invites</p>
                <p className="text-2xl font-bold text-foreground">{pending}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Collaborators List */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-6">
            <h2 className="text-xl font-semibold text-foreground">Collaborators</h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : collaborators.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Users className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-muted-foreground">No collaborators yet</p>
              <Button className="mt-4" onClick={() => setShowInvite(true)}>
                Invite your first collaborator
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {collaborators.map((collab) => (
                <div
                  key={collab.id}
                  className="p-6 transition-colors hover:bg-secondary/30"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-lg font-semibold text-primary-foreground">
                        {collab.invited_email.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-3">
                          <h3 className="font-semibold text-foreground">{collab.invited_email}</h3>
                          {collab.status === "pending" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-foreground/60" />
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                              <Check className="h-3 w-3" />
                              Active
                            </span>
                          )}
                          <span
                            className={cn(
                              "rounded px-2 py-0.5 text-xs font-medium capitalize",
                              roleColors[collab.role] || roleColors.viewer
                            )}
                          >
                            {collab.role}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Invited {new Date(collab.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded-lg p-2 transition-colors hover:bg-secondary">
                          <MoreVertical className="h-5 w-5 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRoleChange(collab.id, collab.role === "editor" ? "viewer" : "editor")}>
                          Switch to {collab.role === "editor" ? "Viewer" : "Editor"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(collab.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Invite Modal */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Collaborator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="collaborator@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "editor" | "viewer")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor — Can edit and manage projects</SelectItem>
                  <SelectItem value="viewer">Viewer — Can only view projects</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm text-foreground">
                <strong>Note:</strong> The collaborator will receive an email invitation and can
                choose which projects to join.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowInvite(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={sendInvite}
                disabled={!inviteEmail || createCollaborator.isPending}
              >
                {createCollaborator.isPending ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
