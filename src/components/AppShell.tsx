import { useLocation, useNavigate } from "react-router-dom";
import { Home, Calendar, FolderOpen, Settings, Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
  { icon: FolderOpen, label: "Projects", path: "/projects" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

function NavBubble({ icon: Icon, label, path, active }: { icon: any; label: string; path: string; active: boolean }) {
  const navigate = useNavigate();
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate(path)}
      className={cn(
        "flex h-14 w-14 items-center justify-center rounded-full border border-border/20 backdrop-blur-md transition-all",
        active
          ? "bg-card shadow-md"
          : "bg-card/10 hover:bg-card/50"
      )}
      title={label}
    >
      <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
    </motion.button>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed left-4 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-4 md:flex">
        {navItems.map((item) => (
          <NavBubble key={item.path} {...item} active={location.pathname.startsWith(item.path)} />
        ))}
      </aside>

      {/* Mobile header */}
      <div className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md md:hidden">
        <span className="text-base font-medium">Digital Home</span>
        <button onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm md:hidden"
        >
          <div className="flex h-full flex-col items-center justify-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  setMobileOpen(false);
                  window.location.href = item.path;
                }}
                className={cn(
                  "flex items-center gap-3 text-lg",
                  location.pathname.startsWith(item.path) ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Main content */}
      <main className="mx-auto w-full max-w-[1200px] px-6 py-10 md:ml-24 md:px-10">
        <div className="mt-14 md:mt-0">{children}</div>
      </main>
    </div>
  );
}
