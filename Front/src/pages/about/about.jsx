import { motion } from "framer-motion";
import {
  BookOpen,
  Code,
  Globe,
  GraduationCap,
  Heart,
  Lightbulb,
  Rocket,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import React from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

const About = () => {
  const { t } = useTranslation();
  const values = [
    { icon: Target, title: t('about_page.mission_title', "Миссияи мо"), description: t('about_page.mission_desc', "Кӯмак ба ҷавонони Тоҷикистон дар интихоби касби мувофиқ тавассути маълумоти дақиқ ва роҳнамоии ҳамаҷониба."), gradient: "from-blue-500 to-indigo-500" },
    { icon: Lightbulb, title: t('about_page.vision_title', "Визияи мо"), description: t('about_page.vision_desc', "Сохтани ҷомеае, ки дар он ҳар шахс касби мувофиқро ёбад — ояндаи дурахшон аз интихоби дуруст оғоз мешавад."), gradient: "from-amber-500 to-orange-500" },
    { icon: Heart, title: t('about_page.values_title', "Арзишҳои мо"), description: t('about_page.values_desc', "Шаффофият, сифати маълумот ва дастрасии баробар — мо ба ин арзишҳо содиқем."), gradient: "from-rose-500 to-pink-500" },
    { icon: Zap, title: t('about_page.innovation_title', "Навоварӣ"), description: t('about_page.innovation_desc', "Истифодаи технологияи AI ва маълумоти замонавӣ барои пешниҳоди беҳтарин роҳнамоии касбӣ."), gradient: "from-emerald-500 to-teal-500" },
  ];

  const impactStats = [
    { value: "150+", label: t('about_page.stat_careers', "Ихтисосҳо"), icon: BookOpen },
    { value: "100к+", label: t('about_page.stat_users', "Корбарон"), icon: Users },
    { value: "50+", label: t('about_page.stat_clusters', "Кластерҳо"), icon: Globe },
    { value: "95%", label: t('about_page.stat_satisfaction', "Қаноатмандӣ"), icon: Star },
  ];

  const timeline = [
    { year: "2024", title: t('about_page.timeline_1_title', "Оғози лоиҳа"), description: t('about_page.timeline_1_desc', "Идеяи сохтани платформаи роҳнамоии касбӣ таваллуд шуд."), icon: Rocket },
    { year: "2024", title: t('about_page.timeline_2_title', "Рушди платформа"), description: t('about_page.timeline_2_desc', "Сохтани базаи маълумот ва интерфейси корбарӣ."), icon: Code },
    { year: "2025", title: t('about_page.timeline_3_title', "Интиқоли AI"), description: t('about_page.timeline_3_desc', "Илова кардани системаи зеҳнии сунъӣ (AI) ва маслиҳатгар."), icon: Lightbulb },
    { year: "2025", title: t('about_page.timeline_4_title', "Роҳандозӣ"), description: t('about_page.timeline_4_desc', "Платформа ба истифодаи умумӣ пешниҳод шуд."), icon: Globe },
  ];

  const supporters = [
    { name: "Гулматов Муродбек", role: t('about_page.team_member_1_role', "Бунёдгузор"), avatar: "МГ", description: t('about_page.team_member_1_desc', "Сохтори кулли лоиҳа ва идоракунии рушд") },
    { name: t('about_page.team_member_2_name', "Ҷамоати рушд"), role: t('about_page.team_member_2_role', "Барномасозон"), avatar: "ҶР", description: t('about_page.team_member_2_desc', "Рушди фронтенд ва бекенди платформа") },
  ];

  return (
    <div>
      {/* ═══ HERO ═══ */}
      <section className="pt-28 pb-14 hero-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-5">
            <div className="pill-tag mx-auto w-fit">
              <Heart className="w-3.5 h-3.5" /> {t('about_page.hero_tag', "Дар бораи мо")}
            </div>
            <h1
              className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight"
              dangerouslySetInnerHTML={{ __html: t('about_page.hero_title', "Роҳнамоии касбӣ барои <span class=\"text-gradient-primary\">ояндаи дурахшон</span>").replace(/className=/g, 'class=') }}
            />
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-lg">
              {t('about_page.hero_desc', "Мо ба ҷавонони Тоҷикистон кӯмак мекунем, то касби идеалии худро бо маълумоти дақиқ ва роҳнамоии касбӣ пайдо кунанд.")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {impactStats.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <div className="glass-card p-6 text-center">
                  <div className="w-11 h-11 icon-box mx-auto mb-3 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-gradient-primary">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ VALUES ═══ */}
      <section className="py-24 section-wash">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 tracking-tight">{t('about_page.values_section_title', "Арзишҳо ва мақсадҳо")}</h2>
            <p className="text-muted-foreground text-lg">{t('about_page.values_section_desc', "Принсипҳое, ки моро ҳаракат медиҳанд.")}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div key={index} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }}>
                  <div className="glass-card p-6 flex items-start gap-5 h-full">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${value.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`} style={{ boxShadow: "0 6px 20px rgba(91, 108, 240, 0.2)" }}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1.5 text-lg">{value.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ TIMELINE ═══ */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 tracking-tight">{t('about_page.story_title', "Ҳикояи мо")}</h2>
            <p className="text-muted-foreground text-lg">{t('about_page.story_desc', "Роҳи мо аз идея то платформаи пурра.")}</p>
          </motion.div>

          <div className="space-y-6">
            {timeline.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div key={index} initial={{ opacity: 0, x: index % 2 === 0 ? -16 : 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex gap-4 items-start"
                >
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-12 h-12 icon-box-solid rounded-2xl flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    {index < timeline.length - 1 && (
                      <div className="w-px h-10 mt-2" style={{ background: "linear-gradient(180deg, rgba(91,108,240,0.3), transparent)" }} />
                    )}
                  </div>
                  <div className="glass-card p-5 flex-1">
                    <div className="pill-tag !text-[10px] !py-0.5 !px-2 w-fit mb-2">{item.year}</div>
                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ TEAM ═══ */}
      <section className="py-24 section-wash">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 tracking-tight">{t('about_page.team_title', "Ҷамоаи мо")}</h2>
            <p className="text-muted-foreground text-lg">{t('about_page.team_desc', "Одамоне, ки лоиҳаро месозанд.")}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {supporters.map((member, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                <div className="glass-card p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl icon-box-solid mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg">
                    {member.avatar}
                  </div>
                  <h3 className="font-semibold text-foreground mb-0.5">{member.name}</h3>
                  <p className="text-xs text-primary font-medium mb-2">{member.role}</p>
                  <p className="text-sm text-muted-foreground">{member.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-24 hero-gradient">
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="glass-card p-10">
              <h2
                className="text-2xl sm:text-3xl font-bold text-foreground mb-4"
                dangerouslySetInnerHTML={{ __html: t('about_page.cta_title', "Омода ба <span class=\"text-gradient-primary\">кашфиёт</span>?").replace(/className=/g, 'class=') }}
              />
              <p className="text-muted-foreground max-w-xl mx-auto mb-6 text-lg">{t('about_page.cta_desc', "Ба ҳазорҳо донишҷӯе ҳамроҳ шавед, ки роҳи касбиро ёфтаанд.")}</p>
              <Link to="/careers">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 btn-primary px-8 py-3.5 text-sm cursor-pointer">
                  {t('about_page.cta_btn', "Ихтисосҳоро кашф кунед")} <TrendingUp className="h-4 w-4" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
