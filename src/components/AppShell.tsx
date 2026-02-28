import { useLocation, useNavigate } from "react-router-dom";
import { Home, Calendar, FolderOpen, Menu, X, Settings, LogOut, ChevronDown, ChevronUp, Briefcase, Plane, Users, DollarSign, TrendingUp, Sparkles, MessageSquareHeart, Shield, MoreHorizontal, Mail } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { supabase } from "@/integrations/supabase/client";
import { useWaitingCount } from "@/hooks/useGmail";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import FloatingCloud from "@/components/journal/FloatingCloud";
import JournalEntryModal from "@/components/journal/JournalEntryModal";
import { TrialBadge } from "@/components/TrialBadge";

// ... keep existing code (projectFolders, defaultIconColors, IconBubble, NotionProfileMenu, SidebarNav - lines 11-341)

const defaultIconColors: Record<string, string> = {
  home: "#8B5CF6",
  projects: "#F59E0B",
  finance: "#10B981",
  finance_wealth: "#10B981",
  finance_apps: "#3B82F6",
  calendar: "#3B82F6",
  vision: "#EC4899",
  inbox: "#7C3AED",
  team: "#6B7280",
};

/** Refined icon wrapper — subtle tint, clean lines, no heavy shadows */
function IconBubble({ icon: Icon, color, size = 17 }: { icon: any; color: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-lg transition-all duration-200 group-hover:scale-105"
      style={{
        width: size + 8,
        height: size + 8,
        background: `${color}12`,
      }}
    >
      <Icon
        className="shrink-0"
        style={{ color, width: size, height: size, strokeWidth: 1.75 }}
      />
    </span>
  );
}

