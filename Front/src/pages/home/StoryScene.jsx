import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import Reveal from "../../components/Reveal";
import SceneVideo from "../../components/SceneVideo";

/**
 * Як экрани муқаддима: видео, сарлавҳа, шарҳ, ду тугма.
 *
 * Ҳарду экрани слайдер ҳамин компонентро истифода мебаранд, то тартибашон
 * дақиқан як хел бошад. Пештар онҳо ду тартиби гуногун доштанд — дар яке
 * матн болои видео, дар дигаре зери он — ва ҳангоми гардиш саҳифа меҷаҳид.
 *
 * Видео ДАР БОЛО, матн ЗЕРИ он. Матн ҳеҷ гоҳ рӯи видео гузошта намешавад:
 * хондани матн рӯи акси ҳаракаткунанда душвор аст, ва дар нури офтоб қариб
 * ғайриимкон.
 *
 * Ҳадди ақали баландии тугма 56px аст, то ламси ноаниқ низ кор кунад.
 */
export default function StoryScene({
  video,
  poster,
  videoAlt,
  preload = "metadata",
  title,
  lead,
  titleSize,
  ctaPrimary,
  ctaSecondary,
}) {
  const ctaBase =
    "inline-flex min-h-[3.5rem] items-center justify-center gap-3 whitespace-nowrap rounded-xl px-8 text-lg font-semibold transition-colors duration-200 focus-ring active:translate-y-px";

  return (
    <section className="bg-background">
      {/* max-w-6xl = 1152px. Видео 1024px паҳноии аслӣ дорад, аз ин рӯ
          контейнери калонтар онро танҳо ноаниқ мекунад. */}
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:px-8">
        <Reveal>
          <SceneVideo src={video} poster={poster} alt={videoAlt} preload={preload} />
        </Reveal>

        <Reveal
          as="h2"
          delay={0.06}
          className="mt-12 max-w-[20ch] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground"
          style={{ fontSize: titleSize ?? "clamp(2.125rem, 4.6vw, 3.5rem)" }}
        >
          {title}
        </Reveal>

        <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <Reveal delay={0.12}>
            <p className="max-w-[52ch] text-xl leading-relaxed text-muted-foreground">
              {lead}
            </p>
          </Reveal>

          <Reveal delay={0.18} className="flex flex-col gap-3 sm:flex-row">
            <Link to="/quiz" className={`${ctaBase} bg-foreground text-background hover:bg-foreground/88`}>
              {ctaPrimary}
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
            <Link
              to="/careers"
              className={`${ctaBase} border-2 border-border text-foreground hover:bg-muted`}
            >
              {ctaSecondary}
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
