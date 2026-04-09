import { useLocation, useNavigate } from "react-router-dom";
import { Home, Folder, Menu, X, Settings, LogOut, PanelLeftClose, PanelLeft, LayoutGrid, Wallet, MessageSquare, Shield, MoreHorizontal, Moon, Sun, Users, Clapperboard, Bell, BookOpen, Star } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useRef, useEffect, createContext, useContext } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUserPreferences, useUpsertPreferences } from "@/hooks/useUserPreferences";
import { supabase } from "@/integrations/supabase/client";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import FloatingCloud from "@/components/journal/FloatingCloud";
import NotificationPanel from "@/components/notifications/NotificationPanel";

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
  

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "super_admin").maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  useEffect(() => {
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

  const go = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard", active: location.pathname.startsWith("/dashboard") },
    { icon: Folder, label: "Projects", path: "/projects", active: isProjectsActive },
    { icon: Wallet, label: "Money", path: "/finance/wealth", active: location.pathname === "/finance/wealth" || location.pathname === "/finance" },
    { icon: LayoutGrid, label: "Applications", path: "/finance/applications", active: location.pathname === "/finance/applications" },
  ];

  // Content Planner removed from sidebar

  const bottomNavItems = [
    { icon: Users, label: "Contacts", path: "/relationships", active: location.pathname.startsWith("/relationships") },
    { icon: Clapperboard, label: "Studio", path: "/studio", active: location.pathname.startsWith("/studio") },
  ];

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
  const avatarUrl = prefs?.profile_photo;
  const isFoundingMember = profile?.founding_member === true || (prefs as any)?.is_founding_member === true || (prefs as any)?.subscription_type === "founding";

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

  // Sidebar nav item styles — white text on dark charcoal sidebar
  const navItemClass = (isActive: boolean, isLocked?: boolean) => cn(
    "group flex w-full items-center rounded-xl transition-all duration-200",
    collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
    isActive
      ? "border-l-[3px] border-[#10B981] font-medium"
      : "border-l-[3px] border-transparent hover:border-[#10B981]",
    isLocked && "opacity-60"
  );

  const navItemStyle = (isActive: boolean) => ({
    backgroundColor: isActive ? 'rgba(16,185,129,0.12)' : undefined,
    color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.85)',
  });

  const navItemHoverHandlers = (isActive: boolean) => ({
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isActive) {
        e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.08)';
        e.currentTarget.style.color = '#FFFFFF';
      }
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isActive) {
        e.currentTarget.style.backgroundColor = '';
        e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
      }
    },
  });

  const iconStyle = (isActive: boolean) => ({
    color: isActive ? '#10B981' : 'rgba(255,255,255,0.75)',
  });

  return (
    <div className="flex flex-1 flex-col h-full">
      {/* Logo + Collapse Toggle */}
      <div className={cn("py-5", collapsed ? "px-3 flex justify-center" : "px-5")}>
        <div className="flex items-center gap-2.5">
          <div className="h-3 w-3 rounded-full bg-[#10B981] flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="text-[15px] font-semibold tracking-tight text-white flex-1">Digital Home</span>
              <button
                onClick={() => setCollapsed(true)}
                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                style={{ color: 'rgba(255,255,255,0.5)' }}
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          )}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              aria-label="Expand sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavTooltip label={item.label}>
                  <button
                    onClick={() => go(item.path)}
                    className={navItemClass(item.active)}
                    style={navItemStyle(item.active)}
                    {...navItemHoverHandlers(item.active)}
                  >
                    <Icon className="w-[20px] h-[20px] flex-shrink-0" style={iconStyle(item.active)} strokeWidth={1.5} />
                    {!collapsed && <span className="flex-1 text-left text-[14px]">{item.label}</span>}
                  </button>
                </NavTooltip>
              </li>
            );
          })}


          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavTooltip label={item.label}>
                  <button
                    onClick={() => go(item.path)}
                    className={navItemClass(item.active)}
                    style={navItemStyle(item.active)}
                    {...navItemHoverHandlers(item.active)}
                  >
                    <Icon className="w-[20px] h-[20px] flex-shrink-0" style={iconStyle(item.active)} strokeWidth={1.5} />
                    {!collapsed && <span className="flex-1 text-left text-[14px]">{item.label}</span>}
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
                  className={navItemClass(location.pathname === "/admin")}
                  style={navItemStyle(location.pathname === "/admin")}
                  {...navItemHoverHandlers(location.pathname === "/admin")}
                >
                  <Shield className="w-[20px] h-[20px] flex-shrink-0" style={iconStyle(location.pathname === "/admin")} strokeWidth={1.5} />
                  {!collapsed && <span className="flex-1 text-left text-[14px]">Admin</span>}
                </button>
              </NavTooltip>
            </li>
          )}
        </ul>
      </nav>

      {/* Legal Footer Links */}
      {!collapsed && (
        <div className="px-3 pb-2 text-center">
          <a href="/privacy" className="text-[11px] hover:text-white/70 transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>Privacy</a>
          <span className="text-[11px] mx-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
          <a href="/terms" className="text-[11px] hover:text-white/70 transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}>Terms</a>
        </div>
      )}

      {/* Bottom Profile Section */}
      <div className="shrink-0 px-3 pb-4 relative">
        {collapsed ? (
          <NavTooltip label={displayName}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="w-full flex justify-center py-2"
            >
              <div className="relative">
                <div className="h-9 w-9 overflow-hidden rounded-full bg-white/10">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold bg-[#10B981] text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div
                  className="absolute bottom-0 right-0 rounded-full border-2 border-[#1C1C1E]"
                  style={{ width: 10, height: 10, backgroundColor: '#22C55E' }}
                />
              </div>
            </button>
          </NavTooltip>
        ) : (
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="w-full flex items-center gap-3 rounded-2xl p-3 text-left transition-all duration-200 hover:bg-white/5"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="relative shrink-0">
              <div className="h-9 w-9 overflow-hidden rounded-full bg-white/10">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold bg-[#10B981] text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div
                className="absolute bottom-0 right-0 rounded-full border-2 border-[#1C1C1E]"
                style={{ width: 10, height: 10, backgroundColor: '#22C55E' }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="truncate text-[14px] font-normal text-white">
                  {displayName}
                </span>
                {isFoundingMember && (
                  <span title="Founding Member" className="flex-shrink-0">
                    <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                  </span>
                )}
              </div>
              <div className="truncate text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {user?.email || ''}
              </div>
            </div>

            <div
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleDarkMode();
              }}
              className="shrink-0 inline-flex items-center justify-center rounded-full transition-colors hover:bg-white/10 w-8 h-8 bg-white/5"
            >
              {darkMode ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.6)' }} />
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
                     setProfileMenuOpen(false);
                     navigate("/settings");
                     setTimeout(() => {
                       const supportTab = document.querySelector('[data-tab="support"]');
                       if (supportTab) (supportTab as HTMLElement).click();
                       setTimeout(() => {
                         const feedbackForm = document.getElementById("feedback-form");
                         if (feedbackForm) feedbackForm.scrollIntoView({ behavior: "smooth", block: "start" });
                       }, 300);
                     }, 200);
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
    { icon: Clapperboard, label: "Studio", path: "/studio" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const isActive = (path: string) => {
    if (path === "/projects") return location.pathname.startsWith("/projects") || location.pathname.startsWith("/project/");
    if (path === "/finance/wealth") return location.pathname.startsWith("/finance");
    if (path === "/relationships") return location.pathname.startsWith("/relationships");
    if (path === "/__more__") return ["/studio", "/settings"].some(p => location.pathname.startsWith(p));
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
  const isFullBleed = location.pathname === "/studio";
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
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const isDark = document.documentElement.classList.contains("dark");
  const location = useLocation();
  const navigate = useNavigate();

  const sidebarWidth = collapsed ? 72 : 280;

  // Auto-expand sidebar on first dashboard load per session
  useEffect(() => {
    if (location.pathname.startsWith("/dashboard") && !sessionStorage.getItem("sidebar_welcomed")) {
      sessionStorage.setItem("sidebar_welcomed", "true");
      setCollapsed(false);
      const timer = setTimeout(() => {
        setCollapsed(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []); // only on mount

  // Generate notifications on load
  useEffect(() => {
    if (!user?.id) return;
    supabase.functions.invoke("generate-notifications", { body: { user_id: user.id } }).catch(() => {});
  }, [user?.id]);

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
            <div className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
            <span className="text-sm font-semibold text-foreground">Digital Home</span>
          </div>
          {/* Mobile Bell */}
          {user && (
            <div style={{ position: "relative" }}>
              <button
                className="notif-bell"
                onClick={() => setNotifOpen(!notifOpen)}
                style={{
                  position: "relative", width: "34px", height: "34px", borderRadius: "50%",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                  background: isDark ? "#252528" : "white", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Bell size={16} color={isDark ? "rgba(255,255,255,0.7)" : "#374151"} />
                {unreadCount > 0 && (
                  <div style={{
                    position: "absolute", top: "-2px", right: "-2px",
                    width: unreadCount > 9 ? "20px" : "16px", height: "16px",
                    borderRadius: "999px", background: "#EF4444",
                    border: `2px solid ${isDark ? "#252528" : "white"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "9px", fontWeight: "700", color: "white",
                  }}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </div>
                )}
              </button>
            </div>
          )}
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

        <FloatingCloud onClick={() => navigate("/journal/new")} />

        {/* Desktop Bell Icon — fixed top-right */}
        {user && (
          <div className="hidden lg:block fixed top-4 z-40" style={{ right: "24px" }}>
            <div style={{ position: "relative" }}>
              <button
                className="notif-bell"
                onClick={() => setNotifOpen(!notifOpen)}
                style={{
                  position: "relative", width: "38px", height: "38px", borderRadius: "50%",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                  background: isDark ? "#252528" : "white", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 150ms",
                }}
              >
                <Bell size={18} color={isDark ? "rgba(255,255,255,0.7)" : "#374151"} />
                {unreadCount > 0 && (
                  <div style={{
                    position: "absolute", top: "-2px", right: "-2px",
                    width: unreadCount > 9 ? "20px" : "16px", height: "16px",
                    borderRadius: "999px", background: "#EF4444",
                    border: `2px solid ${isDark ? "#252528" : "white"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "9px", fontWeight: "700", color: "white", fontFamily: "Inter, sans-serif",
                  }}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Notification Panel */}
        {notifOpen && user && (
          <NotificationPanel
            onClose={() => setNotifOpen(false)}
            onUnreadCountChange={setUnreadCount}
            userId={user.id}
          />
        )}

        {/* Main Content */}
        <main className="transition-all duration-300 min-h-screen bg-background" style={{ paddingLeft: `${sidebarWidth}px` }}>
          <div className="lg:block hidden" />
          <ContentWrapper>{children}</ContentWrapper>
        </main>

        {/* Mobile bottom tab bar */}
        <MobileTabBar />

        {/* Override padding on mobile */}
        <style>{`
          @media (max-width: 1023px) {
            main { padding-left: 0 !important; padding-bottom: 72px !important; }
          }
        `}</style>
      </div>
    </SidebarContext.Provider>
  );
}
