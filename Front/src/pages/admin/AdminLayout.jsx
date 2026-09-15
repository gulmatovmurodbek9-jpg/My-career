import React, { useState } from "react";
import { Outlet, useLocation, useNavigate, Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Briefcase,
  FolderKanban,
  Users,
  UserRoundCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Globe,
  Sun,
  Moon,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../hooks/useTheme";

const AdminLayout = () => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { path: "/admin", label: t("admin.nav.dashboard"), icon: LayoutDashboard, end: true },
    { path: "/admin/careers", label: t("admin.nav.careers"), icon: Briefcase },
    { path: "/admin/clusters", label: t("admin.nav.clusters"), icon: FolderKanban },
    { path: "/admin/specialists", label: t("admin.nav.specialists"), icon: UserRoundCheck },
    { path: "/admin/users", label: t("admin.nav.users"), icon: Users },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path, end) => {
    if (end) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* ═══ SIDEBAR ═══ */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 h-screen z-40 flex flex-col bg-card backdrop-blur-2xl border-r border-border"
      >
        {/* Logo area */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-border">
          {/* Ҳамон логотипи «Ихтисоси ман», ки дар сайт аст — на иконкаи сипар.
              Логотип шаффоф аст ва дар ҳарду мавзӯъ хонда мешавад. */}
          <Link to="/" className="flex-shrink-0" aria-label="Ихтисоси ман">
            <img src="/logo.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" />
          </Link>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <span className="text-[15px] font-extrabold text-foreground tracking-tight">
                  {t("admin.panel_title")}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.path, item.end);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-semibold transition-all duration-200 ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="admin-nav-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-primary"
                    transition={{ type: "spring", damping: 25, stiffness: 400 }}
                  />
                )}
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}

          {/* Divider */}
          <div className="my-3 border-t border-border" />

          {/* Back to site link */}
          <Link
            to="/"
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-semibold text-emerald-600/50 dark:text-emerald-400/50 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
          >
            <Globe className="w-[18px] h-[18px] flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="whitespace-nowrap"
                >
                  {t("admin.back_to_site")}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </nav>

        {/* User info & collapse */}
        <div className="p-3 border-t border-border space-y-2">
          <div className={`flex items-center gap-3 px-3 py-2 rounded-xl bg-muted/40 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/25 to-accent-blue/20 flex items-center justify-center flex-shrink-0 border border-primary/20">
              <span className="text-[13px] font-bold text-primary">
                {user?.name?.charAt(0)?.toUpperCase() || "A"}
              </span>
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <div className="text-[13px] font-semibold text-foreground truncate">{user?.name || "Admin"}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{user?.email}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Ҳамон интихоби мавзӯъ, ки дар сайт аст: пештар админ ҳамеша торик буд. */}
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? t("admin.theme_light", "Мавзӯи равшан") : t("admin.theme_dark", "Мавзӯи торик")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer ${collapsed ? 'justify-center' : ''}`}
          >
            {theme === "dark" ? <Sun className="w-[18px] h-[18px] flex-shrink-0" /> : <Moon className="w-[18px] h-[18px] flex-shrink-0" />}
            {!collapsed && <span className="whitespace-nowrap">{theme === "dark" ? t("admin.theme_light", "Мавзӯи равшан") : t("admin.theme_dark", "Мавзӯи торик")}</span>}
          </button>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-semibold text-red-600/60 dark:text-red-400/60 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {t("admin.logout")}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-muted text-muted-foreground/80 hover:text-foreground transition-all cursor-pointer"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </motion.aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <motion.main
        animate={{ marginLeft: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 min-h-screen"
      >
        <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </motion.main>
    </div>
  );
};

export default AdminLayout;
