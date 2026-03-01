import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowLeft, Upload, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ShopTemplate } from "@/hooks/useShopTemplates";

export default function AdminTemplates() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ShopTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [templateType, setTemplateType] = useState("resume");
  const [priceCents, setPriceCents] = useState(0);
  const [isInBundle, setIsInBundle] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [tags, setTags] = useState("");
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("shop_templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setTemplates(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTemplateType("resume");
    setPriceCents(0);
    setIsInBundle(false);
    setIsActive(true);
    setTags("");
    setPreviewFile(null);
    setTemplateFile(null);
    setEditingId(null);
  };

  const openEdit = (t: ShopTemplate) => {
    setEditingId(t.id);
    setTitle(t.title);
    setDescription(t.description || "");
    setTemplateType(t.template_type);
    setPriceCents(t.price_cents);
    setIsInBundle(t.is_in_bundle);
    setIsActive(t.is_active);
    setTags(t.tags.join(", "));
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    let previewUrl: string | undefined;
    let fileUrl: string | undefined;

    // Upload preview image
    if (previewFile) {
      const ext = previewFile.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("template-previews")
        .upload(path, previewFile, { upsert: true });
      if (error) {
        toast.error("Failed to upload preview image");
        return;
      }
      const { data: urlData } = supabase.storage
        .from("template-previews")
        .getPublicUrl(path);
      previewUrl = urlData.publicUrl;
    }

    // Upload template file
    if (templateFile) {
      const ext = templateFile.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("template-files")
        .upload(path, templateFile, { upsert: true });
      if (error) {
        toast.error("Failed to upload template file");
        return;
      }
      fileUrl = path; // Store the path, generate signed URL at download time
    }

    const record: any = {
      title: title.trim(),
      description: description.trim() || null,
      template_type: templateType,
      price_cents: priceCents,
      is_in_bundle: isInBundle,
      is_active: isActive,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    if (previewUrl) record.preview_image_url = previewUrl;
    if (fileUrl) record.file_url = fileUrl;

    if (editingId) {
      const { error } = await (supabase as any)
        .from("shop_templates")
        .update(record)
        .eq("id", editingId);
      if (error) {
        toast.error("Failed to update template");
        return;
      }
      toast.success("Template updated");
    } else {
      const { error } = await (supabase as any)
        .from("shop_templates")
        .insert(record);
      if (error) {
        toast.error("Failed to create template");
        return;
      }
      toast.success("Template created");
    }

    resetForm();
    setShowForm(false);
    fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    const { error } = await (supabase as any)
      .from("shop_templates")
      .delete()
      .eq("id", id);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Template deleted");
      fetchTemplates();
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await (supabase as any)
      .from("shop_templates")
      .update({ is_active: !current })
      .eq("id", id);
    fetchTemplates();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Manage Templates</h1>
            <Badge variant="secondary">{templates.length} templates</Badge>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="rounded-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Template
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{templates.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {templates.filter((t) => t.price_cents === 0).length}
              </p>
              <p className="text-xs text-muted-foreground">Free</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {templates.filter((t) => t.price_cents > 0).length}
              </p>
              <p className="text-xs text-muted-foreground">Premium</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {templates.reduce((s, t) => s + t.download_count, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Downloads</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs capitalize">{t.template_type}</Badge>
                  </TableCell>
                  <TableCell>{t.price_cents === 0 ? "Free" : `$${(t.price_cents / 100).toFixed(0)}`}</TableCell>
                  <TableCell>{t.download_count}</TableCell>
                  <TableCell>
                    <Switch
                      checked={t.is_active}
                      onCheckedChange={() => handleToggleActive(t.id, t.is_active)}
                    />
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Add/Edit Modal */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Template" : "Add New Template"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Creative Resume" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Stand out with this modern design" />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={templateType} onValueChange={setTemplateType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resume">Resume</SelectItem>
                    <SelectItem value="portfolio">Portfolio</SelectItem>
                    <SelectItem value="email">Email Pack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Price (cents, 0 = free)</Label>
                <Input type="number" value={priceCents} onChange={(e) => setPriceCents(Number(e.target.value))} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={isInBundle} onCheckedChange={setIsInBundle} />
                <Label>Include in bundle</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label>Active (visible on shop)</Label>
              </div>
              <div>
                <Label>Tags (comma separated)</Label>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="creative, modern, designer" />
              </div>
              <div>
                <Label>Preview Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPreviewFile(e.target.files?.[0] || null)}
                />
              </div>
              <div>
                <Label>Template File (.docx, .pdf, .zip)</Label>
                <Input
                  type="file"
                  accept=".docx,.pdf,.zip,.pptx"
                  onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                />
              </div>
              <Button onClick={handleSave} className="w-full rounded-full">
                {editingId ? "Update Template" : "Save Template"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
