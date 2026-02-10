import { useLocation, useNavigate } from "react-router-dom";
import { Home, Calendar, FolderOpen, Sparkles, Menu, X, Settings, LogOut, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
  { icon: FolderOpen, label: "Projects", path: "/projects" },
];

function NavBubble({ icon: Icon, label, path, active, onClick }: { icon: any; label: string; path?: string; active: boolean; onClick?: () => void }) {
  const navigate = useNavigate();
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick || (() => path && navigate(path))}
      className={cn(
        "flex h-14 w-14 items-center justify-center rounded-full border transition-all",
        active
          ? "border-primary/30 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20"
          : "border-border/20 bg-card/60 backdrop-blur-md hover:border-primary/20 hover:shadow-md hover:shadow-primary/10"
      )}
      title={label}
    >
      <Icon className={cn("h-5 w-5", active ? "text-primary-foreground" : "text-muted-foreground")} />
    </motion.button>
  );
}

function UserDropdown() {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = (profile?.full_name || user?.email || "U").slice(0, 2).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
      >
        {initials}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-border bg-card p-1 shadow-lg"
          >
            <div className="px-3 py-2 text-xs text-muted-foreground">{user?.email}</div>
            <button
              onClick={() => { setOpen(false); navigate("/settings"); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-secondary"
            >
              <Settings className="h-4 w-4 text-muted-foreground" /> Settings
            </button>
            <button
              onClick={async () => { await signOut(); navigate("/login"); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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

      {/* Desktop top-right avatar */}
      <div className="fixed right-6 top-5 z-50 hidden md:block">
        <UserDropdown />
      </div>

      {/* Mobile header */}
      <div className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md md:hidden">
        <span className="text-base font-medium">Digital Home</span>
        <div className="flex items-center gap-3">
          <UserDropdown />
          <button onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
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
                  location.pathname.startsWith(item.path) ? "font-medium text-primary" : "text-muted-foreground"
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
