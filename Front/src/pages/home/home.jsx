import {
  ArrowRight,
  BookOpen,
  Briefcase,
  FileText,
  Globe,
  Heart,
  Monitor,
  Play,
  Search,
  Star,
  Target,
  TrendingUp,
  Users,
  Shield,
  Map,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { motion } from "framer-motion";
import React, { useEffect, useState, Suspense } from "react";
import { LazyHero3DSlider } from "../../components/hero3DSlider";
import { LazyInteractive3DSection } from "../../components/3dSection";
import axios from "axios";
import SpecialtyCard from "../../components/jobCard";
import { API } from "../../lib/config";
import { Link } from "react-router";

import { useTranslation } from "react-i18next";

const Home = () => {
  const { t } = useTranslation();
  let [topCareers, setTopCareers] = useState([]);

  const specialties = [
    { title: t('home.specialties.tech.title', "Табиӣ ва техникӣ"), icon: Monitor, description: t('home.specialties.tech.desc', "Математика, физика, техника ва технологияҳо."), tags: ["Математика", "Физика", "Инженерӣ", "IT"], gradient: "from-blue-500 to-indigo-500" },
    { title: t('home.specialties.econ.title', "Иқтисод ва география"), icon: Globe, description: t('home.specialties.econ.desc', "Иқтисод, менеҷмент, молия ва география."), tags: ["Иқтисод", "Молия", "География", "Менеҷмент"], gradient: "from-emerald-500 to-teal-500" },
    { title: t('home.specialties.arts.title', "Филология ва санъат"), icon: BookOpen, description: t('home.specialties.arts.desc', "Забон, адабиёт, педагогика ва санъат."), tags: ["Забон", "Адабиёт", "Санъат", "Педагогика"], gradient: "from-violet-500 to-purple-500" },
    { title: t('home.specialties.law.title', "Ҷомеашиносӣ ва ҳуқуқ"), icon: Users, description: t('home.specialties.law.desc', "Сиёсат, ҳуқуқ ва ҷамъиятшиносӣ."), tags: ["Ҳуқуқ", "Сиёсат", "Ҷомеашиносӣ"], gradient: "from-rose-500 to-pink-500" },
    { title: t('home.specialties.med.title', "Тиб ва варзиш"), icon: Heart, description: t('home.specialties.med.desc', "Тиб, биология, саломатӣ ва варзиш."), tags: ["Тиб", "Биология", "Варзиш"], gradient: "from-amber-500 to-orange-500" },
  ];

  const demandData = [
    { name: t('home.demand.med', "Тиб"), demand: 90 },
    { name: "IT", demand: 95 },
    { name: t('home.demand.econ', "Иқтисод"), demand: 75 },
    { name: t('home.demand.law', "Ҳуқуқ"), demand: 70 },
    { name: t('home.demand.ped', "Педагогика"), demand: 65 },
  ];

  const salaryData = [
    { name: t('home.demand.med', "Тиб"), value: 22, color: "#ef4444" },
    { name: "IT", value: 25, color: "#5B6CF0" },
    { name: t('home.demand.econ', "Иқтисод"), value: 15, color: "#f59e0b" },
    { name: t('home.demand.law', "Ҳуқуқ"), value: 12, color: "#10b981" },
    { name: t('home.demand.ped', "Педагогика"), value: 6, color: "#8B5CF6" },
  ];

  const steps = [
    { icon: Search, title: t('home.steps.1.title', "Ихтисосро интихоб кунед"), description: t('home.steps.1.desc', "Аз рӯйхати пурра ихтисосҳои мувофиқро ёбед."), step: "01" },
    { icon: FileText, title: t('home.steps.2.title', "Маълумот гиред"), description: t('home.steps.2.desc', "Маълумоти муфассал дар бораи ҳар касб."), step: "02" },
    { icon: BookOpen, title: t('home.steps.3.title', "Маҳорат омӯзед"), description: t('home.steps.3.desc', "Маҳорати касбӣ ва таҳсилоти лозимро ёбед."), step: "03" },
    { icon: Target, title: t('home.steps.4.title', "Барои касб омода шавед"), description: t('home.steps.4.desc', "Роҳнамоӣ ва имкониятҳои корӣ."), step: "04" },
  ];

  const features = [
    { icon: Shield, title: t('home.features.1.title', "Маълумоти тасдиқшуда"), description: t('home.features.1.desc', "Маълумот мунтазам навсозӣ мешаванд") },
    { icon: Map, title: t('home.features.2.title', "Роҳнамоҳои касбӣ"), description: t('home.features.2.desc', "Роҳнамоии қадам ба қадами касбӣ") },
    { icon: BookOpen, title: t('home.features.3.title', "Манбаъҳои ройгон"), description: t('home.features.3.desc', "Мавод ва манбаъҳои пурра бо нархи ройгон") },
    { icon: Users, title: t('home.features.4.title', "Барои донишҷӯён"), description: t('home.features.4.desc', "Платформа махсус барои рушди касбии шумо сохта шудааст") },
  ];



  const stats = [
    { value: "150+", label: t('home.stats.careers', "Ихтисосҳо") },
    { value: "50+", label: t('home.stats.universities', "Донишгоҳҳо") },
    { value: t('home.stats.free_val', "Ройгон"), label: t('home.stats.free_label', "Дастрасии пурра") },
  ];

  async function get() {
    try {
      let { data } = await axios.get(`${API}/careers`);
      setTopCareers(data.data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    get();
    window.scrollTo(0, 0);
  }, []);



  return (
    <div>
      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative min-h-screen flex items-center hero-gradient overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-36 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <div className="pill-tag shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {t('home.hero_tag', 'Роҳнамои касбии шумо')}
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-[1.15] text-foreground tracking-tight">
                  {t('home.hero_title_1', 'Касби ояндаро')} {" "}
                  <span className="text-gradient-primary">{t('home.hero_title_2', 'интихоб кун')}</span> {t('home.hero_title_3', 'ва роҳи худро')} {" "}
                  <span className="text-gradient-secondary">{t('home.hero_title_4', 'муайян соз!')}</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                  {t('home.hero_desc', 'Ҳамаи ихтисосҳои Тоҷикистон бо маълумоти мукаммал, рейтинг ва роҳҳои касбӣ — дар як ҷо.')}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/careers">
                  <button className="btn-primary px-7 py-3.5 text-sm flex items-center gap-2 cursor-pointer">
                    {t('home.btn_careers', 'Дидани ихтисосҳо')} <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                <Link to="/quiz">
                  <button className="btn-secondary px-7 py-3.5 text-sm flex items-center gap-2 cursor-pointer">
                    <Play className="h-4 w-4" /> {t('home.btn_start', 'Оғоз кардан')}
                  </button>
                </Link>
              </div>

              <div className="flex items-center gap-10 pt-2">
                {stats.map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.12 }}
                  >
                    <div className="text-2xl font-bold text-gradient-primary">{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block w-full max-w-[600px] mx-auto"
            >
              <Suspense fallback={
                <div className="relative w-full h-[500px] lg:h-[600px] flex items-center justify-center overflow-hidden perspective-1000">
                  <div className="glass-card w-full h-full flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                      <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Боргузорӣ...</p>
                    </div>
                  </div>
                </div>
              }>
                <LazyHero3DSlider />
              </Suspense>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════ SPECIALTIES ═══════════════ */}
      <section className="py-28 section-wash">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 tracking-tight">{t('home.specialties.header', 'Ихтисосҳои гуногунро кашф намо')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">{t('home.specialties.subheader', 'Маълумоти пурра дар бораи касбҳои гуногун ва талаботи бозори меҳнат.')}</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {specialties.map((spec, index) => {
              const Icon = spec.icon;
              return (
                <motion.div key={index} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }}>
                  <div className="glass-card p-6 h-full">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${spec.gradient} flex items-center justify-center mb-5 shadow-lg`} style={{ boxShadow: "0 6px 20px rgba(91, 108, 240, 0.2)" }}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2 text-lg">{spec.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{spec.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {spec.tags.map((tag, i) => (
                        <span key={i} className="pill-tag !text-[11px] !py-1 !px-2.5">{tag}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ STATS & CHARTS ═══════════════ */}
      <section className="py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 tracking-tight">{t('home.stats_section.header', 'Рейтингҳо ва таҳлил')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">{t('home.stats_section.subheader', 'Маълумотҳои таҳлилӣ дар бораи касбҳои бештар талабшаванда.')}</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
            {[
              { title: t('home.stats_section.job_ops', "Имкониятҳои корӣ"), value: t('home.stats_section.high', "Баланд"), change: t('home.stats_section.demand', "Талабот"), icon: Briefcase, gradient: "from-blue-500 to-indigo-500" },
              { title: t('home.stats.careers', "Ихтисосҳо"), value: "150+", change: t('home.stats_section.discovery', "Кашф кунед"), icon: Users, gradient: "from-emerald-500 to-teal-500" },
              { title: t('home.stats_section.access', "Дастрасӣ"), value: t('home.stats.free_val', "Ройгон"), change: t('home.stats_section.always', "Ҳамеша"), icon: TrendingUp, gradient: "from-violet-500 to-purple-500" },
            ].map((card, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }}>
                <div className="glass-card p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-md`}>
                      <card.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm text-muted-foreground">{card.title}</span>
                  </div>
                  <div className="text-3xl font-bold text-foreground">{card.value}</div>
                  <div className="text-xs text-emerald-600 mt-1 font-medium">{card.change}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="glass-card p-6">
              <h3 className="font-semibold text-foreground mb-1">{t('home.charts.demand_title', 'Касбҳои бештар талабшаванда')}</h3>
              <p className="text-xs text-muted-foreground mb-5">{t('home.charts.demand_subtitle', 'Талабот дар бозори кор')}</p>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demandData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(224 15% 50%)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(224 15% 50%)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", border: "1px solid rgba(99,102,241,0.1)", borderRadius: "14px", boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }} />
                    <Bar dataKey="demand" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5B6CF0" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass-card p-6">
              <h3 className="font-semibold text-foreground mb-1">{t('home.charts.salary_title', 'Тақсимоти музди меҳнат')}</h3>
              <p className="text-xs text-muted-foreground mb-5">{t('home.charts.salary_subtitle', 'Музди миёна дар панҷ ихтисос')}</p>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={salaryData} cx="50%" cy="50%" innerRadius={55} outerRadius={105} paddingAngle={3} dataKey="value">
                      {salaryData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", border: "1px solid rgba(99,102,241,0.1)", borderRadius: "14px", boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-3 justify-center">
                {salaryData.map((entry, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
                    {entry.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section className="py-28 section-wash">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 tracking-tight">{t('home.how_it_works.header', 'Чӣ хел кор мекунад')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">{t('home.how_it_works.subheader', 'Чор қадами оддӣ барои кашфи роҳи касбии идеалии худ.')}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div key={index} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                  <div className="glass-card p-6 text-center h-full">
                    <div className="relative inline-block mb-5">
                      <div className="w-14 h-14 icon-box flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-7 h-7 icon-box-solid flex items-center justify-center text-[11px] font-bold text-white rounded-lg">
                        {step.step}
                      </div>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section className="py-28 hero-gradient">
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card p-12">
            <div className="flex justify-center gap-0.5 mb-5">
              {[...Array(5)].map((_, i) => (<Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />))}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">{t('home.cta.header', 'Ояндаи худро имрӯз ба нақша гиред')}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-6">{t('home.cta.subheader', 'Маълумоти пурра ва дақиқ барои интихоби огоҳонаи касб.')}</p>
            <Link to="/quiz">
              <button className="btn-primary px-8 py-4 text-base inline-flex items-center gap-2 cursor-pointer">
                {t('home.cta.btn', 'Ҳозир оғоз кунед')} <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <div className="flex flex-wrap justify-center gap-6 pt-5 text-sm text-muted-foreground">
              {t('home.cta.tags', { returnObjects: true })?.map((text, i) => (
                <div key={i} className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500" />{text}</div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ 3D ═══════════════ */}
      <Suspense fallback={
        <div className="py-28 section-wash relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="glass-card overflow-hidden aspect-square !p-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Боргузорӣ...</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="glass-card p-6">
                  <div className="h-6 w-3/4 bg-muted rounded animate-pulse mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded animate-pulse"></div>
                    <div className="h-3 bg-muted rounded animate-pulse"></div>
                    <div className="h-3 bg-muted rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="glass-card min-h-[200px] p-6"></div>
              </div>
            </div>
          </div>
        </div>
      }>
        <LazyInteractive3DSection />
      </Suspense>

      {/* ═══════════════ TOP CAREERS ═══════════════ */}
      <section className="py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 tracking-tight">{t('home.top_careers.header', 'Ихтисосҳои пешқадам')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">{t('home.top_careers.subheader', 'Касбҳои талаботбаланд бо дурнамоҳои хуб дар Тоҷикистон')}</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {topCareers.slice(0, 4).map((e, i) => (
              <motion.div key={e.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <SpecialtyCard specialty={e} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ WHY US ═══════════════ */}
      <section className="py-28 section-wash">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 tracking-tight">{t('home.why_us.header', 'Чаро моро интихоб мекунед')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">{t('home.why_us.subheader', 'Мо воситаҳо ва маълумотҳои зарурӣ пешниҳод мекунем')}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {features.map((feature, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }}>
                <div className="glass-card p-6 flex items-start gap-5">
                  <div className="w-12 h-12 icon-box flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1.5">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


    </div>
  );
};

export default Home;
