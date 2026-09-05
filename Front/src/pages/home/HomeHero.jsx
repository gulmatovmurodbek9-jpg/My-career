import React from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import Reveal from "../../components/Reveal";
import SceneVideo from "../../components/SceneVideo";
import { HERO_POSTER, HERO_VIDEO } from "../../lib/media";
import { useHomeContent } from "./useHomeContent";

/**
 * Экрани аввал: як савол, як ҷумлаи шарҳ, ду тугма ва видео.
 *
 * Ҷойгиршавӣ якқабата аст, на дусутуна. Нусхаи дусутуна видеоро калон мекард,
 * вале ҳамзамон сутуни матнро ба тақрибан 480px мефишурд, ва сарлавҳа ба ЧОР
 * сатр мешикаст. Ҳоло ҳам сарлавҳа, ҳам видео тамоми паҳноро мегиранд, ва ҳеҷ
 * кадом дигареро намефишурад.
 *
 * Видео ЗЕРИ матн меистад, на дар паси он. Матн рӯи акси ҳаракаткунанда ҳатто
 * бо чашми солим душвор хонда мешавад, ва дар нури офтоб қариб нохонданист.
 *
 * Андозаҳо қасдан калонанд. Ҳадди ақали тугма 56px аст, то ламси ноаниқ низ
 * кор кунад.
 */

export default function HomeHero() {
  const { opening } = useHomeContent();

  const ctaBase =
    "inline-flex min-h-[3.5rem] items-center justify-center gap-3 whitespace-nowrap rounded-xl px-8 text-lg font-semibold transition-colors duration-200 focus-ring active:translate-y-px";

  return (
    <section className="bg-background">
      {/* max-w-6xl = 1152px. Видео 1024px паҳноии аслӣ дорад, аз ин рӯ контейнери
          калонтар онро танҳо ноаниқ мекунад. */}
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
        <Reveal
          as="h1"
          className="max-w-[17ch] leading-[1.02] text-foreground"
          style={{ fontSize: "clamp(2.25rem, 5.4vw, 4.25rem)" }}
        >
          {opening.title}
        </Reveal>

        {/* Матн дар чап, тугмаҳо дар рост. Фазои холии байни онҳо сарлавҳаро
            мустаҳкам мекунад ва тугмаҳоро ба сатри чашм мебарорад. */}
        <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <Reveal delay={0.06}>
            <p className="max-w-[46ch] text-xl leading-relaxed text-muted-foreground">
              {opening.lead}
            </p>
          </Reveal>

          <Reveal delay={0.12} className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Link
              to="/quiz"
              className={`${ctaBase} bg-foreground text-background hover:bg-foreground/88`}
            >
              {opening.ctaPrimary}
              <ArrowRight className="h-5 w-5" strokeWidth={2} aria-hidden />
            </Link>

            <Link
              to="/careers"
              className={`${ctaBase} border-2 border-border text-foreground hover:bg-muted`}
            >
              {opening.ctaSecondary}
            </Link>
          </Reveal>
        </div>

        <Reveal delay={0.18} className="mt-14">
          <SceneVideo
            src={HERO_VIDEO}
            poster={HERO_POSTER}
            alt={opening.imageAlt}
            preload="metadata"
          />
        </Reveal>
      </div>
    </section>
  );
}
