import { motion } from "framer-motion";
import {
  BookOpen,
  ArrowLeft,
  Award,
  Briefcase,
  Building,
  CheckCircle,
  Code,
  DollarSign,
  ExternalLink,
  GraduationCap,
  Lightbulb,
  MapPin,
  Target,
  TrendingUp,
  Users,
  Loader2,
  Map,
  Star,
  Sparkles,
  ChevronRight,
  Layers,
  Rocket,
  Heart,
  Bookmark,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router";
import { useAuthStore } from "../../store/authStore";
import PsychologicalProfile from "../../components/PsychologicalProfile";
import { API } from "../../lib/config";

const fadeIn = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

const Info = () => {
  const { id } = useParams();
  const { user, token, updateUser, refreshProfile } = useAuthStore();
  const [career, setCareer] = useState(null);
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stats for the Like/Save buttons
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchCareer() {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API}/careers/${id}`);
        setCareer(data);
        setLikesCount(data.likesCount || 0);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    // Offerings load separately — the page is useful without them.
    async function fetchOfferings() {
      try {
        const { data } = await axios.get(`${API}/careers/${id}/offerings`);
        setOfferings(Array.isArray(data) ? data : []);
      } catch (error) {
        setOfferings([]);
      }
    }
    fetchCareer();
    fetchOfferings();
    window.scrollTo(0, 0);
  }, [id]); // ← user-ро набояд гузорем — infinite loop мешавад

  // Like/Save холати аввалро аз user нишон деҳ (танҳо вақте user ё id тағйир ёбад)
  useEffect(() => {
    if (user) {
      setIsLiked(user.likedCareers?.some(c => c.id === id) || false);
      setIsSaved(user.savedCareers?.some(c => c.id === id) || false);
    }
  }, [id, user?.id, user?.likedCareers, user?.savedCareers]);

  const handleLike = async () => {
    if (!token || isLiking) return;
    try {
      setIsLiking(true);
      const { data } = await axios.post(`${API}/careers/${id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsLiked(data.liked);
      setLikesCount(data.likesCount);

      // Update global user state for persistence
      const currentLiked = user?.likedCareers || [];
      const updatedLiked = data.liked
        ? [...currentLiked, career]
        : currentLiked.filter(c => c.id !== id);
      updateUser({ likedCareers: updatedLiked });
    } catch (err) {
      console.error("Like error:", err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async () => {
    if (!token || isSaving) return;
    try {
      setIsSaving(true);
      const { data } = await axios.post(`${API}/users/save-career/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsSaved(data.saved);

      // Update global user state for persistence
      const currentSaved = user?.savedCareers || [];
      const updatedSaved = data.saved
        ? [...currentSaved, career]
        : currentSaved.filter(c => c.id !== id);
      updateUser({ savedCareers: updatedSaved });
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl icon-box-solid flex items-center justify-center mx-auto shadow-lg animate-pulse">
            <Briefcase className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-2">
            <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Маълумот бор карда истодааст...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!career) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-5">
          <div className="w-20 h-20 rounded-2xl icon-box flex items-center justify-center mx-auto">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Ихтисос ёфт нашуд</h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">Мутаассифона, ихтисоси дархостшуда дар базаи маълумот мавҷуд нест.</p>
          <Link to="/careers" className="inline-flex items-center gap-2 btn-primary px-6 py-3 text-sm">
            <ArrowLeft className="w-4 h-4" /> Ба рӯйхати ихтисосҳо
          </Link>
        </div>
      </div>
    );
  }

  /* --- Section wrapper --- */
  const Section = ({ icon: Icon, title, subtitle, gradient, children }) => (
    <motion.div {...fadeIn}>
      <div className="glass-card overflow-hidden">
        {/* Section header with gradient accent */}
        <div className={`flex items-center gap-4 p-5 border-b border-border/30`}
          style={{ background: "linear-gradient(135deg, rgba(91,108,240,0.04) 0%, rgba(139,92,246,0.02) 100%)" }}
        >
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
            <Icon className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div className="p-5">
          {children}
        </div>
      </div>
    </motion.div>
  );

  /* --- Stat card --- */
  const StatCard = ({ icon: Icon, label, value, color, bg }) => (
    <div className={`flex flex-col items-center p-4 rounded-xl ${bg} border border-border/30 text-center`}>
      <Icon className={`h-5 w-5 ${color} mb-2`} />
      <span className="text-[11px] text-muted-foreground mb-0.5">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  );

  const techSkills = career.skills?.technical || [];
  const softSkills = career.skills?.soft || [];
  const roadmap = career.roadmap || [];
  const salary = career.salaryAndMarket;
  const techs = career.technologies || [];
  const opportunities = career.careerOpportunities || [];
  const certs = career.certification || [];
  const unis = career.universities || [];
  const resources = career.learningResources;
  const related = career.relatedSpecializations || [];

  return (
    <div>
      {/* ═══════════════════════════════════════════════
          HERO — Premium header
         ═══════════════════════════════════════════════ */}
      <section className="pt-28 pb-16 hero-gradient relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #5B6CF0 1px, transparent 1px), radial-gradient(circle at 80% 30%, #8B5CF6 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-5">

            {/* Top row: Back link & Actions */}
            <div className="flex items-center justify-between">
              <Link to="/careers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors group">
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Ба рӯйхати ихтисосҳо
              </Link>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-sm ${isLiked ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" : "glass-card-sm text-muted-foreground hover:text-rose-400"
                    }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                  {likesCount}
                </button>
                <button
                  onClick={handleSave}
                  className={`p-2.5 rounded-xl transition-all ${isSaved ? "bg-secondary/20 text-secondary border border-secondary/30 shadow-lg shadow-secondary/10" : "glass-card-sm text-muted-foreground hover:text-secondary"
                    }`}
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
                </button>
              </div>
            </div>

            <div className="flex items-start gap-5">
              {/* Big icon */}
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl icon-box-solid flex items-center justify-center flex-shrink-0 shadow-xl">
                <Briefcase className="h-8 w-8 sm:h-9 sm:w-9 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                {/* Cluster badge */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {career.cluster?.clusterName && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/15">
                      <Star className="h-3 w-3" /> {career.cluster.clusterName}
                    </span>
                  )}
                  {career.code && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-muted-foreground border border-white/10">
                      Коди МНТ: {career.code}
                    </span>
                  )}
                  {career.hasFreeSeats && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Ҷойҳои ройгон ҳастанд
                    </span>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-tight">
                  {career.name}
                </h1>
              </div>
            </div>

            {/* Description */}
            <p className="text-muted-foreground max-w-3xl leading-relaxed text-base sm:text-lg">
              {career.description || career.purpose}
            </p>

            {/* Quick stats row */}
            <div className="flex flex-wrap gap-3">
              {(career.minTuitionFee || career.maxTuitionFee) && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card-sm text-xs">
                  <DollarSign className="h-3.5 w-3.5 text-secondary" />
                  <span className="text-muted-foreground">Нархи таҳсил:</span>
                  <span className="font-bold text-secondary">
                    {career.minTuitionFee === career.maxTuitionFee
                      ? `${career.minTuitionFee.toLocaleString('ru-RU')} сом./сол`
                      : `${career.minTuitionFee?.toLocaleString('ru-RU')} – ${career.maxTuitionFee?.toLocaleString('ru-RU')} сом./сол`}
                  </span>
                </div>
              )}
              {offerings.length > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card-sm text-xs">
                  <GraduationCap className="h-3.5 w-3.5 text-blue-500" />
                  <span className="font-bold text-blue-500">
                    {new Set(offerings.map(o => o.university?.name)).size} муассиса
                  </span>
                </div>
              )}
              {salary?.junior && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card-sm text-xs">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-muted-foreground">Маоши ибтидоӣ:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{salary.junior}</span>
                </div>
              )}
              {roadmap.length > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card-sm text-xs">
                  <Map className="h-3.5 w-3.5 text-primary" />
                  <span className="font-bold text-primary">{roadmap.length} қадами омӯзишӣ</span>
                </div>
              )}
              {techs.length > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card-sm text-xs">
                  <Code className="h-3.5 w-3.5 text-cyan-500" />
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">{techs.length} технология</span>
                </div>
              )}
              {certs.length > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card-sm text-xs">
                  <Award className="h-3.5 w-3.5 text-amber-500" />
                  <span className="font-bold text-amber-600 dark:text-amber-400">{certs.length} сертификат</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          CONTENT — Info sections
         ═══════════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-5">

          {/* --- Мақсади ихтисос --- */}
          {career.purpose && (
            <Section icon={Target} title="Мақсади ихтисос" subtitle="Ин ихтисос барои чӣ зарур аст" gradient="from-blue-500 to-indigo-500">
              <p className="text-muted-foreground leading-relaxed">{career.purpose}</p>
            </Section>
          )}

          {/* --- Psychological Profile (User Specific) --- */}
          {user?.quizResults && (
            <motion.div {...fadeIn}>
              <PsychologicalProfile results={user.quizResults} />
            </motion.div>
          )}

          {/* --- Маоши меҳнат --- */}
          {salary && (
            <Section icon={DollarSign} title="Маоши меҳнат" subtitle="Дар бозори кор чӣ қадар маблағ мегиранд" gradient="from-emerald-500 to-green-500">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: "Навкор (Junior)", desc: "0-1 соли таҷриба", value: salary.junior, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/5", icon: Rocket },
                  { label: "Миёна (Mid)", desc: "2-4 соли таҷриба", value: salary.mid, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/5", icon: TrendingUp },
                  { label: "Таҷрибадор (Senior)", desc: "5+ соли таҷриба", value: salary.senior, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-500/5", icon: Star },
                ].filter(t => t.value).map((tier, i) => (
                  <div key={i} className={`${tier.bg} rounded-xl p-5 border border-border/30 text-center relative overflow-hidden`}>
                    <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: i === 0 ? "#10b981" : i === 1 ? "#f59e0b" : "#2563eb" }} />
                    <tier.icon className={`h-6 w-6 ${tier.color} mx-auto mb-2`} />
                    <div className="text-xs text-muted-foreground mb-1">{tier.label}</div>
                    <div className={`text-2xl font-bold ${tier.color} mb-1`}>{tier.value}</div>
                    <div className="text-[10px] text-muted-foreground">{tier.desc}</div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* --- Маҳоратҳо --- */}
          {career.skills && (
            <Section icon={Code} title="Маҳоратҳои зарурӣ" subtitle="Чӣ маҳоратҳо бояд дошта бошед" gradient="from-violet-500 to-purple-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {techSkills.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center"><Code className="w-3.5 h-3.5 text-primary" /></div>
                      Маҳоратҳои техникӣ
                    </h3>
                    <div className="space-y-1.5">
                      {techSkills.map((skill, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl glass-card-sm hover:shadow-sm transition-shadow">
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                          <span className="text-sm text-foreground font-medium">{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {softSkills.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center"><Users className="w-3.5 h-3.5 text-purple-500" /></div>
                      Маҳоратҳои муоширатӣ
                    </h3>
                    <div className="space-y-1.5">
                      {softSkills.map((skill, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl glass-card-sm hover:shadow-sm transition-shadow">
                          <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                          <span className="text-sm text-foreground font-medium">{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* --- Технологияҳо --- */}
          {techs.length > 0 && (
            <Section icon={Lightbulb} title="Технологияҳо ва абзорҳо" subtitle="Чӣ технологияҳоро бояд донед" gradient="from-cyan-500 to-blue-500">
              <div className="flex flex-wrap gap-2">
                {techs.map((tech, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-primary/6 text-primary border border-primary/10 hover:bg-primary/10 transition-colors">
                    <Code className="h-3.5 w-3.5" />
                    {tech}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* --- Нақшаи роҳ --- */}
          {roadmap.length > 0 && (
            <Section icon={Map} title="Нақшаи роҳи омӯзиш" subtitle="Қадам ба қадам ба мутахассиси касбӣ табдил ёбед" gradient="from-emerald-500 to-teal-500">
              <div className="space-y-1">
                {roadmap.map((entry, index) => {
                  // A step is either a plain string ("Соли 1: ...") or the richer
                  // { step, title, tasks[] } shape some records still use.
                  const isText = typeof entry === "string";
                  const number = isText ? index + 1 : entry.step ?? index + 1;
                  const title = isText ? entry : entry.title;
                  const tasks = isText ? [] : entry.tasks || [];

                  return (
                    <div key={index} className="relative flex gap-4">
                      {/* Timeline line */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-10 h-10 rounded-xl icon-box-solid flex items-center justify-center text-white font-bold text-sm shadow-md z-10">
                          {number}
                        </div>
                        {index < roadmap.length - 1 && (
                          <div className="w-0.5 h-full min-h-[40px] mt-2" style={{ background: "linear-gradient(180deg, rgba(91,108,240,0.25), transparent)" }} />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 pb-5">
                        <div className="glass-card-sm p-4 rounded-xl">
                          <h3 className="font-bold text-foreground flex items-start gap-2 flex-wrap">
                            <span className="flex-1 min-w-0">{title}</span>
                            <span className="text-[10px] text-muted-foreground font-normal px-2 py-0.5 bg-muted rounded-full flex-shrink-0">
                              Қадами {number}
                            </span>
                          </h3>
                          {tasks.length > 0 && (
                            <div className="space-y-1.5 mt-2">
                              {tasks.map((task, taskIndex) => (
                                <div key={taskIndex} className="flex items-start gap-2">
                                  <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-muted-foreground leading-relaxed">{task}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* --- Намунаҳои лоиҳаҳо --- */}
          {career.projectsExamples?.length > 0 && (
            <Section icon={Building} title="Намунаҳои лоиҳаҳо" subtitle="Чӣ лоиҳаҳо метавонед эҷод кунед" gradient="from-orange-500 to-amber-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {career.projectsExamples.map((project, i) => (
                  <div key={i} className="flex items-center gap-3 glass-card-sm p-4 rounded-xl hover:shadow-sm transition-shadow">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                      <Layers className="h-4 w-4 text-orange-500" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{project}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* --- Имкониятҳои касбӣ --- */}
          {opportunities.length > 0 && (
            <Section icon={Briefcase} title="Имкониятҳои касбӣ" subtitle="Дар оянда кадом вазифаҳоро гирифта метавонед" gradient="from-indigo-500 to-violet-500">
              <div className="flex flex-wrap gap-2.5">
                {opportunities.map((opp, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-500/6 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10 hover:bg-indigo-500/10 transition-colors">
                    <Sparkles className="h-3.5 w-3.5" /> {opp}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* --- Сертификатҳо --- */}
          {certs.length > 0 && (
            <Section icon={Award} title="Сертификатҳо" subtitle="Сертификатҳое ки арзиши касбиро баланд мебардоранд" gradient="from-amber-500 to-yellow-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {certs.map((cert, i) => (
                  <div key={i} className="flex items-center gap-3 glass-card-sm p-4 rounded-xl hover:shadow-sm transition-shadow">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Award className="h-4 w-4 text-amber-500" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{cert}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* --- Донишгоҳҳо ва нархҳо --- */}
          {offerings.length > 0 ? (
            <Section
              icon={GraduationCap}
              title="Дар куҷо омӯхтан мумкин аст"
              subtitle={`${offerings.length} пешниҳод дар ${new Set(offerings.map(o => o.university?.name)).size} муассиса — аз арзонтарин сар карда`}
              gradient="from-blue-500 to-cyan-500"
            >
              <div className="overflow-x-auto -mx-2 px-2">
                <table className="w-full min-w-[720px] text-sm border-separate border-spacing-y-1.5">
                  <thead>
                    <tr className="text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <th className="px-4 py-2">Муассиса</th>
                      <th className="px-4 py-2">Шаҳр</th>
                      <th className="px-4 py-2">Шакл</th>
                      <th className="px-4 py-2">Забон</th>
                      <th className="px-4 py-2 text-center">Ҷойҳо</th>
                      <th className="px-4 py-2 text-right">Нарх (сол)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offerings.map((offering) => (
                      <tr key={offering.id} className="glass-card-sm">
                        <td className="px-4 py-3 rounded-l-xl">
                          <div className="font-semibold text-foreground leading-snug">{offering.university?.name}</div>
                          {offering.university?.isState === false && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">ғайридавлатӣ</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {offering.university?.city || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{offering.studyForm}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{offering.language}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground">{offering.seats || '—'}</td>
                        <td className="px-4 py-3 text-right rounded-r-xl whitespace-nowrap">
                          {offering.paymentType === 'ройгон' || offering.tuitionFee === null ? (
                            <span className="font-bold text-emerald-500">Ройгон</span>
                          ) : (
                            <span className="font-bold text-foreground">
                              {offering.tuitionFee.toLocaleString('ru-RU')} сом.
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          ) : unis.length > 0 && (
            <Section icon={GraduationCap} title="Донишгоҳҳо" subtitle="Дар куҷо метавонед ин ихтисосро омӯзед" gradient="from-blue-500 to-cyan-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {unis.map((uni, i) => (
                  <div key={i} className="glass-card-sm p-5 rounded-xl hover:shadow-sm transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground mb-0.5">{uni.name}</h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3" /> {uni.city}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* --- Манбаъҳои омӯзишӣ --- */}
          {resources && (
            <Section icon={BookOpen} title="Манбаъҳои омӯзишӣ" subtitle="Китобҳо, курсҳо ва блогҳо барои омӯзиш" gradient="from-rose-500 to-pink-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {resources.books?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center"><BookOpen className="w-3.5 h-3.5 text-primary" /></div>
                      Китобҳо
                    </h3>
                    <div className="space-y-1.5">
                      {resources.books.map((book, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg glass-card-sm">
                          <ChevronRight className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-foreground">{book}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {resources.courses?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center"><ExternalLink className="w-3.5 h-3.5 text-purple-500" /></div>
                      Курсҳо
                    </h3>
                    <div className="space-y-1.5">
                      {resources.courses.map((course, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg glass-card-sm">
                          <ChevronRight className="h-3.5 w-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-foreground">{course}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {resources.blogs?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center"><ExternalLink className="w-3.5 h-3.5 text-cyan-500" /></div>
                      Блогҳо
                    </h3>
                    <div className="space-y-1.5">
                      {resources.blogs.map((blog, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg glass-card-sm">
                          <ChevronRight className="h-3.5 w-3.5 text-cyan-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-foreground">{blog}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* --- Ихтисосҳои вобаста --- */}
          {related.length > 0 && (
            <Section icon={Layers} title="Ихтисосҳои вобаста" subtitle="Ихтисосҳои наздик ба ин соҳа" gradient="from-violet-500 to-purple-500">
              <div className="flex flex-wrap gap-2.5">
                {related.map((spec, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-purple-500/6 text-purple-600 dark:text-purple-400 border border-purple-500/10 hover:bg-purple-500/10 transition-colors">
                    <ChevronRight className="h-3.5 w-3.5" /> {spec}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* --- Маслиҳати муҳим --- */}
          {career.advice && (
            <motion.div {...fadeIn}>
              <div className="relative glass-card overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, #5B6CF0, #8B5CF6, #A78BFA)" }} />
                <div
                  className="p-6"
                  style={{ background: "linear-gradient(135deg, rgba(91,108,240,0.05) 0%, rgba(139,92,246,0.03) 100%)" }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl icon-box-solid flex items-center justify-center shadow-lg flex-shrink-0">
                      <Lightbulb className="w-5.5 h-5.5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground mb-2">Маслиҳати тиллоӣ 💡</h2>
                      <p className="text-muted-foreground leading-relaxed italic text-base">
                        &ldquo;{career.advice}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- Back to careers --- */}
          <motion.div {...fadeIn} className="text-center pt-8 pb-4">
            <p className="text-sm text-muted-foreground mb-4">Ихтисосҳои дигарро низ дидан мехоҳед?</p>
            <Link to="/careers" className="inline-flex items-center gap-2 btn-primary px-8 py-3.5 text-sm shadow-lg hover:shadow-xl transition-shadow">
              <ArrowLeft className="w-4 h-4" /> Ба рӯйхати ихтисосҳо
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Info;
