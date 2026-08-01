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
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useTranslation } from "react-i18next";

const AdminLayout = () => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const navItems = [
    { path: "/admin", label: t("admin.nav.dashboard"), icon: LayoutDashboard, end: true },
    { path: "/admin/careers", label: t("admin.nav.careers"), icon: Briefcase },
    { path: "/admin/clusters", label: t("admin.nav.clusters"), icon: FolderKanban },
    { path: "/admin/specialists", label: "Мутахассисҳо", icon: UserRoundCheck },
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
    <div className="flex min-h-screen bg-[#060a14]">
      {/* ═══ SIDEBAR ═══ */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 h-screen z-40 flex flex-col bg-[#0a0f1e]/90 backdrop-blur-2xl border-r border-white/[0.04]"
      >
        {/* Logo area */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-white/[0.04]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
            <Shield className="w-4.5 h-4.5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <span className="text-sm font-extrabold text-white tracking-tight">
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
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-indigo-500/15 text-indigo-400"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="admin-nav-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-indigo-500"
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
          <div className="my-3 border-t border-white/[0.04]" />

          {/* Back to site link */}
          <Link
            to="/"
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-emerald-400/50 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
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
        <div className="p-3 border-t border-white/[0.04] space-y-2">
          <div className={`flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.02] ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/30 to-purple-600/30 flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
              <span className="text-xs font-bold text-indigo-400">
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
                  <div className="text-xs font-semibold text-white truncate">{user?.name || "Admin"}</div>
                  <div className="text-[10px] text-white/30 truncate">{user?.email}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer ${collapsed ? 'justify-center' : ''}`}
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
            className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-white/[0.03] text-white/20 hover:text-white/40 transition-all cursor-pointer"
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