function NotionProfileMenu({ collapsed }: { collapsed?: boolean }) {
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

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();
  const avatarUrl = prefs?.profile_photo;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-secondary"
      >
        {/* Avatar */}
        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-md bg-muted">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary text-sm font-semibold text-primary-foreground">
              {initials}
            </div>
          )}
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0 text-left">
              <div className="truncate text-sm font-medium text-foreground">{displayName}</div>
              <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
            </div>
            <ChevronUp
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                !open && "rotate-180"
              )}
            />
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 right-0 z-[1000] mb-2 rounded-xl border border-border bg-card p-1.5 shadow-lg"
          >
            <button
              onClick={() => { setOpen(false); navigate("/settings"); }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary"
            >
              <Settings className="h-[18px] w-[18px] text-muted-foreground" />
              Settings
            </button>
            <button
              onClick={() => { setOpen(false); navigate("/settings?tab=support"); }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary"
            >
              <MessageSquareHeart className="h-[18px] w-[18px] text-muted-foreground" />
              Feedback
            </button>
            <div className="mx-2 my-1 h-px bg-border" />
            <button
              onClick={async () => { setOpen(false); await signOut(); navigate("/login"); }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-[18px] w-[18px]" />
              Log out
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
  const { user } = useAuth();
  const { data: prefs } = useUserPreferences();
  const [isAdmin, setIsAdmin] = useState(false);
  const iconColors = (prefs?.accent_colors as any)?.icon_colors || {};
  const getIconColor = (key: string) => iconColors[key] || defaultIconColors[key] || "#6B7280";

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "super_admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const isProjectsActive = location.pathname.startsWith("/projects") || location.pathname.startsWith("/project/");

  const topItems = [
    { icon: Home, label: "Home", path: "/dashboard", colorKey: "home" },
  ];

  const [financeOpen, setFinanceOpen] = useState(
    location.pathname.startsWith("/finance")
  );
  const isFinanceActive = location.pathname.startsWith("/finance");

  const waitingCount = useWaitingCount();

  const bottomItems = [
    { icon: Mail, label: "Priority Inbox", path: "/inbox", colorKey: "inbox" },
    { icon: Sparkles, label: "Content Planner", path: "/vision", colorKey: "vision" },
  ];

  const go = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const NavItem = ({ icon: Icon, label, path, isActive, colorKey }: { icon: any; label: string; path: string; isActive: boolean; colorKey: string }) => (
    <li>
      <button
        onClick={() => go(path)}
        className={cn(
          "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium tracking-tight transition-all duration-150",
          isActive
            ? "bg-accent text-accent-foreground shadow-xs"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
      >
        <IconBubble icon={Icon} color={getIconColor(colorKey)} />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{label}</span>
            {colorKey === "inbox" && waitingCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                {waitingCount}
              </span>
            )}
          </>
        )}
      </button>
    </li>
  );

  return (
    <ul role="list" className="flex flex-1 flex-col gap-y-0.5">
      {topItems.map((item) => (
        <NavItem key={item.path} {...item} isActive={location.pathname.startsWith(item.path)} />
      ))}

      {/* Projects with sub-folders */}
      <NavItem icon={FolderOpen} label="Projects" path="/projects" isActive={isProjectsActive} colorKey="projects" />

      {/* Finance with sub-folders */}
      <li>
       <button
            onClick={() => {
              if (collapsed) { go("/finance/wealth"); return; }
              setFinanceOpen(!financeOpen);
              if (!isFinanceActive) go("/finance/wealth");
            }}
            className={cn(
              "group flex w-full items-center gap-3 rounded-sm px-3 py-1.5 text-sm font-medium transition-all duration-150",
              isFinanceActive
                ? "bg-accent text-accent-foreground shadow-xs"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
          <IconBubble icon={DollarSign} color={getIconColor("finance")} />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Finance</span>
              <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-200", financeOpen && "rotate-180")} />
            </>
          )}
        </button>

        {!collapsed && (
          <AnimatePresence initial={false}>
            {financeOpen && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <li>
                  <button
                    onClick={() => go("/finance/wealth")}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-sm py-1.5 pl-10 pr-3 text-sm transition-all duration-150",
                      location.pathname === "/finance/wealth"
                        ? "font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <IconBubble icon={TrendingUp} color={getIconColor("finance_wealth")} size={16} />
                    Wealth Tracker
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => go("/finance/applications")}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-sm py-1.5 pl-10 pr-3 text-sm transition-all duration-150",
                      location.pathname === "/finance/applications"
                        ? "font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <IconBubble icon={Briefcase} color={getIconColor("finance_apps")} size={16} />
                    Applications Tracker
                  </button>
                </li>
              </motion.ul>
            )}
          </AnimatePresence>
        )}
      </li>

      {bottomItems.map((item) => (
        <NavItem key={item.path} {...item} isActive={location.pathname.startsWith(item.path)} />
      ))}

      {/* Admin link - only for super_admin */}
      {isAdmin && (
        <NavItem icon={Shield} label="Admin" path="/admin" isActive={location.pathname === "/admin"} colorKey="home" />
      )}
    </ul>
  );
}

