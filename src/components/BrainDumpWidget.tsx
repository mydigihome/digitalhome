import { Sparkles, ListTodo } from "lucide-react";
import { useBrainDumps, BrainDump } from "@/hooks/useBrainDumps";
import { formatDistanceToNow, format } from "date-fns";
import { useAnimatedIcon, AnimatedIconImage } from "@/components/AnimatedIcons";

function hexToRgba(hex: string, opacity: number) {
  if (!hex || !hex.startsWith("#")) return undefined;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity / 100})`;
}

export default function BrainDumpWidget() {
  const { data: dumps = [] } = useBrainDumps();
  const currentIcon = useAnimatedIcon();

  const recentDumps = dumps.slice(0, 5);

  if (recentDumps.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Brain Dump</h3>
        </div>
        <AnimatedIconImage icon={currentIcon} size={24} />
      </div>

      <div className="space-y-2">
        {recentDumps.map((dump) => {
          const structured = dump.structured_data as any;
          const taskCount = structured?.tasks?.length || 0;
          const title = dump.ai_title || dump.content.slice(0, 40);
          const summary = dump.summary || dump.content.slice(0, 80);
          const timeLabel = format(new Date(dump.created_at), "h:mma").toLowerCase();
          const bgColor = hexToRgba(dump.card_color || "#8B5CF6", (dump as any).card_opacity ?? 92);

          return (
            <div
              key={dump.id}
              className="flex items-start gap-3 rounded-lg p-3 transition-all duration-100 hover:shadow-sm hover:-translate-y-0.5 cursor-default"
              style={{ borderLeft: `3px solid ${dump.card_color || "hsl(var(--primary))"}`, background: bgColor }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate" style={{ color: "rgba(0,0,0,0.85)" }}>{title}</span>
                  <span className="text-xs shrink-0" style={{ color: "rgba(0,0,0,0.4)" }}>
                    {format(new Date(dump.created_at), "MMM d")}
                  </span>
                  {taskCount > 0 && (
                    <span className="flex items-center gap-0.5 text-xs shrink-0" style={{ color: "rgba(0,0,0,0.4)" }}>
                      <ListTodo className="h-3 w-3" /> {taskCount}
                    </span>
                  )}
                  <span className="text-xs ml-auto shrink-0" style={{ color: "rgba(0,0,0,0.35)" }}>{timeLabel}</span>
                </div>
                <p className="text-xs truncate mt-0.5" style={{ color: "rgba(0,0,0,0.5)" }}>{summary}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
