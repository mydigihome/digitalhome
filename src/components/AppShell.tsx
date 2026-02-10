import { useLocation, useNavigate } from "react-router-dom";
import { Home, Calendar, FolderOpen, Menu, X, Settings, LogOut } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { icon: Home, label: "Home Office", path: "/dashboard" },
  { icon: FolderOpen, label: "Projects", path: "/projects" },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
];

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
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-md"
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
            className="absolute left-0 top-12 z-50 w-56 rounded-xl border border-border bg-card p-1 shadow-lg"
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
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-card px-6 pb-4">
          {/* Logo */}
          <div className="flex h-20 shrink-0 items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80">
                <span className="text-xl font-bold text-primary-foreground">D</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Digital Home</h1>
                <p className="text-xs text-muted-foreground">Your life in one place</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path) ||
                  (item.path === "/projects" && location.pathname.startsWith("/project/"));
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => navigate(item.path)}
                      className={cn(
                        "group flex w-full gap-x-3 rounded-xl p-3 text-sm font-semibold leading-6 transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-primary"
                      )}
                    >
                      <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Profile at Bottom */}
          <div className="border-t border-border pt-4">
            <UserDropdown />
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="sticky top-0 z-40 flex items-center gap-x-4 border-b border-border bg-card/80 px-4 py-4 shadow-sm backdrop-blur-md lg:hidden">
        <button
          className="-m-2.5 p-2.5 text-muted-foreground"
          onClick={() => setMobileOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="flex-1 text-sm font-semibold leading-6 text-foreground">
          Digital Home
        </div>
        <UserDropdown />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="relative z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/80"
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed inset-0 flex">
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative mr-16 flex w-full max-w-xs flex-1"
              >
                <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button className="-m-2.5 p-2.5" onClick={() => setMobileOpen(false)}>
                    <span className="sr-only">Close sidebar</span>
                    <X className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card px-6 pb-4">
                  <div className="flex h-20 shrink-0 items-center">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80">
                        <span className="text-xl font-bold text-primary-foreground">D</span>
                      </div>
                      <div>
                        <h1 className="text-xl font-bold text-foreground">Digital Home</h1>
                        <p className="text-xs text-muted-foreground">Your life in one place</p>
                      </div>
                    </div>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-2">
                      {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.path) ||
                          (item.path === "/projects" && location.pathname.startsWith("/project/"));
                        return (
                          <li key={item.path}>
                            <button
                              onClick={() => {
                                navigate(item.path);
                                setMobileOpen(false);
                              }}
                              className={cn(
                                "group flex w-full gap-x-3 rounded-xl p-3 text-sm font-semibold leading-6 transition-colors",
                                isActive
                                  ? "bg-primary/10 text-primary"
                                  : "text-muted-foreground hover:bg-secondary hover:text-primary"
                              )}
                            >
                              <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                              {item.label}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </nav>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:pl-72">
        <div className="mx-auto max-w-[1200px] px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
