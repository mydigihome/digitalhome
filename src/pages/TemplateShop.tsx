import { useState, useEffect } from "react";
import { useShopTemplates, ShopTemplate } from "@/hooks/useShopTemplates";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Briefcase, Download, X, ExternalLink, Sparkles, FileText, Mail, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BUNDLE_PRICE_CENTS = 500;

const typeIcons: Record<string, React.ReactNode> = {
  resume: <FileText className="h-4 w-4" />,
  portfolio: <Palette className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
};

const ctaMessages = [
  { icon: "💼", text: "Want to track your applications too?", cta: "Try Digital Home Free", link: "/signup" },
  { icon: "✉️", text: "Need a portfolio or cold email template?", cta: "Browse our complete library below ↓", link: null },
];

export default function TemplateShop() {
  const { data: templates, isLoading } = useShopTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<ShopTemplate | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [ctaIndex, setCTAIndex] = useState(0);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("template_banner_dismissed");
    if (dismissed) setBannerDismissed(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCTAIndex((i) => (i + 1) % ctaMessages.length), 8000);
    return () => clearInterval(interval);
  }, []);

  const dismissBanner = () => {
    setBannerDismissed(true);
    sessionStorage.setItem("template_banner_dismissed", "true");
  };

  const freeTemplates = templates?.filter((t) => t.price_cents === 0) || [];
  const premiumTemplates = templates?.filter((t) => t.price_cents > 0) || [];
  const bundleTemplates = templates?.filter((t) => t.is_in_bundle) || [];

  const handleFreeDownload = async (template: ShopTemplate) => {
    if (!template.file_url) {
      toast.error("Template file not available yet");
      return;
    }
    // Track download
    try {
      await (supabase as any).from("template_downloads").insert({
        template_id: template.id,
      });
    } catch {}
    // Download
    window.open(template.file_url, "_blank");
    toast.success("Download started!");
    setSelectedTemplate(null);
  };

  const handleBuyNow = async (template: ShopTemplate) => {
    toast.info("Stripe checkout coming in Phase 2!");
  };

  const handleBuyBundle = async () => {
    toast.info("Bundle checkout coming in Phase 2!");
  };

  const cta = ctaMessages[ctaIndex];

  return (
    <div className="min-h-screen bg-background">
      {/* CTA Banner */}
      {!bannerDismissed && (
        <div className="relative bg-gradient-to-r from-[hsl(258,89%,66%)] to-[hsl(280,80%,60%)] text-white px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-center gap-3 text-sm font-medium">
            <span>{cta.icon}</span>
            <span>{cta.text}</span>
            {cta.link && (
              <a
                href={cta.link}
                className="underline underline-offset-2 font-semibold hover:opacity-80 transition"
              >
                {cta.cta}
              </a>
            )}
          </div>
          <button
            onClick={dismissBanner}
            className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Hero */}
      <header className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-accent mb-6">
            <Briefcase className="h-8 w-8 text-accent-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Free Career Templates
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Professional resumes, portfolios, and email templates to level up your career
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-14">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 rounded-3xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Free Templates */}
            {freeTemplates.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-foreground mb-1">🎁 Free Downloads</h2>
                <p className="text-muted-foreground text-sm mb-6">No account needed</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {freeTemplates.map((t) => (
                    <TemplateCard
                      key={t.id}
                      template={t}
                      onSelect={() => setSelectedTemplate(t)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Premium Templates */}
            {premiumTemplates.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-foreground mb-1">💎 Premium Templates</h2>
                <p className="text-muted-foreground text-sm mb-6">$1 each</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {premiumTemplates.map((t) => (
                    <TemplateCard
                      key={t.id}
                      template={t}
                      onSelect={() => setSelectedTemplate(t)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Bundle */}
            {bundleTemplates.length > 0 && (
              <section>
                <Card className="bg-gradient-to-br from-accent to-card border-2 border-primary/20 rounded-3xl overflow-hidden">
                  <CardContent className="p-8 text-center">
                    <div className="text-3xl mb-2">🎁</div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Complete Career Kit</h2>
                    <p className="text-muted-foreground mb-4">
                      Get ALL {bundleTemplates.length} templates — resumes, portfolios & emails
                    </p>
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <span className="text-muted-foreground line-through text-lg">
                        ${(premiumTemplates.reduce((s, t) => s + t.price_cents, 0) / 100).toFixed(0)}
                      </span>
                      <span className="text-3xl font-bold text-foreground">
                        ${(BUNDLE_PRICE_CENTS / 100).toFixed(0)}
                      </span>
                      <Badge className="bg-success text-success-foreground">
                        SAVE ${((premiumTemplates.reduce((s, t) => s + t.price_cents, 0) - BUNDLE_PRICE_CENTS) / 100).toFixed(0)}
                      </Badge>
                    </div>
                    <Button
                      size="lg"
                      className="rounded-full px-8 bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={handleBuyBundle}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Get Complete Bundle — ${(BUNDLE_PRICE_CENTS / 100).toFixed(0)}
                    </Button>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Empty state */}
            {(!templates || templates.length === 0) && (
              <div className="text-center py-20">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">Templates coming soon!</h2>
                <p className="text-muted-foreground">
                  We're preparing premium career templates. Check back soon.
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-10">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Digital Home. Built for ambitious careers.
          </p>
          <a
            href="/signup"
            className="text-primary hover:underline mt-2 inline-block"
          >
            Create your free Digital Home account →
          </a>
        </div>
      </footer>

      {/* Preview Modal */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedTemplate.title}</DialogTitle>
              </DialogHeader>
              {selectedTemplate.preview_image_url && (
                <div className="rounded-xl overflow-hidden border border-border bg-muted max-h-80 overflow-y-auto">
                  <img
                    src={selectedTemplate.preview_image_url}
                    alt={selectedTemplate.title}
                    className="w-full object-contain"
                  />
                </div>
              )}
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">{selectedTemplate.description}</p>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">What's Included:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Editable .docx file</li>
                    <li>• PDF version</li>
                    <li>• Instructions for customization</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Perfect for:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTemplate.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                {selectedTemplate.price_cents === 0 ? (
                  <Button
                    className="flex-1 rounded-full bg-primary text-primary-foreground"
                    onClick={() => handleFreeDownload(selectedTemplate)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Free
                  </Button>
                ) : (
                  <Button
                    className="flex-1 rounded-full bg-primary text-primary-foreground"
                    onClick={() => handleBuyNow(selectedTemplate)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Buy Now — ${(selectedTemplate.price_cents / 100).toFixed(2)}
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TemplateCard({
  template,
  onSelect,
}: {
  template: ShopTemplate;
  onSelect: () => void;
}) {
  const isPremium = template.price_cents > 0;

  return (
    <Card
      className="group cursor-pointer rounded-3xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-border"
      onClick={onSelect}
    >
      {/* Preview image */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {template.preview_image_url ? (
          <img
            src={template.preview_image_url}
            alt={template.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            {typeIcons[template.template_type] || <FileText className="h-10 w-10 text-muted-foreground/50" />}
          </div>
        )}
        {isPremium && (
          <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs">
            💎 PREMIUM
          </Badge>
        )}
      </div>

      <CardContent className="p-4 space-y-2">
        <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
          {template.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="font-bold text-foreground">
            {isPremium ? `$${(template.price_cents / 100).toFixed(0)}` : "$0"}
          </span>
          <Button
            size="sm"
            variant={isPremium ? "default" : "secondary"}
            className="rounded-full text-xs h-8"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            {isPremium ? "Buy Now" : "Download Free"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
