import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  eventName: string;
  eventDate: string | null;
  location: string | null;
  description: string | null;
}

function generateICS(eventName: string, start: Date, end: Date, location: string, description: string): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Digital Home//EN",
    "BEGIN:VEVENT",
    `SUMMARY:${eventName}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function downloadICS(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AddToCalendarButton({ eventName, eventDate, location, description }: Props) {
  const [open, setOpen] = useState(false);

  if (!eventDate) return null;

  const start = new Date(eventDate);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const loc = location || "";
  const desc = description || "";

  const safeName = eventName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
  const dateStr = start.toISOString().split("T")[0];
  const filename = `${safeName}-${dateStr}.ics`;

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventName)}&dates=${start.toISOString().replace(/[-:]/g, "").split(".")[0]}Z/${end.toISOString().replace(/[-:]/g, "").split(".")[0]}Z&location=${encodeURIComponent(loc)}&details=${encodeURIComponent(desc)}`;

  const outlookUrl = `https://outlook.live.com/calendar/0/action/compose?subject=${encodeURIComponent(eventName)}&startdt=${start.toISOString()}&enddt=${end.toISOString()}&location=${encodeURIComponent(loc)}&body=${encodeURIComponent(desc)}`;

  const icsContent = generateICS(eventName, start, end, loc, desc);

  const options = [
    {
      label: "Apple Calendar",
      emoji: "🍎",
      action: () => downloadICS(icsContent, filename),
    },
    {
      label: "Google Calendar",
      emoji: "📧",
      action: () => window.open(googleUrl, "_blank"),
    },
    {
      label: "Outlook Calendar",
      emoji: "📆",
      action: () => window.open(outlookUrl, "_blank"),
    },
    {
      label: "Download .ics file",
      emoji: "💾",
      action: () => downloadICS(icsContent, filename),
    },
  ];

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="lg"
        onClick={() => setOpen(!open)}
        className="w-full"
      >
        <Calendar className="h-4 w-4 mr-2" /> Add to Calendar
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute left-0 right-0 mt-2 rounded-xl bg-card border border-border shadow-xl overflow-hidden z-10"
          >
            <div className="p-2 border-b border-border flex items-center justify-between px-4">
              <span className="text-sm font-medium text-foreground">Add to Calendar</span>
              <button onClick={() => setOpen(false)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            {options.map((opt) => (
              <button
                key={opt.label}
                onClick={() => { opt.action(); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-secondary/50 transition-colors"
              >
                <span className="text-lg">{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