/** Fixed bottom tab bar for mobile — iOS/Android native feel */
function MobileTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: prefs } = useUserPreferences();
  const iconColors = (prefs?.accent_colors as any)?.icon_colors || {};
  const getIconColor = (key: string) => iconColors[key] || defaultIconColors[key] || "#6B7280";

  const tabs = [
    { icon: Home, label: "Home", path: "/dashboard", colorKey: "home" },
    { icon: FolderOpen, label: "Projects", path: "/projects", colorKey: "projects" },
    { icon: DollarSign, label: "Finance", path: "/finance/wealth", colorKey: "finance" },
    { icon: Mail, label: "Inbox", path: "/inbox", colorKey: "inbox" },
    { icon: MoreHorizontal, label: "More", path: "/__more__", colorKey: "team" },
  ];

  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const moreItems = [
    { icon: Sparkles, label: "Content Planner", path: "/vision" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const isActive = (path: string) => {
    if (path === "/projects") return location.pathname.startsWith("/projects") || location.pathname.startsWith("/project/");
    if (path === "/finance/wealth") return location.pathname.startsWith("/finance");
    if (path === "/__more__") return ["/vision", "/settings"].some(p => location.pathname.startsWith(p));
    return location.pathname.startsWith(path);
  };

  return (
    <div className="mobile-tab-bar fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <nav
        className="flex items-stretch border-t border-border bg-card/95 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const Icon = tab.icon;
          const color = active ? getIconColor(tab.colorKey) : undefined;

          if (tab.path === "/__more__") {
            return (
              <div key="more" className="relative flex-1" ref={moreRef}>
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  className={cn(
                    "mobile-tab-item flex w-full flex-col items-center justify-center gap-0.5 py-2",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" style={color ? { color } : undefined} strokeWidth={active ? 2 : 1.5} />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </button>

                <AnimatePresence>
                  {moreOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full right-0 mb-2 mr-1 w-48 rounded-2xl border border-border bg-card p-1.5 shadow-xl"
                    >
                      {moreItems.map((item) => {
                        const ItemIcon = item.icon;
                        const itemActive = location.pathname.startsWith(item.path);
                        return (
                          <button
                            key={item.path}
                            onClick={() => { setMoreOpen(false); navigate(item.path); }}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                              itemActive ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-secondary"
                            )}
                          >
                            <ItemIcon className="h-5 w-5" />
                            {item.label}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "mobile-tab-item flex flex-1 flex-col items-center justify-center gap-0.5 py-2",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" style={color ? { color } : undefined} strokeWidth={active ? 2 : 1.5} />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {active && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute top-0 h-[2px] w-8 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function ContentWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isFullBleed = location.pathname === "/vision";

  if (isFullBleed) {
    return <div className="h-full">{children}</div>;
  }

  return (
    <div className="mobile-main-content mx-auto max-w-[1400px] px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-12">
      {children}
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Announcement Banner */}
      <AnnouncementBanner />
      
      {/* Desktop Sidebar — unchanged, hidden on mobile via lg: prefix */}
      <div
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-200",
          collapsed ? "lg:w-[60px]" : "lg:w-[240px]"
        )}
      >
        <div className="flex grow flex-col border-r border-border bg-card">
          {/* Logo area */}
          <div className="flex h-16 shrink-0 items-center justify-between px-4">
            {!collapsed ? (
              <div className="flex items-center gap-2.5">
                <span className="text-md font-semibold text-foreground">Digital Home</span>
                <TrialBadge />
              </div>
            ) : (
              <div className="mx-auto">
                <span className="text-sm font-bold text-foreground">DH</span>
              </div>
            )}
          </div>

          {/* Scrollable navigation */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-1.5">
            <SidebarNav collapsed={collapsed} />
          </nav>

          {/* Bottom profile section - Notion style */}
          <div className="shrink-0 border-t border-border px-2 py-2">
            <div className="flex items-center gap-1">
              <div className="flex-1 min-w-0">
                <NotionProfileMenu collapsed={collapsed} />
              </div>
              {!collapsed && (
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  aria-label="Collapse sidebar"
                >
                  <ChevronDown className="h-4 w-4 rotate-90 transition-transform" />
                </button>
              )}
            </div>
            {collapsed && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="mt-1 flex w-full justify-center rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Expand sidebar"
              >
                <ChevronDown className="h-4 w-4 -rotate-90 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Header — slim top bar */}
      <div className="mobile-header sticky top-0 z-40 flex h-12 items-center gap-x-3 border-b border-border bg-card/95 px-4 backdrop-blur-xl lg:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Toggle sidebar"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm font-semibold text-foreground">Digital Home</span>
          <TrialBadge />
        </div>
        <NotionProfileMenu collapsed />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col border-r border-border bg-card lg:hidden"
            >
              {/* Mobile sidebar header */}
              <div className="flex h-14 shrink-0 items-center justify-between px-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-md font-semibold text-foreground">Digital Home</span>
                  <TrialBadge />
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable navigation */}
              <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-1.5">
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
              </nav>

              {/* Bottom profile section */}
              <div className="shrink-0 border-t border-border px-2 py-2">
                <NotionProfileMenu />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Tab Bar — removed, using sidebar instead */}

      {/* Floating Cloud → Journal */}
      <FloatingCloud onClick={() => setJournalOpen(true)} />
      <JournalEntryModal open={journalOpen} onClose={() => setJournalOpen(false)} />

      {/* Main Content */}
      <main className={cn("transition-all duration-200", collapsed ? "lg:pl-[60px]" : "lg:pl-[240px]")}>
        <ContentWrapper>{children}</ContentWrapper>
      </main>
    </div>
  );
}
