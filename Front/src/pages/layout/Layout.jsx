import React, { useEffect, useState } from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router";
import {
  ArrowRight,
  Github,
  Linkedin,
  Mail,
  MapPin,
  MenuIcon,
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
import { ChatModal } from "../../components/aiAssitand";
import { FloatingChatButton } from "../../components/chatbtn";
import { useTheme } from "../../hooks/useTheme";
import { useAuthStore } from "../../store/authStore";
import DashboardSidebar from "../../components/DashboardSidebar";

const Layout = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, logout, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const isDashboard = location.pathname.startsWith("/dashboard");

  /**
   * Гузариш ба #hash.
   *
   * React Router худаш ба лангар скролл намекунад, аз ин рӯ истиноди
   * "/#cluster-groups" бе ин танҳо ба болои саҳифа мебурд.
   */
  useEffect(() => {
    if (!location.hash) return;
    const target = document.querySelector(location.hash);
    if (!target) return;
    // Кадри оянда: бахш метавонад ҳанӯз рендер нашуда бошад.
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
    { code: "tj", label: "TJ", name: "Tojiki" },
    { code: "ru", label: "RU", name: "Russkiy" },
    { code: "en", label: "EN", name: "English" },
  ];

  const [chatOpen, setChatOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const currentLang = i18n.language?.startsWith("ru")
    ? "ru"
    : i18n.language?.startsWith("en")
      ? "en"
      : "tj";

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
    ...(isAuthenticated
      ? [
          { to: "/dashboard", label: t("nav.dashboard", "Панел") },
          { to: "/dashboard/appointments", label: t("nav.appointments", "Машваратҳо") },
        ]
      : []),
    ...(user?.role === "admin"
      ? [{ to: "/admin", label: t("nav.admin", "Админ") }]
      : []),
  ];

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('app_lang', code);
    setLangOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-primary/30 selection:text-primary-foreground">
      {/* Аввалин чизи фокусшаванда: корбари клавиатура набояд ҳар дафъа
          тамоми навбарро гузарад, то ба мазмун расад. */}
      <a href="#main" className="skip-link">
        {t("common.skip_to_content", "Ба мазмун гузаштан")}
      </a>

      <div className="fixed inset-0 tajik-pattern pointer-events-none z-[-1]" />

      <header className="fixed top-0 left-0 w-full z-50">
        <nav className={`transition-all duration-500 ${scrolled ? "nav-glass-scrolled py-2" : "nav-glass py-3 md:py-4"}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14 md:h-16 gap-3 lg:gap-5">
              <Link to="/" className="flex shrink-0 items-center gap-2 lg:gap-3 group text-decoration-none">
                <span className="w-9 h-9 lg:w-10 lg:h-10 icon-box-solid rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-500 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3" />
                  </svg>
                </span>
                <span className="hidden xl:block max-w-[190px] 2xl:max-w-[210px] font-extrabold text-lg 2xl:text-xl text-foreground tracking-normal uppercase whitespace-nowrap overflow-hidden text-ellipsis">
                  {t("common.brand", "Ikhtisosiman")}
                </span>
              </Link>

              <div className="hidden md:flex min-w-0 flex-1 items-center justify-center gap-0.5 2xl:gap-1">
                {navLinks.map((link) => {
                  // Истиноди лангарӣ ("/#cluster-groups") ба бахши дохили
                  // саҳифа ишора мекунад, на ба саҳифаи алоҳида, аз ин рӯ
                  // ҳолати "фаъол" надорад.
                  const isActive = link.to.includes("#")
                    ? false
                    : link.to === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(link.to);
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`relative whitespace-nowrap rounded-lg px-2.5 lg:px-3 xl:px-3.5 py-2 text-[13px] xl:text-sm font-semibold transition-colors duration-200 focus-ring ${
                        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {link.label}
                      {/* Хатчаи борики ягона. Нусхаи қаблӣ ҳам заминаи ранга,
                          ҳам хатчаи 4px-и градиентӣ дошт: таъкиди дубора, ва
                          градиент бо бақияи саҳифа намезад. */}
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
                <div className="relative">
                  <button
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
                        className="absolute right-0 mt-2 w-40 glass-card p-2 shadow-2xl z-[60]"
                      >
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              i18n.language === lang.code ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"
                            }`}
                          >
                            <span>{lang.name}</span>
                            <span className="text-[10px] opacity-40">{lang.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button onClick={toggleTheme} className="theme-toggle w-9 h-9 xl:w-10 xl:h-10 rounded-xl cursor-pointer" aria-label="Toggle theme">
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>

                <div className="w-px h-6 bg-border mx-1 xl:mx-2" />

                {isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <div className="hidden 2xl:flex max-w-[150px] items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 font-bold text-xs uppercase tracking-normal">
                      <UserIcon className="w-3.5 h-3.5" />
                      <span className="truncate">{user?.name}</span>
                    </div>
                    <button
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
                  <Link to="/login">
                    <button className="btn-primary !px-5 !py-2.5 !text-xs !rounded-xl cursor-pointer">
                      {t("nav.login", "Login")}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </Link>
                )}
              </div>

              <div className="md:hidden flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setLangOpen(!langOpen)} className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted/50 text-muted-foreground">
                  <Languages className="w-4 h-4" />
                </button>
                <button onClick={toggleTheme} className="theme-toggle w-10 h-10 rounded-xl cursor-pointer" aria-label="Toggle theme">
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                >
                  {isOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="md:hidden absolute top-full left-3 right-3 mt-2 overflow-hidden glass-card shadow-2xl z-50 p-4 max-h-[calc(100vh-88px)] overflow-y-auto"
              >
                <div className="space-y-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsOpen(false)}
                      className={`block px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                        location.pathname === link.to ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border/50">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`p-3 rounded-xl text-[10px] font-black cursor-pointer ${
                          i18n.language === lang.code ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>

                  {isAuthenticated ? (
                    <div className="mt-4 space-y-2 border-t border-border/50 pt-4">
                      <div className="rounded-xl bg-primary/10 px-4 py-3 text-xs font-bold text-primary border border-primary/20">
                        {user?.name}
                      </div>
                      <button
                        onClick={() => {
                          logout();
                          setIsOpen(false);
                          navigate("/");
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-500"
                      >
                        <LogOut className="h-4 w-4" />
                        {t("nav.logout", localizedNav[currentLang].logout)}
                      </button>
                    </div>
                  ) : (
                    <Link to="/login" onClick={() => setIsOpen(false)} className="mt-4 block border-t border-border/50 pt-4">
                      <button className="btn-primary w-full !px-5 !py-3 !text-sm !rounded-xl cursor-pointer">
                        {t("nav.login", "Login")}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </Link>
                  )}
                </div>
              </motion.div>
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
                    <span className="w-10 h-10 icon-box-solid rounded-2xl flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3" />
                      </svg>
                    </span>
                    <span className="font-extrabold text-xl text-foreground tracking-tighter uppercase font-jakarta">
                      {t("common.brand", "Ikhtisosiman")}
                    </span>
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8 leading-relaxed max-w-sm">
                    {t("nav.about_desc", "Platform for students and young professionals to explore better career paths in Tajikistan.")}
                  </p>
                  <div className="flex gap-4">
                    {socialLinks.map((social, i) => (
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
                      {navLinks.slice(0, 3).map((link, i) => (
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
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-primary" />
                        +992 123 456 789
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 md:mt-20 pt-6 md:pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.22em] md:tracking-widest leading-relaxed text-center md:text-left">
                  {t("footer.copyright", "© 2025 Ikhtisosiman. Built with")} <span className="text-rose-500 animate-pulse">❤</span>{" "}
                  {t("footer.copyright_2", "in Tajikistan.")}
                </p>
              </div>
            </div>
          </div>
        </footer>
      )}

      <FloatingChatButton onClick={() => setChatOpen(true)} />
      <ChatModal open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
};

export default Layout;
