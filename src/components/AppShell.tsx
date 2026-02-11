import { useLocation, useNavigate } from "react-router-dom";
import { Home, Calendar, FolderOpen, Menu, X, Settings, LogOut, ChevronDown, Briefcase, Plane, Users, DollarSign } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import HouseIcon from "@/components/HouseIcon";

const projectFolders = [
  { id: "personal", label: "Personal Projects", icon: Home, color: "text-primary" },
  { id: "work", label: "Work", icon: Briefcase, color: "text-info" },
  { id: "travel", label: "Trips", icon: Plane, color: "text-warning" },
];

const iconColors: Record<string, string> = {
  "/dashboard": "text-primary",
  "/calendar": "text-info",
  "/projects": "text-warning",
  "/finance": "text-success",
  "/team": "text-muted-foreground",
  "/settings": "text-muted-foreground",
};

function UserDropdown() {
  const { profile, user, signOut } = useAuth();
  const { data: prefs } = useUserPreferences();
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
  const avatarUrl = prefs?.profile_photo;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-xs font-medium text-primary-foreground transition-all hover:shadow-md active:scale-95 overflow-hidden"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-10 z-50 w-52 rounded-lg border border-border bg-card p-1.5 shadow-lg"
          >
            <div className="px-3 py-2 text-xs text-muted-foreground truncate">{user?.email}</div>
            <button
              onClick={() => { setOpen(false); navigate("/settings"); }}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-secondary"
            >
              <Settings className="h-4 w-4 text-muted-foreground" /> Settings
            </button>
            <button
              onClick={async () => { await signOut(); navigate("/login"); }}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarNav({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [projectsOpen, setProjectsOpen] = useState(
    location.pathname.startsWith("/projects") || location.pathname.startsWith("/project/")
  );

  const isProjectsActive = location.pathname.startsWith("/projects") || location.pathname.startsWith("/project/");
  const searchParams = new URLSearchParams(location.search);
  const activeType = searchParams.get("type");

  const topItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
  ];

  const bottomItems = [
    { icon: DollarSign, label: "Finance", path: "/finance" },
    { icon: Calendar, label: "Calendar", path: "/calendar" },
    { icon: Users, label: "Team", path: "/team" },
  ];

  const go = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const NavItem = ({ icon: Icon, label, path, isActive }: { icon: any; label: string; path: string; isActive: boolean }) => (
    <li>
      <button
        onClick={() => go(path)}
        className={cn(
          "group flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium transition-all duration-150",
          isActive
            ? "bg-accent text-accent-foreground shadow-xs"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
      >
        <Icon className={cn("h-[18px] w-[18px] shrink-0", iconColors[path] || "text-muted-foreground")} />
        {!collapsed && <span>{label}</span>}
      </button>
    </li>
  );

  return (
    <ul role="list" className="flex flex-1 flex-col gap-y-0.5">
      {topItems.map((item) => (
        <NavItem key={item.path} {...item} isActive={location.pathname.startsWith(item.path)} />
      ))}

      {/* Projects with sub-folders */}
      <li>
        <button
          onClick={() => {
            if (collapsed) { go("/projects"); return; }
            setProjectsOpen(!projectsOpen);
            if (!isProjectsActive) go("/projects");
          }}
          className={cn(
            "group flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium transition-all duration-150",
            isProjectsActive
              ? "bg-accent text-accent-foreground shadow-xs"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <FolderOpen className="h-[18px] w-[18px] shrink-0 text-warning" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Projects</span>
              <ChevronDown
                className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-200", projectsOpen && "rotate-180")}
              />
            </>
          )}
        </button>

        {!collapsed && (
          <AnimatePresence initial={false}>
            {projectsOpen && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {projectFolders.map((folder) => {
                  const Icon = folder.icon;
                  const isActive = location.pathname === "/projects" && activeType === folder.id;
                  return (
                    <li key={folder.id}>
                      <button
                        onClick={() => go(`/projects?type=${folder.id}`)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-sm py-1.5 pl-10 pr-3 text-sm transition-all duration-150",
                          isActive
                            ? "font-medium text-accent-foreground"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", folder.color)} />
                        {folder.label}
                      </button>
                    </li>
                  );
                })}
              </motion.ul>
            )}
          </AnimatePresence>
        )}
      </li>

      {bottomItems.map((item) => (
        <NavItem key={item.path} {...item} isActive={location.pathname.startsWith(item.path)} />
      ))}
    </ul>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-200",
          collapsed ? "lg:w-[60px]" : "lg:w-[240px]"
        )}
      >
        <div className="flex grow flex-col overflow-y-auto border-r border-border bg-card">
          {/* Logo area */}
          <div className="flex h-16 shrink-0 items-center justify-between px-4">
            {!collapsed ? (
              <div className="flex items-center gap-2.5">
                <HouseIcon size={28} />
                <span className="text-md font-semibold text-foreground">Digital Home</span>
              </div>
            ) : (
              <div className="mx-auto">
                <HouseIcon size={24} />
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col px-2 py-2">
            <SidebarNav collapsed={collapsed} />
          </nav>

          {/* Bottom section */}
          <div className="border-t border-border px-3 py-3 flex items-center justify-between">
            <UserDropdown />
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform", collapsed ? "-rotate-90" : "rotate-90")} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="sticky top-0 z-40 flex h-12 items-center gap-x-3 border-b border-border bg-card/95 px-4 backdrop-blur-sm lg:hidden">
        <button
          className="p-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => setMobileOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <HouseIcon size={20} />
          <span className="text-sm font-semibold text-foreground">Digital Home</span>
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
              className="fixed inset-0 bg-foreground/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed inset-0 flex">
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative mr-16 flex w-full max-w-[240px] flex-1"
              >
                <div className="absolute left-full top-0 flex w-16 justify-center pt-3">
                  <button className="p-1.5" onClick={() => setMobileOpen(false)}>
                    <span className="sr-only">Close sidebar</span>
                    <X className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex grow flex-col overflow-y-auto bg-card">
                  <div className="flex h-16 shrink-0 items-center px-4">
                    <div className="flex items-center gap-2.5">
                      <HouseIcon size={28} />
                      <span className="text-md font-semibold text-foreground">Digital Home</span>
                    </div>
                  </div>
                  <nav className="flex flex-1 flex-col px-2 py-2">
                    <SidebarNav onNavigate={() => setMobileOpen(false)} />
                  </nav>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={cn("transition-all duration-200", collapsed ? "lg:pl-[60px]" : "lg:pl-[240px]")}>
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
