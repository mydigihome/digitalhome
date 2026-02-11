import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ThemePreviewProps {
  accentColor: string;
  fontSize: string;
  fontFamily: string;
  density: string;
}

export default function ThemePreview({
  accentColor,
  fontSize,
  fontFamily,
  density,
}: ThemePreviewProps) {
  const fontSizeMap = {
    small: "13px",
    medium: "14px",
    large: "16px",
  };

  const densityMap = {
    compact: "0.5rem",
    comfortable: "1rem",
    spacious: "1.5rem",
  };

  const previewFontSize = fontSizeMap[fontSize as keyof typeof fontSizeMap] || "14px";
  const previewGap = densityMap[density as keyof typeof densityMap] || "1rem";

  return (
    <Card className="overflow-hidden border-border">
      <div className="p-6 space-y-4" style={{ gap: previewGap, fontFamily, fontSize: previewFontSize, display: "flex", flexDirection: "column" }}>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Preview</p>
          <h3 className="font-semibold text-foreground">Sample heading</h3>
          <p className="text-sm text-muted-foreground mt-1">
            This is how your chosen font, size, and spacing will look across the app.
          </p>
        </div>

        <div className="flex flex-wrap gap-2" style={{ gap: previewGap }}>
          <button
            className="px-3 py-1.5 text-sm font-medium rounded-md text-white transition-all"
            style={{ backgroundColor: accentColor }}
          >
            Primary Button
          </button>
          <button
            className="px-3 py-1.5 text-sm font-medium rounded-md border-2 transition-all"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            Secondary
          </button>
        </div>

        <div className="space-y-2" style={{ gap: previewGap }}>
          <label className="text-sm font-medium text-foreground block">Input field</label>
          <input
            type="text"
            placeholder="Type something..."
            className="w-full px-3 py-2 text-sm border-2 rounded-md bg-card text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors"
            style={{
              borderColor: accentColor,
              borderWidth: "1px",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = accentColor)}
          />
        </div>

        <div className="rounded-lg p-3 border-2" style={{ borderColor: accentColor, backgroundColor: `${accentColor}08` }}>
          <p className="text-xs font-medium" style={{ color: accentColor }}>
            Accent highlight
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Cards and highlights use your accent color.
          </p>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>
            <strong>Font:</strong> {fontFamily}
          </p>
          <p>
            <strong>Size:</strong> {fontSize} ({previewFontSize})
          </p>
          <p>
            <strong>Spacing:</strong> {density}
          </p>
        </div>
      </div>
    </Card>
  );
}
