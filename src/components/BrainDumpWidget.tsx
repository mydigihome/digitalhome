import { Sparkles, ListTodo } from "lucide-react";
import { useBrainDumps, BrainDump } from "@/hooks/useBrainDumps";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import { RamenIcon, HouseAnimIcon, LampIcon } from "@/components/AnimatedIcons";
import { getActiveIcon } from "@/components/BrainDump";

export default function BrainDumpWidget() {
  const { data: dumps = [] } = useBrainDumps();
  const location = useLocation();
  const hour = new Date().getHours();
  const activeIcon = getActiveIcon(hour, location.pathname);
  const IconComponent = activeIcon === "ramen" ? RamenIcon : activeIcon === "house" ? HouseAnimIcon : LampIcon;

  const recentDumps = dumps.slice(0, 5);

  if (recentDumps.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Brain Dump</h3>
        </div>
        <IconComponent size={24} />
      </div>

      <div className="space-y-2">
        {recentDumps.map((dump) => {
          const structured = dump.structured_data as any;
          const taskCount = structured?.tasks?.length || 0;
          const title = dump.ai_title || dump.content.slice(0, 40);
          const summary = dump.summary || dump.content.slice(0, 80);
          const time = formatDistanceToNow(new Date(dump.created_at), { addSuffix: true });
          const timeLabel = format(new Date(dump.created_at), "h:mma").toLowerCase();

          return (
            <div
              key={dump.id}
              className="flex items-start gap-3 rounded-lg p-3 transition-all duration-100 hover:bg-secondary cursor-default"
              style={{ borderLeft: `3px solid ${dump.card_color || "hsl(var(--primary))"}` }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">{title}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {format(new Date(dump.created_at), "MMM d")}
                  </span>
                  {taskCount > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground shrink-0">
                      <ListTodo className="h-3 w-3" /> {taskCount}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto shrink-0">{timeLabel}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{summary}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
