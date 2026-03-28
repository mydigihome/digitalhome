import { useLocation, useNavigate } from "react-router-dom";
import { Home, Folder, Menu, X, Settings, LogOut, ChevronDown, PanelLeftClose, PanelLeft, LayoutGrid, Wallet, Sparkles, MessageSquare, Shield, MoreHorizontal, Mail, Moon, Sun, Users, Lock } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useRef, useEffect, createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUserPreferences, useUpsertPreferences } from "@/hooks/useUserPreferences";
import { supabase } from "@/integrations/supabase/client";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import FloatingCloud from "@/components/journal/FloatingCloud";
import JournalEntryModal from "@/components/journal/JournalEntryModal";
import { WaitlistModal } from "@/components/content-planner/WaitlistModal";

// Context for sidebar collapsed state
const SidebarContext = createContext({ collapsed: false, setCollapsed: (_: boolean) => {} });
export const useSidebar = () => useContext(SidebarContext);

function SidebarNav({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  const { setCollapsed } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { data: prefs } = useUserPreferences();
  const [isAdmin, setIsAdmin] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "super_admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  useEffect(() => {
    // Initialize dark mode from localStorage, then system preference
    const saved = localStorage.getItem("digi-home-theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
      setDarkMode(true);
    } else if (saved === "light") {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
      setDarkMode(false);
    } else {
      // No saved preference — use system
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
        document.body.classList.add("dark");
        setDarkMode(true);
      } else {
        setDarkMode(document.documentElement.classList.contains("dark"));
      }
    }
  }, []);

  const upsertPrefs = useUpsertPreferences();

  const toggleDarkMode = () => {
    const newDark = !darkMode;
    if (newDark) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
    setDarkMode(newDark);
    localStorage.setItem("digi-home-theme", newDark ? "dark" : "light");
    upsertPrefs.mutate({ sidebar_theme: newDark ? "dark" : "light" } as any);
  };

  const isProjectsActive = location.pathname.startsWith("/projects") || location.pathname.startsWith("/project/");
  const isFinanceActive = location.pathname.startsWith("/finance");

  const [financeOpen, setFinanceOpen] = useState(isFinanceActive);

  const go = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard", active: location.pathname.startsWith("/dashboard"), color: "#3B82F6" },
    { icon: Folder, label: "Projects", path: "/projects", active: isProjectsActive, color: "#F97316" },
  ];

  const hasContentAccess = user?.email === "myslimher@gmail.com" || (prefs as any)?.content_planner_is_admin === true || ((prefs as any)?.signup_number != null && (prefs as any)?.signup_number <= 50) || (prefs as any)?.content_planner_access === true;

  const bottomNavItems = [
    { icon: Users, label: "Contacts", path: "/relationships", active: location.pathname.startsWith("/relationships"), color: "#EC4899" },
    { icon: Sparkles, label: "Content Planner", path: "/vision", active: location.pathname.startsWith("/vision"), color: "#F59E0B" },
  ];

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
  const avatarUrl = prefs?.profile_photo;

  const activeStyle = (isActive: boolean) => ({
    backgroundColor: isActive ? 'hsl(var(--accent))' : undefined,
    color: isActive ? 'hsl(var(--accent-foreground))' : 'hsl(var(--muted-foreground))',
    boxShadow: isActive
      ? 'inset 0 0 10px rgba(99,102,241,0.1), 0 2px 8px rgba(99,102,241,0.08)'
      : undefined,
  });

  const iconCircleCn = (isActive: boolean, color?: string) =>
    `w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
      isActive
        ? 'bg-accent border border-accent-foreground/20'
        : 'border border-border group-hover:border-primary/20'
    }`;

  const iconBgStyle = (isActive: boolean, color?: string) => ({
    backgroundColor: isActive ? undefined : color ? `${color}15` : 'hsl(var(--secondary))',
  });

  // Tooltip wrapper for collapsed mode
  const NavTooltip = ({ label, children }: { label: string; children: React.ReactNode }) => {
    if (!collapsed) return <>{children}</>;
    return (
        <div className="relative group/tip">
          {children}
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-foreground text-background text-xs font-medium rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity z-50">
            {label}
          </div>
        </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col h-full">
      {/* Logo + Collapse Toggle */}
      <div className={cn("py-5", collapsed ? "px-3 flex justify-center" : "px-5")}>
        <div className="flex items-center gap-2.5">
          <div className="h-3 w-3 rounded-full bg-primary flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="text-[15px] font-semibold tracking-tight text-foreground flex-1">Digital Home</span>
              <button
                onClick={() => setCollapsed(true)}
                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          )}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Expand sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavTooltip label={item.label}>
                  <button
                    onClick={() => go(item.path)}
                    className={cn(
                      "group flex w-full items-center rounded-xl transition-all duration-200",
                      collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
                     item.active ? "font-medium" : "hover:bg-secondary hover:shadow-sm"
                    )}
                    style={activeStyle(item.active)}
                  >
                    <span className={iconCircleCn(item.active)} style={iconBgStyle(item.active, item.color)}>
                      <Icon className="w-[18px] h-[18px]" style={{ color: item.active ? '#4338CA' : item.color }} strokeWidth={1.5} />
                    </span>
                    {!collapsed && <span className="flex-1 text-left text-[14px]">{item.label}</span>}
                  </button>
                </NavTooltip>
              </li>
            );
          })}

          {/* Money - Expandable */}
          <li>
            <NavTooltip label="Money">
              <button
                onClick={() => {
                  if (collapsed) {
                    go("/finance/wealth");
                    return;
                  }
                  if (isFinanceActive) {
                    setFinanceOpen(!financeOpen);
                  } else {
                    go("/finance/wealth");
                    setFinanceOpen(true);
                  }
                }}
                className={cn(
                  "group flex w-full items-center rounded-xl transition-all duration-200",
                  collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
                  isFinanceActive ? "font-medium" : "hover:bg-secondary hover:shadow-sm"
                )}
                style={activeStyle(isFinanceActive)}
              >
                 <span className={iconCircleCn(isFinanceActive)} style={iconBgStyle(isFinanceActive, '#10B981')}>
                   <Wallet className="w-[18px] h-[18px]" style={{ color: isFinanceActive ? 'hsl(var(--accent-foreground))' : '#10B981' }} strokeWidth={1.5} />
                 </span>
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left text-[14px]">Money</span>
                     <ChevronDown
                       className="shrink-0 transition-transform duration-200"
                       style={{
                         width: 14, height: 14,
                         color: isFinanceActive ? 'hsl(var(--accent-foreground))' : 'hsl(var(--muted-foreground))',
                        transform: financeOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </>
                )}
              </button>
            </NavTooltip>

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
                        onClick={() => go("/finance/applications")}
                        className={cn(
                         "flex w-full items-center gap-3 rounded-lg py-2 pl-14 pr-3 text-[13px] transition-all duration-200",
                         location.pathname === "/finance/applications"
                           ? "font-medium bg-accent/50"
                           : "hover:text-foreground hover:bg-secondary"
                       )}
                       style={{
                         color: location.pathname === "/finance/applications" ? 'hsl(var(--accent-foreground))' : 'hsl(var(--muted-foreground))',
                       }}
                     >
                       <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                         location.pathname === "/finance/applications"
                           ? 'bg-accent border border-accent-foreground/20'
                           : 'bg-secondary border border-border'
                       }`}>
                         <LayoutGrid className={`w-3.5 h-3.5 ${location.pathname === "/finance/applications" ? 'text-accent-foreground' : 'text-muted-foreground'}`} strokeWidth={1.5} />
                        </div>
                        Applications
                      </button>
                    </li>
                  </motion.ul>
                )}
              </AnimatePresence>
            )}
          </li>

          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isContentPlanner = item.path === "/vision";
            const isLocked = isContentPlanner && !hasContentAccess;
            return (
              <li key={item.path}>
                <NavTooltip label={item.label}>
                  <button
                    onClick={() => {
                      if (isLocked) {
                        setShowWaitlistModal(true);
                      } else {
                        go(item.path);
                      }
                    }}
                    className={cn(
                      "group flex w-full items-center rounded-xl transition-all duration-200",
                      collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
                      item.active ? "font-medium" : "hover:bg-secondary hover:shadow-sm",
                      isLocked && "opacity-60"
                    )}
                    style={activeStyle(item.active)}
                  >
                    <span className={iconCircleCn(item.active)} style={iconBgStyle(item.active, item.color)}>
                      <Icon className="w-[18px] h-[18px]" style={{ color: item.active ? 'hsl(var(--accent-foreground))' : item.color }} strokeWidth={1.5} />
                    </span>
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left text-[14px]">{item.label}</span>
                        {isLocked && <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                      </>
                    )}
                  </button>
                </NavTooltip>
              </li>
            );
          })}

          {isAdmin && (
            <li>
              <NavTooltip label="Admin">
                <button
                  onClick={() => go("/admin")}
                  className={cn(
                    "group flex w-full items-center rounded-xl transition-all duration-200",
                    collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
                   location.pathname === "/admin" ? "font-medium" : "hover:bg-secondary hover:shadow-sm"
                 )}
                 style={activeStyle(location.pathname === "/admin")}
               >
                 <span className={iconCircleCn(location.pathname === "/admin")} style={iconBgStyle(location.pathname === "/admin", '#6366F1')}>
                   <Shield className="w-[18px] h-[18px]" style={{ color: location.pathname === "/admin" ? 'hsl(var(--accent-foreground))' : '#6366F1' }} strokeWidth={1.5} />
                  </span>
                  {!collapsed && <span className="flex-1 text-left text-[14px]">Admin</span>}
                </button>
              </NavTooltip>
            </li>
          )}
        </ul>
      </nav>

      {/* Bottom Profile Section */}
      <div className="shrink-0 px-3 pb-4 relative">
        {collapsed ? (
          /* Collapsed: just avatar */
          <NavTooltip label={displayName}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="w-full flex justify-center py-2"
            >
              <div className="relative">
               <div className="h-9 w-9 overflow-hidden rounded-full bg-secondary">
                   {avatarUrl ? (
                     <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                   ) : (
                     <div className="flex h-full w-full items-center justify-center text-xs font-semibold bg-primary text-primary-foreground">
                       {displayName.charAt(0).toUpperCase()}
                     </div>
                   )}
                 </div>
                 <div
                   className="absolute bottom-0 right-0 rounded-full border-2 border-sidebar"
                   style={{ width: 10, height: 10, backgroundColor: '#22C55E' }}
                 />
              </div>
            </button>
          </NavTooltip>
        ) : (
          /* Expanded: full profile card */
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="w-full flex items-center gap-3 rounded-2xl p-3 text-left transition-all duration-200 hover:shadow-md bg-card border border-border shadow-sm"
          >
            <div className="relative shrink-0">
              <div className="h-9 w-9 overflow-hidden rounded-full bg-secondary">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold bg-primary text-primary-foreground">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div
                className="absolute bottom-0 right-0 rounded-full border-2 border-card"
                style={{ width: 10, height: 10, backgroundColor: '#22C55E' }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="truncate text-[14px] font-normal text-foreground">
                {displayName}
              </div>
              <div className="truncate text-[11px] text-muted-foreground">
                {user?.email || ''}
              </div>
            </div>

            <div
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleDarkMode();
              }}
              className="shrink-0 inline-flex items-center justify-center rounded-full transition-colors hover:bg-secondary w-8 h-8 bg-secondary"
            >
              {darkMode ? (
                <Sun className="w-3.5 h-3.5 text-warning" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </div>
          </button>
        )}

        {/* Popup Menu */}
        <AnimatePresence>
          {profileMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />

               <motion.div
                 initial={{ opacity: 0, y: 8, scale: 0.95 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, y: 8, scale: 0.95 }}
                 transition={{ duration: 0.15 }}
                 className={cn(
                   "absolute bottom-full mb-2 z-50 rounded-xl border border-border bg-card p-1.5 shadow-lg",
                   collapsed ? "left-0 right-0" : "left-3 right-3"
                 )}
                 style={{ minWidth: collapsed ? 200 : undefined, ...(collapsed ? { left: 0, right: 'auto' } : {}) }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    go("/settings");
                    setProfileMenuOpen(false);
                  }}
                 className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition text-left text-[13px] text-foreground"
                 >
                   <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center">
                     <Settings className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  Settings
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    go("/settings?tab=support");
                    setProfileMenuOpen(false);
                  }}
                 className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition text-left text-[13px] text-foreground"
                 >
                   <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center">
                     <MessageSquare className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  Feedback
                </button>

                <div className="my-1 border-t border-border" />

                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await signOut();
                    navigate("/login");
                    onNavigate?.();
                    setProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 transition text-left text-[13px]"
                  style={{ color: '#DC2626' }}
                >
                  <div className="w-8 h-8 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
                    <LogOut className="w-[18px] h-[18px] text-red-500" strokeWidth={1.5} />
                  </div>
                  Log out
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <WaitlistModal open={showWaitlistModal} onClose={() => setShowWaitlistModal(false)} />
    </div>
  );
}

/** Fixed bottom tab bar for mobile */
function MobileTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Folder, label: "Projects", path: "/projects" },
    { icon: Wallet, label: "Money", path: "/finance/wealth" },
    { icon: Users, label: "Contacts", path: "/relationships" },
    { icon: MoreHorizontal, label: "More", path: "/__more__" },
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

  // Update isActive to handle contacts path for mobile tab
  

  const isActive = (path: string) => {
    if (path === "/projects") return location.pathname.startsWith("/projects") || location.pathname.startsWith("/project/");
    if (path === "/finance/wealth") return location.pathname.startsWith("/finance");
    if (path === "/relationships") return location.pathname.startsWith("/relationships");
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
                  <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} />
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
              <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} />
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
  const isDashboard = location.pathname.startsWith("/dashboard");
  const isFinance = location.pathname.startsWith("/finance");

  if (isFullBleed || isDashboard || isFinance) {
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
  const [journalOpen, setJournalOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? 72 : 280;

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="min-h-screen bg-background">
        <AnnouncementBanner />

        {/* Desktop Sidebar */}
        <div
          className="hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 z-30 bg-sidebar border-r border-sidebar-border"
           style={{ width: sidebarWidth }}
         >
           <div className="flex grow flex-col relative">
            <SidebarNav collapsed={collapsed} />
           </div>
        </div>

        {/* Mobile Header */}
        <div className="mobile-header sticky top-0 z-40 flex h-12 items-center gap-x-3 border-b border-border bg-card/95 px-4 backdrop-blur-xl lg:hidden">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Toggle sidebar"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
            <span className="text-sm font-semibold text-foreground">Digital Home</span>
          </div>
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
                 className="fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col lg:hidden bg-sidebar"
              >
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <FloatingCloud onClick={() => setJournalOpen(true)} />
        <JournalEntryModal open={journalOpen} onClose={() => setJournalOpen(false)} />

        {/* Main Content */}
        <main className="transition-all duration-300 min-h-screen" style={{ paddingLeft: `${sidebarWidth}px`, backgroundColor: '#f3f3f8' }}>
          <div className="lg:block hidden" /> {/* spacer for transition */}
          <ContentWrapper>{children}</ContentWrapper>
        </main>

        {/* Override padding on mobile */}
        <style>{`
          @media (max-width: 1023px) {
            main { padding-left: 0 !important; }
          }
        `}</style>
      </div>
    </SidebarContext.Provider>
  );
}
