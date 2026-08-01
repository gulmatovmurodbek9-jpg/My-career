import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router";
import {
  Briefcase,
  TrendingUp,
  Clock,
  ChevronDown,
  ArrowRight,
  Code,
  Users,
  BookOpen,
  DollarSign,
  GraduationCap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";
import { Tabs, TabsList, TabsTrigger } from "./tabs";

export function SpecialtyCardList({ specialty }) {
  return (
    <Link to={`/info/${specialty.id}`}>
      <div className="glass-card p-5 group h-full flex flex-col">
        <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors mb-1.5 truncate">
          {specialty.name}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
          {specialty.description || specialty.purpose}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {specialty.skills?.technical?.slice(0, 2).map((skill, i) => (
              <span key={i} className="pill-tag !text-[10px] !py-0.5 !px-2">{skill}</span>
            ))}
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Link>
  );
}

// Full details card
export default function SpecialtyCard({ specialty }) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("skills");
  const { t } = useTranslation();

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-lg text-foreground mb-1 truncate">
              {specialty.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {specialty.description || specialty.purpose}
            </p>
          </div>
          <Link to={`/info/${specialty.id}`}>
            <div className="w-9 h-9 rounded-xl icon-box flex items-center justify-center hover:scale-105 transition-transform flex-shrink-0">
              <ArrowRight className="h-4 w-4 text-primary" />
            </div>
          </Link>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {specialty.skills?.technical?.slice(0, 4).map((skill, i) => (
            <span key={i} className="pill-tag !text-[10px] !py-0.5 !px-2">{skill}</span>
          ))}
          {specialty.skills?.technical?.length > 4 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              +{specialty.skills.technical.length - 4}
            </span>
          )}
        </div>

        {/* Quick stats */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-3">
          {specialty.salaryAndMarket?.junior && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <span>{specialty.salaryAndMarket.junior}</span>
            </div>
          )}
          {specialty.roadmap?.length > 0 && (
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>{specialty.roadmap.length} {t('common.steps', "қадам")}</span>
            </div>
          )}
          {specialty.technologies?.length > 0 && (
            <div className="flex items-center gap-1">
              <Code className="h-3 w-3" />
              <span>{specialty.technologies.length} {t('common.technologies', "технология")}</span>
            </div>
          )}
        </div>

        {/* Expand/Collapse */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 cursor-pointer transition-colors"
        >
          {expanded ? t('common.collapse', "Набастан") : t('common.read_more', "Бештар")}
          <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>

        {/* Expanded Content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-border/50 mt-3">
                <Tabs defaultValue="skills" onValueChange={setActiveTab}>
                  <TabsList className="bg-muted/50 backdrop-blur-sm border border-border/50 p-0.5 rounded-xl">
                    <TabsTrigger value="skills" className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg px-3 py-1.5">
                      {t('common.skills', "Маҳорат")}
                    </TabsTrigger>
                    <TabsTrigger value="roadmap" className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg px-3 py-1.5">
                      {t('common.roadmap', "Нақша")}
                    </TabsTrigger>
                    <TabsTrigger value="salary" className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg px-3 py-1.5">
                      {t('common.salary', "Музд")}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="mt-3">
                  {activeTab === "skills" && (
                    <div className="grid grid-cols-2 gap-3">
                      {specialty.skills?.technical?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1">
                            <Code className="h-3 w-3 text-primary" /> {t('common.technical', "Техникӣ")}
                          </h4>
                          <div className="space-y-1">
                            {specialty.skills.technical.map((s, i) => (
                              <div key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-primary" /> {s}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {specialty.skills?.soft?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1">
                            <Users className="h-3 w-3 text-purple-500" /> {t('common.soft', "Муоширатӣ")}
                          </h4>
                          <div className="space-y-1">
                            {specialty.skills.soft.map((s, i) => (
                              <div key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-purple-500" /> {s}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "roadmap" && specialty.roadmap?.length > 0 && (
                    <div className="space-y-2">
                      {specialty.roadmap.map((step) => (
                        <div key={step.step} className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded icon-box flex items-center justify-center text-primary text-[10px] font-bold flex-shrink-0 mt-0.5">
                            {step.step}
                          </div>
                          <div>
                            <div className="text-xs font-medium text-foreground">{step.title}</div>
                            <div className="text-[10px] text-muted-foreground">{step.tasks?.slice(0, 2).join(", ")}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "salary" && specialty.salaryAndMarket && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="glass-card-sm p-3 text-center">
                        <div className="text-[10px] text-muted-foreground">Junior</div>
                        <div className="text-sm font-bold text-emerald-600">{specialty.salaryAndMarket.junior}</div>
                      </div>
                      <div className="glass-card-sm p-3 text-center">
                        <div className="text-[10px] text-muted-foreground">Mid</div>
                        <div className="text-sm font-bold text-amber-600">{specialty.salaryAndMarket.mid}</div>
                      </div>
                      <div className="glass-card-sm p-3 text-center">
                        <div className="text-[10px] text-muted-foreground">Senior</div>
                        <div className="text-sm font-bold text-indigo-600">{specialty.salaryAndMarket.senior}</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 text-center">
                  <Link to={`/info/${specialty.id}`}>
                    <button className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1 cursor-pointer">
                      {t('common.read_more_long', "Пурра хонед")} <ArrowRight className="h-3 w-3" />
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
