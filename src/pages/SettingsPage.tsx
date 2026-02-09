import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/AppShell";

export default function SettingsPage() {
  const { user, profile, signOut, updateProfile, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const handleSaveName = async () => {
    if (!fullName.trim()) { toast.error("Name cannot be empty"); return; }
    setSaving(true);
    const { error } = await updateProfile({ full_name: fullName.trim() });
    setSaving(false);
    if (error) toast.error("Failed to update name");
    else toast.success("Name updated");
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setChangingPw(true);
    const { error } = await updatePassword(newPassword);
    setChangingPw(false);
    if (error) toast.error(error.message);
    else { toast.success("Password updated"); setNewPassword(""); }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-lg">
        <h1 className="mb-6 text-[32px] font-semibold tracking-tight">Settings</h1>

        <Card className="rounded-2xl border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-medium">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full name</Label>
              <div className="flex gap-2">
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                <Button onClick={handleSaveName} disabled={saving} size="sm">
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="bg-muted" />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4 rounded-2xl border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-medium">Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>New password</Label>
              <div className="flex gap-2">
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
                <Button onClick={handleChangePassword} disabled={changingPw} size="sm">
                  {changingPw ? "Updating..." : "Update"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4 rounded-2xl border-border shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-medium">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default view</Label>
              <Select defaultValue="kanban">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kanban">Kanban</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select defaultValue="light" disabled>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark (coming soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Button variant="ghost" onClick={handleLogout} className="mt-6 text-destructive hover:text-destructive">
          Log out
        </Button>
      </motion.div>
    </AppShell>
  );
}
