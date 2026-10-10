import React, { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router";
import LazyVoiceAssistant from "../../components/voice/LazyVoiceAssistant";
import MobileTabBar, { tabBarVisible } from "../../components/MobileTabBar";
import {
  ArrowRight,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Moon,
  Phone,
  Sun,
  Twitter,
  X,
  Languages,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../hooks/useTheme";
import { useAuthStore } from "../../store/authStore";
import DashboardSidebar from "../../components/DashboardSidebar";

const Layout = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, logout, user } = useAuthStore();
  const userLabel = user?.name?.trim() || user?.email?.split("@")[0] || "";
  const navigate = useNavigate();
  const location = useLocation();
  // Нақш (масалан «омӯзгор») метавонад аз ҷониби админ иваз шавад — профилро ҳангоми кушодани
  // сайт ва ҳар бор дар «Панел» нав мекунем, то «Синфҳо» бе аз нав ворид шудан пайдо шавад.
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const inDashboard = location.pathname.startsWith("/dashboard");
  useEffect(() => {
    if (isAuthenticated) refreshProfile();
  }, [isAuthenticated, inDashboard, refreshProfile]);
  const { t, i18n } = useTranslation();

  // Менюи паҳлӯ дар ҳамаи саҳифаҳои корбар — «Захирашудаҳо» ва «Санҷиш» ҳам;
  // пештар дар онҳо меню набуд ва корбар роҳи бозгаштро гум мекард.
  const isDashboard = location.pathname.startsWith("/dashboard")
    || location.pathname === "/favorites"
    || (location.pathname === "/quiz" && isAuthenticated);

  useEffect(() => {
    if (!location.hash) return;
    const target = document.querySelector(location.hash);
    if (!target) return;
    const id = requestAnimationFrame(() =>
      target.scrollIntoView({ behavior: "smooth", block: "start" })
    );
    return () => cancelAnimationFrame(id);
  }, [location]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Github, href: "#", label: "GitHub" },
    { icon: Mail, href: "#", label: "Email" },
  ];

  const languages = [
    { code: "tj", label: "TG", name: "Тоҷикӣ" },
    { code: "ru", label: "RU", name: "Русский" },
    { code: "en", label: "EN", name: "English" },
  ];

  const [langOpen, setLangOpen] = useState(false);
  const currentLang = i18n.language?.startsWith("ru")
    ? "ru"
    : i18n.language?.startsWith("en")
      ? "en"
      : "tj";

  // 30, 51, 171, 173: номҳо барои скринридер бо забони сайт.
  const A11Y = {
    tj: { lang: "Забон", theme: "Мавзӯи торик", menu: "Меню", logout: "Баромад", home: "Ихтисоси ман — саҳифаи асосӣ" },
    ru: { lang: "Язык", theme: "Тёмная тема", menu: "Меню", logout: "Выйти", home: "Ихтисоси ман — главная" },
    en: { lang: "Language", theme: "Dark theme", menu: "Menu", logout: "Log out", home: "Ikhtisosi man — home" },
  }[currentLang];

  // 51, 169, 180: Escape менюҳоро мепӯшад, клик берун аз менюи забон — низ;
  // ҳангоми менюи мобилии кушода саҳифа зери он намеғелад.
  const langRef = useRef(null);
  useEffect(() => {
    if (!langOpen && !isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setLangOpen(false);
        setIsOpen(false);
      }
    };
    const onDown = (e) => {
      if (langOpen && langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [langOpen, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
    setLangOpen(false);
  }, [location.pathname]);

  const localizedNav = {
    tj: {
      clusters: "Кластерхо",
      universities: "Донишгоҳо",
      logout: "Баромад",
      appointments: "Машваратҳо",
    },
    ru: {
      clusters: "Кластеры",
      universities: "Университеты",
      logout: "Выйти",
      appointments: "Консультации",
    },
    en: {
      clusters: "Clusters",
      universities: "Universities",
      logout: "Logout",
      appointments: "Consultations",
    },
  };

  const navLinks = [
    { to: "/", label: t("nav.home", "Асосӣ") },
    { to: "/#cluster-groups", label: t("nav.clusters", "Кластерҳо") },
    { to: "/careers", label: t("nav.careers", "Ихтисосҳо") },
    { to: "/universities", label: t("nav.universities", "Донишгоҳҳо") },
    { to: "/about", label: t("nav.about", "Дар бора") },
  ];

  const accountLinks = isAuthenticated
    ? [
        { to: "/dashboard", label: t("nav.dashboard", "Панел") },
      ]
    : [];

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('app_lang', code);
    setLangOpen(false);
  };

  return (
    <div className={`min-h-screen flex flex-col selection:bg-primary/30 selection:text-primary-foreground ${tabBarVisible(location.pathname) ? "pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0" : ""}`}>
      <a href="#main" className="skip-link">
        {t("common.skip_to_content", "Ба мазмун гузаштан")}
      </a>

      <div className="fixed inset-0 tajik-pattern pointer-events-none z-[-1]" />

      <header className="fixed top-0 left-0 w-full z-50">
        <nav className={`transition-all duration-500 ${scrolled ? "nav-glass-scrolled py-2" : "nav-glass py-3 md:py-4"}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14 md:h-16 gap-3 lg:gap-5">
              <Link to="/" aria-label={A11Y.home} className="flex shrink-0 items-center gap-2 lg:gap-3 group text-decoration-none">
                <img
                  src="/logo.png"
                  alt=""
                  width={40}
                  height={40}
                  className="h-9 w-9 lg:h-10 lg:w-10 flex-shrink-0 transition-transform duration-500 group-hover:scale-110"
                />
                {/* Дар телефон ҷой ҳаст — ном ҳамроҳи логотип; дар планшет/компютер меню ҷояшро мегирад. */}
                <span className="block md:hidden 2xl:block max-w-[210px] font-extrabold text-lg 2xl:text-xl text-foreground tracking-normal uppercase whitespace-nowrap overflow-hidden text-ellipsis">
                  {t("common.brand", "Ikhtisosiman")}
                </span>
              </Link>

              <div className="hidden md:flex min-w-0 flex-1 items-center justify-center gap-1 overflow-hidden px-2 lg:gap-2">
                {navLinks.map((link) => {
                  const isActive = link.to.includes("#")
                    ? false
                    : link.to === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(link.to);
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      aria-current={isActive ? "page" : undefined}
                      className={`relative whitespace-nowrap rounded-lg px-2.5 lg:px-3 py-2 text-[13px] xl:text-sm font-semibold transition-colors duration-200 focus-ring ${
                        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {link.label}
                      {isActive && (
                        <motion.span
                          layoutId="nav-indicator"
                          className="absolute inset-x-2.5 -bottom-0.5 h-0.5 rounded-full bg-primary lg:inset-x-3 xl:inset-x-3.5"
                        />
                      )}
                    </Link>
                  );
                })}
              </div>

              <div className="hidden md:flex shrink-0 items-center gap-1.5 lg:gap-2">
                <div className="relative" ref={langRef}>
                  <button
                    type="button"
                    aria-label={A11Y.lang}
                    aria-haspopup="true"
                    aria-expanded={langOpen}
                    onClick={() => setLangOpen(!langOpen)}
                    className="w-9 h-9 xl:w-10 xl:h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer"
                  >
                    <Languages className="w-5 h-5" />
                  </button>
                  <AnimatePresence>
                    {langOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-40 glass-card p-2 shadow-2xl z-[60]"
                      >
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            type="button"
                            lang={lang.code === "tj" ? "tg" : lang.code}
                            aria-pressed={currentLang === lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              currentLang === lang.code ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"
                            }`}
                          >
                            <span>{lang.name}</span>
                            <span className="text-[11px] opacity-40">{lang.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button onClick={toggleTheme} className="theme-toggle w-9 h-9 xl:w-10 xl:h-10 rounded-xl cursor-pointer" aria-label={A11Y.theme} aria-pressed={theme === "dark"}>
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>

                <div className="w-px h-6 bg-border mx-1 xl:mx-2" />

                {isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <Link
                      to="/dashboard"
                      title={t("nav.dashboard", "Панел")}
                      className="hidden xl:flex max-w-[170px] items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 font-bold text-xs uppercase tracking-normal transition-colors hover:bg-primary/20"
                    >
                      <UserIcon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{userLabel}</span>
                    </Link>
                    <button
                      type="button"
                      aria-label={A11Y.logout}
                      title={A11Y.logout}
                      onClick={() => {
                        logout();
                        navigate("/");
                      }}
                      className="w-9 h-9 xl:w-10 xl:h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer border border-transparent hover:border-rose-500/20"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <Link to="/login" className="btn-primary !px-5 !py-2.5 !text-xs !rounded-xl cursor-pointer">
                    {t("nav.login", "Login")}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>

              {/* Телефон: танҳо аватар — забон, мавзӯъ ва ҳисоб дар менюи он. */}
              <div className="md:hidden flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  aria-label={A11Y.menu}
                  aria-expanded={isOpen}
                  aria-controls="mobile-menu"
                  onClick={() => setIsOpen(!isOpen)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ring-2 ring-offset-2 ring-offset-background ${isOpen
                    ? "bg-muted text-foreground ring-border"
                    : isAuthenticated
                      ? "bg-gradient-to-br from-primary to-indigo-600 text-white ring-primary/30 shadow-md shadow-primary/30"
                      : "bg-primary/10 text-primary ring-primary/20"}`}
                >
                  {/* Аватар ба ҷои ☰: менюи ҳисоб (ном, забон, баромадан, саҳифаҳои дигар). */}
                  {isOpen
                    ? <X className="h-5 w-5" />
                    : isAuthenticated && userLabel
                      ? <span className="text-sm font-black uppercase">{userLabel.slice(0, 1)}</span>
                      : <UserIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {isOpen && (
              <>
                <motion.div
                  key="menu-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsOpen(false)}
                  className="md:hidden fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px]"
                  aria-hidden
                />
                <motion.div
                  key="menu-sheet"
                  id="mobile-menu"
                  initial={{ opacity: 0, y: -12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="md:hidden absolute top-full left-3 right-3 mt-2 z-50 rounded-[1.75rem] border border-border bg-card p-3 shadow-2xl max-h-[calc(100dvh-110px)] overflow-y-auto overscroll-contain"
                >
                  {/* Ҳисоб: корти корбар → «Панел»; меҳмон → «Вуруд». */}
                  {isAuthenticated ? (
                    <Link
                      to="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/12 to-indigo-500/5 p-3"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-indigo-600 text-base font-black uppercase text-white shadow-md shadow-primary/30">
                        {(userLabel || "?").slice(0, 1)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-black text-foreground">{userLabel}</span>
                        {user?.email && <span className="block truncate text-xs text-muted-foreground">{user.email}</span>}
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-primary">
                        {t("nav.dashboard", "Панел")} <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  ) : (
                    <Link to="/login" onClick={() => setIsOpen(false)} className="btn-primary w-full !px-5 !py-3 !text-sm !rounded-2xl">
                      {t("nav.login", "Login")}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}

                  {/* Танзимот: забон ва мавзӯъ. */}
                  <div className="mt-3 rounded-2xl bg-muted/40 p-1.5">
                    <div className="flex items-center gap-2 px-2.5 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      <Languages className="h-3.5 w-3.5" /> {A11Y.lang}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          lang={lang.code === "tj" ? "tg" : lang.code}
                          aria-pressed={currentLang === lang.code}
                          onClick={() => changeLanguage(lang.code)}
                          className={`rounded-xl px-2 py-2.5 text-xs font-black transition-colors cursor-pointer ${currentLang === lang.code ? "bg-primary text-primary-foreground shadow-sm" : "bg-card text-muted-foreground"}`}
                        >
                          {lang.name}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      aria-pressed={theme === "dark"}
                      className="mt-1.5 flex w-full items-center justify-between rounded-xl bg-card px-3 py-2.5 text-sm font-bold text-foreground cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        {theme === "dark" ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-amber-500" />}
                        {A11Y.theme}
                      </span>
                      <span className={`relative h-6 w-11 rounded-full transition-colors ${theme === "dark" ? "bg-primary" : "bg-muted"}`}>
                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${theme === "dark" ? "left-[22px]" : "left-0.5"}`} />
                      </span>
                    </button>
                  </div>

                  {/* Саҳифаҳое, ки дар панели поён нестанд. */}
                  <div className="mt-3 space-y-0.5">
                    {[
                      ...(user?.role === "teacher" || user?.role === "admin"
                        ? [{ to: "/dashboard/teacher", label: { tj: "Ҳуҷраи омӯзгор", ru: "Кабинет учителя", en: "Teacher room" }[currentLang] || "Ҳуҷраи омӯзгор" }]
                        : []),
                      { to: "/#cluster-groups", label: t("nav.clusters", "Кластерҳо") },
                      { to: "/trial", label: t("nav.trial", "Худро дар касб санҷед") },
                      { to: "/class", label: { tj: "Рамзи синф", ru: "Код класса", en: "Class code" }[currentLang] || "Рамзи синф" },
                      { to: "/about", label: t("nav.about", "Дар бора") },
                    ].map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-bold text-foreground hover:bg-muted"
                      >
                        {link.label}
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>

                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                        navigate("/");
                      }}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-500 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      {t("nav.logout", localizedNav[currentLang].logout)}
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </nav>
      </header>

      <main
        id="main"
        className={
          isDashboard
            ? "flex-1 w-full max-w-[1520px] mx-auto flex flex-col md:flex-row gap-4 md:gap-6 px-4 sm:px-6 lg:px-7 pt-[96px] md:pt-[104px] pb-6 md:pb-8"
            : "flex-1 pt-[76px] md:pt-20"
        }
      >
        {isDashboard && <DashboardSidebar />}
        <div className={`flex-1 min-w-0 ${isDashboard ? "min-h-0" : ""}`}>
          <Outlet />
        </div>
      </main>

      {!isDashboard && (
        <footer className="relative mt-20 md:mt-32">
          <div className="glass-card !rounded-none !border-x-0 !border-b-0 bg-card/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16">
                <div className="md:col-span-5">
                  <div className="flex items-center gap-3 mb-6">
                    <img
                      src="/logo.png"
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 flex-shrink-0"
                    />
                    <span className="font-extrabold text-xl text-foreground tracking-tighter uppercase font-jakarta">
                      {t("common.brand", "Ikhtisosiman")}
                    </span>
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8 leading-relaxed max-w-sm">
                    {t("nav.about_desc", "Platform for students and young professionals to explore better career paths in Tajikistan.")}
                  </p>
                  <div className="flex gap-4">
                    {socialLinks.filter((social) => social.href && social.href !== "#").map((social, i) => (
                      <a key={i} href={social.href} className="w-12 h-12 rounded-2xl glass-card !p-0 flex items-center justify-center text-muted-foreground hover:text-primary transition-all">
                        <social.icon className="h-5 w-5" />
                      </a>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                  <div>
                    <h4 className="text-xs font-black text-foreground mb-6 uppercase tracking-widest opacity-60">
                      {t("footer.platform", "Platform")}
                    </h4>
                    <ul className="space-y-4">
                      {[...navLinks, { to: "/trial", label: t("nav.trial", "Худро дар касб санҷед") }].map((link, i) => (
                        <li key={i}>
                          <Link to={link.to} className="text-sm font-bold text-muted-foreground hover:text-primary transition-all">
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <h4 className="text-xs font-black text-foreground mb-6 uppercase tracking-widest opacity-60">
                      {t("footer.contact", "Contact")}
                    </h4>
                    <div className="space-y-4 text-sm font-bold text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-primary" />
                        {t("footer.location", "Dushanbe, Tajikistan")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 md:mt-20 pt-6 md:pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
                <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.22em] md:tracking-widest leading-relaxed text-center md:text-left">
                  © {new Date().getFullYear()} {t("footer.copyright", "Ikhtisosiman. Built with")} <span className="text-rose-500 animate-pulse">❤</span>{" "}
                  {t("footer.copyright_2", "in Tajikistan.")}
                </p>
                <Link to="/privacy" className="text-[11px] font-bold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                  {t("footer.privacy", "Махфият ва маълумот")}
                </Link>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Дар чати AI майдони навиштан ва тугмаи «Фиристодан» дар ҳамон кунҷанд — микрофони
          шинокунанда онро мепӯшонд (хонанда саволро фиристода натавонист). Чат микрофони худро дорад. */}
      {!location.pathname.startsWith("/dashboard/ai-chat") && <LazyVoiceAssistant />}

      <MobileTabBar />
    </div>
  );
};

export default Layout;
