import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowLeft, Upload, Download, DollarSign, TrendingUp, FileText, Palette, Mail, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ShopTemplate {
  id: string;
  title: string;
  description: string | null;
  template_type: string;
  preview_image_url: string | null;
  file_url: string | null;
  pdf_url: string | null;
  price_cents: number;
  is_active: boolean;
  is_in_bundle: boolean;
  tags: string[];
  download_count: number;
  created_at: string;
}

const SLOTS_PER_CATEGORY = 4;

const categoryConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  resume: { label: "Resumes", icon: <FileText className="h-4 w-4" /> },
  portfolio: { label: "Portfolios", icon: <Palette className="h-4 w-4" /> },
  email: { label: "Email Templates", icon: <Mail className="h-4 w-4" /> },
};

export default function AdminTemplates() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ShopTemplate[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
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

  const fetchData = async () => {
    setLoading(true);
    const [templatesRes, purchasesRes] = await Promise.all([
      (supabase as any).from("shop_templates").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("template_purchases").select("*").order("purchased_at", { ascending: false }),
    ]);
    if (!templatesRes.error) setTemplates(templatesRes.data || []);
    if (!purchasesRes.error) setPurchases(purchasesRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setTitle(""); setDescription(""); setTemplateType("resume"); setPriceCents(0);
    setIsInBundle(false); setIsActive(true); setTags(""); setPreviewFile(null);
    setTemplateFile(null); setEditingId(null);
  };

  const openEdit = (t: ShopTemplate) => {
    setEditingId(t.id); setTitle(t.title); setDescription(t.description || "");
    setTemplateType(t.template_type); setPriceCents(t.price_cents);
    setIsInBundle(t.is_in_bundle); setIsActive(t.is_active);
    setTags(t.tags.join(", ")); setShowForm(true);
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }

    let previewUrl: string | undefined;
    let fileUrl: string | undefined;

    if (previewFile) {
      const ext = previewFile.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("template-previews").upload(path, previewFile, { upsert: true });
      if (error) { toast.error("Failed to upload preview image"); return; }
      const { data: urlData } = supabase.storage.from("template-previews").getPublicUrl(path);
      previewUrl = urlData.publicUrl;
    }

    if (templateFile) {
      const ext = templateFile.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("template-files").upload(path, templateFile, { upsert: true });
      if (error) { toast.error("Failed to upload template file"); return; }
      fileUrl = path;
    }

    const record: any = {
      title: title.trim(), description: description.trim() || null,
      template_type: templateType, price_cents: priceCents,
      is_in_bundle: isInBundle, is_active: isActive,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    if (previewUrl) record.preview_image_url = previewUrl;
    if (fileUrl) record.file_url = fileUrl;

    if (editingId) {
      const { error } = await (supabase as any).from("shop_templates").update(record).eq("id", editingId);
      if (error) { toast.error("Failed to update template"); return; }
      toast.success("Template updated");
    } else {
      const { error } = await (supabase as any).from("shop_templates").insert(record);
      if (error) { toast.error("Failed to create template"); return; }
      toast.success("Template created");
    }
    resetForm(); setShowForm(false); fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    const { error } = await (supabase as any).from("shop_templates").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Template deleted"); fetchData(); }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await (supabase as any).from("shop_templates").update({ is_active: !current }).eq("id", id);
    fetchData();
  };

  // Analytics
  const totalRevenue = purchases.reduce((s: number, p: any) => s + (p.amount_paid || 0), 0);
  const thisMonthPurchases = purchases.filter((p: any) => {
    const d = new Date(p.purchased_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthRevenue = thisMonthPurchases.reduce((s: number, p: any) => s + (p.amount_paid || 0), 0);
  const totalDownloads = templates.reduce((s, t) => s + t.download_count, 0);
  const freeDownloads = templates.filter(t => t.price_cents === 0).reduce((s, t) => s + t.download_count, 0);

  const getByType = (type: string) => templates.filter((t) => t.template_type === type);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Template Library Admin</h1>
            <Badge variant="secondary">{templates.length} templates</Badge>
          </div>
          <Button onClick={() => { resetForm(); setShowForm(true); }} className="rounded-full">
            <Plus className="h-4 w-4 mr-2" /> Add Template
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="rounded-2xl"><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{templates.length}</p>
            <p className="text-xs text-muted-foreground">Total Templates</p>
          </CardContent></Card>
          <Card className="rounded-2xl"><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{templates.filter(t => t.is_active).length}</p>
            <p className="text-xs text-muted-foreground">Published</p>
          </CardContent></Card>
          <Card className="rounded-2xl"><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalDownloads}</p>
            <p className="text-xs text-muted-foreground">Total Downloads</p>
          </CardContent></Card>
          <Card className="rounded-2xl"><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">${(totalRevenue / 100).toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent></Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="manage" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
            <TabsTrigger value="manage">Manage Templates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <Card className="rounded-2xl">
              <CardContent className="p-6 space-y-5">
                <h3 className="text-lg font-semibold text-foreground">Add New Template</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Template Name *</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Creative Resume Template" />
                  </div>
                  <div className="space-y-1">
                    <Label>Category *</Label>
                    <Select value={templateType} onValueChange={setTemplateType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="resume">Resume</SelectItem>
                        <SelectItem value="portfolio">Portfolio Deck</SelectItem>
                        <SelectItem value="email">Email Template Pack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Short Description *</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="1-2 sentences about this template" rows={2} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Preview Image * (600×400 recommended)</Label>
                    <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPreviewFile(e.target.files?.[0] || null)} />
                    {previewFile && <p className="text-xs text-muted-foreground">{previewFile.name} </p>}
                  </div>
                  <div className="space-y-1">
                    <Label>Template File * (.docx, .pptx, .pdf, .zip)</Label>
                    <Input type="file" accept=".docx,.pdf,.zip,.pptx" onChange={(e) => setTemplateFile(e.target.files?.[0] || null)} />
                    {templateFile && <p className="text-xs text-muted-foreground">{templateFile.name} </p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Pricing *</Label>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="radio" checked={priceCents === 0} onChange={() => setPriceCents(0)} /> Free
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="radio" checked={priceCents === 100} onChange={() => setPriceCents(100)} /> Premium ($1)
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Options</Label>
                    <div className="flex items-center gap-2">
                      <Switch checked={isInBundle} onCheckedChange={setIsInBundle} />
                      <span className="text-sm text-muted-foreground">Include in $5 bundle</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="radio" checked={isActive} onChange={() => setIsActive(true)} /> Published
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="radio" checked={!isActive} onChange={() => setIsActive(false)} /> Draft
                      </label>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Tags (comma-separated)</Label>
                  <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="creative, modern, colorful" />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => { setIsActive(false); handleSave(); }} className="rounded-full">Save as Draft</Button>
                  <Button onClick={() => { setIsActive(true); handleSave(); }} className="rounded-full">
                    <Upload className="h-4 w-4 mr-2" /> Publish
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="space-y-8">
            {(["resume", "portfolio", "email"] as const).map((type) => {
              const typeTemplates = getByType(type);
              const emptySlotsCount = Math.max(0, SLOTS_PER_CATEGORY - typeTemplates.length);
              const config = categoryConfig[type];

              return (
                <Card key={type} className="rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-2">
                      {config.icon}
                      <h3 className="font-semibold text-foreground">{config.label}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {typeTemplates.length} uploaded, {emptySlotsCount} empty
                      </Badge>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Preview</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Downloads</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {typeTemplates.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>
                            {t.preview_image_url ? (
                              <img src={t.preview_image_url} alt="" className="w-12 h-9 object-cover rounded" />
                            ) : (
                              <div className="w-12 h-9 rounded bg-muted flex items-center justify-center">{config.icon}</div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{t.title}</TableCell>
                          <TableCell>{t.price_cents === 0 ? "Free" : `$${(t.price_cents / 100).toFixed(0)}`}</TableCell>
                          <TableCell>
                            <Badge variant={t.is_active ? "default" : "secondary"} className="text-xs">
                              {t.is_active ? " Live" : "Draft"}
                            </Badge>
                          </TableCell>
                          <TableCell>{t.download_count}</TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(t)} title="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleToggleActive(t.id, t.is_active)} title="Toggle status">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} title="Delete">
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Empty slots */}
                      {Array.from({ length: emptySlotsCount }).map((_, i) => (
                        <TableRow key={`empty-${type}-${i}`} className="opacity-50">
                          <TableCell>
                            <div className="w-12 h-9 rounded border-2 border-dashed border-border flex items-center justify-center">
                              <Plus className="h-3 w-3 text-muted-foreground" />
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground italic">Coming Soon</TableCell>
                          <TableCell className="text-muted-foreground">—</TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs">Draft</Badge></TableCell>
                          <TableCell className="text-muted-foreground">—</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { resetForm(); setTemplateType(type); setShowForm(true); }}
                              title="Add template"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              );
            })}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Revenue Overview</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Revenue</span>
                      <span className="font-bold text-foreground">${(totalRevenue / 100).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">This Month</span>
                      <span className="font-bold text-foreground">${(monthRevenue / 100).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Purchases</span>
                      <span className="font-bold text-foreground">{purchases.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Top Performers</h3>
                  </div>
                  <div className="space-y-2">
                    {[...templates]
                      .sort((a, b) => b.download_count - a.download_count)
                      .slice(0, 3)
                      .map((t, i) => (
                        <div key={t.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground truncate">
                            {i + 1}. {t.title}
                          </span>
                          <span className="font-medium text-foreground shrink-0 ml-2">{t.download_count} DL</span>
                        </div>
                      ))}
                    {templates.length === 0 && <p className="text-sm text-muted-foreground">No templates yet</p>}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Download className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Download Stats</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Downloads</span>
                      <span className="font-bold text-foreground">{totalDownloads}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Free</span>
                      <span className="font-bold text-foreground">{freeDownloads}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Paid</span>
                      <span className="font-bold text-foreground">{totalDownloads - freeDownloads}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Modal */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Template" : "Add New Template"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Creative Resume" /></div>
              <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Stand out with this modern design" /></div>
              <div>
                <Label>Category</Label>
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
              <div className="flex items-center gap-3"><Switch checked={isInBundle} onCheckedChange={setIsInBundle} /><Label>Include in bundle</Label></div>
              <div className="flex items-center gap-3"><Switch checked={isActive} onCheckedChange={setIsActive} /><Label>Published (visible on shop)</Label></div>
              <div><Label>Tags (comma separated)</Label><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="creative, modern, designer" /></div>
              <div><Label>Preview Image</Label><Input type="file" accept="image/*" onChange={(e) => setPreviewFile(e.target.files?.[0] || null)} /></div>
              <div><Label>Template File (.docx, .pdf, .zip)</Label><Input type="file" accept=".docx,.pdf,.zip,.pptx" onChange={(e) => setTemplateFile(e.target.files?.[0] || null)} /></div>
              <Button onClick={handleSave} className="w-full rounded-full">{editingId ? "Update Template" : "Save Template"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
