import React from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import LucideIconRenderer from "../../components/admin/LucideIconRenderer";
import Reveal from "../../components/Reveal";
import { CLUSTER_IMAGES } from "../../lib/media";
import { useClusterChapters, useHomeContent } from "./useHomeContent";

/**
 * Панҷ гурӯҳи касбҳо ҳамчун рӯйхати оддии амудӣ.
 *
 * Ин ҷои ҳикояи скролли pinned-ро гирифт. Он ҳикоя зебо буд, вале барои
 * дастрасӣ бадтарин намуна: скролл бобҳоро худаш иваз мекард, аз ин рӯ корбар
 * назорати саҳифаро гум мекард, ва мазмун танҳо як боб дар як вақт дида мешуд.
 * Дар ин ҷо ҳар панҷ гурӯҳ дар ҷараёни оддии ҳуҷҷат меистанд: скролл кардан
 * мумкин, ҷустуҷӯи браузер кор мекунад, чоп кардан мумкин, ва хондан бо
 * screen reader тартиби дуруст дорад.
 *
 * Ҳар сатр ду қабат дорад: муаррифӣ (расм ва тавсиф) ва тафсилот (се сутун).
 * Нусхаи қаблӣ ҳама чизро дар як сутуни рости баланд ҷо мекард, ва зери расм
 * тақрибан 460px фазои мурда мемонд.
 *
 * Ранг маънои иловагӣ дорад, на ягона: рақам, иконка ва номи матнӣ низ ҳастанд,
 * то корбари рангнобино чизе гум накунад.
 */

/** Як блоки маълумот дар қатори тафсилот. */
function Detail({ label, children }) {
  return (
    <div>
      <h4 className="text-base font-semibold text-foreground">{label}</h4>
      <div className="mt-3 text-[1.0625rem] leading-relaxed text-muted-foreground">
        {children}
      </div>
    </div>
  );
}

/** Ҳар як гурӯҳ. Тамоми блок дар ҷараёни оддӣ, бе position: absolute. */
function ClusterRow({ chapter, index, labels }) {
  // Захира: агар API ҳанӯз ҷавоб надода бошад, ҳамаи ихтисосҳо нишон дода
  // мешаванд. Ин аз саҳифаи хато беҳтар аст.
  const href = chapter.id ? "/careers?clusterId=" + chapter.id : "/careers";
  const number = String(index + 1).padStart(2, "0");
  const image = CLUSTER_IMAGES[chapter.clusterId];

  return (
    <Reveal
      as="article"
      className="border-t border-border py-14 first:border-t-0 first:pt-0 sm:py-16"
    >
      {/* ── Муаррифӣ: расм ва тавсиф ── */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-10">
        {/* self-start ҳатмист: бе он grid контейнерро то баландии тамоми сатр
            мекашад, вале расм 3:2 аст, ва дар поён қуттии холӣ мемонад. */}
        <div className="relative self-start overflow-hidden rounded-2xl bg-muted">
          <img
            src={image.src}
            srcSet={image.srcSet}
            sizes={image.sizes}
            alt={chapter.imageAlt}
            width={1536}
            height={1024}
            loading="lazy"
            decoding="async"
            className="aspect-[3/2] w-full object-cover"
          />

          <span
            className="absolute left-0 top-0 flex items-center gap-2.5 rounded-br-2xl px-4 py-2.5"
            style={{ background: chapter.accent }}
          >
            <span className="text-xl font-semibold tabular-nums text-background" aria-hidden>
              {number}
            </span>
            {/* Иконкаҳои Lucide бо currentColor кашида мешаванд. */}
            <span className="text-background">
              <LucideIconRenderer name={chapter.icon} className="h-5 w-5" />
            </span>
          </span>
        </div>

        <div>
          {/* Номи расмии гурӯҳ сарлавҳа аст, на номи шоирона: корбар бояд
              фавран бифаҳмад, ки сухан дар бораи чист. */}
          <h3
            className="leading-[1.1] text-foreground"
            style={{ fontSize: "clamp(1.75rem, 3.2vw, 2.5rem)" }}
          >
            {chapter.name}
          </h3>

          <p className="mt-2 text-lg font-semibold" style={{ color: chapter.accent }}>
            {chapter.title}
            <span className="font-normal text-muted-foreground">{" · " + chapter.kicker}</span>
          </p>

          <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-muted-foreground">
            {chapter.description}
          </p>
        </div>
      </div>

      {/* ── Тафсилот: се сутун дар тамоми паҳно ── */}
      <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
        <Detail label={labels.forWhoLabel}>
          <ul className="space-y-2.5">
            {chapter.forWho.map((line) => (
              <li key={line} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: chapter.accent }}
                />
                {line}
              </li>
            ))}
          </ul>
        </Detail>

        <div className="space-y-6">
          <Detail label={labels.subjectsLabel}>{chapter.subjects.join(", ")}</Detail>
          <Detail label={labels.careersLabel}>{chapter.sampleCareers.join(", ")}</Detail>
        </div>

        <Detail label={labels.workplacesLabel}>{chapter.workplaces.join(", ")}</Detail>
      </div>

      <Link
        to={href}
        className="mt-10 inline-flex min-h-[3.5rem] items-center justify-center gap-3 whitespace-nowrap rounded-xl border-2 px-7 text-lg font-semibold transition-colors duration-200 focus-ring active:translate-y-px"
        style={{ borderColor: chapter.accent, color: chapter.accent }}
      >
        {chapter.careerCount
          ? labels.ctaWithCount.replace("{count}", chapter.careerCount)
          : labels.ctaFallback}
        <ArrowRight className="h-5 w-5" strokeWidth={2} aria-hidden />
      </Link>
    </Reveal>
  );
}

export default function ClusterList() {
  const { journey } = useHomeContent();
  const chapters = useClusterChapters();

  return (
    // scroll-mt: навбари фиксшуда ~76px аст, бе он сарлавҳа зери он мемонад.
    <section id="cluster-groups" className="scroll-mt-24 border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32 lg:px-8">
        <Reveal
          as="h2"
          className="max-w-[22ch] leading-[1.1] text-foreground"
          style={{ fontSize: "clamp(2.125rem, 4.6vw, 3.5rem)" }}
        >
          {journey.title}
        </Reveal>

        <div className="mt-14">
          {chapters.map((chapter, i) => (
            <ClusterRow key={chapter.clusterId} chapter={chapter} index={i} labels={journey} />
          ))}
        </div>
      </div>
    </section>
  );
}
