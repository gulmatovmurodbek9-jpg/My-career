import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import axios from "axios";
import { ArrowRight } from "lucide-react";

import HomeHero from "./HomeHero";
import ClusterList from "./ClusterList";
import SpecialtyCard from "../../components/jobCard";
import { API } from "../../lib/config";
import Reveal from "../../components/Reveal";
import SceneVideo from "../../components/SceneVideo";
import { CHOICES_POSTER, CHOICES_VIDEO, CLOSING_POSTER, CLOSING_VIDEO } from "../../lib/media";
import { useHomeContent } from "./useHomeContent";

/**
 * Сафҳаи асосӣ.
 *
 *   Савол  →  Аз куҷо оғоз кунед  →  Панҷ гурӯҳи касбҳо
 *          →  Намунаи ихтисосҳо  →  Даъват ба тест
 *
 * Тарҳ ба осонии истифода тобеъ аст, на ба таассурот. Ҳамаи мазмун дар
 * ҷараёни оддии ҳуҷҷат аст: ҳеҷ pinned scroll, ҳеҷ parallax, ҳеҷ матн рӯи акс.
 * Матн калон, сарҳадҳо ғафс, тугмаҳо на камтар аз 56px.
 *
 * Саҳифа токенҳои мавзӯъро истифода мебарад, аз ин рӯ дар ҳарду тема кор
 * мекунад ва ҳангоми гузаштан ба саҳифаҳои дигар ранг намепарад.
 *
 * Тамоми матн аз ./content.js меояд (ҳар се забон дар як ҷо).
 */

/**
 * Мушкил: дар байни садҳо касб гум шудан.
 *
 * Ин бахш байни савол ва роҳи ҳал меистад ва вазифаи ягона дорад: корбар бояд
 * худро дар он бишиносад. Видео маҳз ҳамин ҳисро нишон медиҳад — одам дар
 * миёни аломатҳои даҳҳо касб.
 *
 * Ҷойгиршавӣ баръакси экрани аввал аст (аввал видео, баъд матн), то ду бахши
 * пай дар пай як шакл надошта бошанд.
 */
function OverwhelmScene() {
  const { overwhelm } = useHomeContent();

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32 lg:px-8">
        <Reveal>
          <SceneVideo
            src={CHOICES_VIDEO}
            poster={CHOICES_POSTER}
            alt={overwhelm.videoAlt}
            preload="none"
          />
        </Reveal>

        <Reveal
          as="h2"
          delay={0.06}
          className="mt-12 max-w-[20ch] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground"
          style={{ fontSize: "clamp(2.125rem, 4.6vw, 3.5rem)" }}
        >
          {overwhelm.title}
        </Reveal>

        <Reveal delay={0.12}>
          <p className="mt-6 max-w-[58ch] text-xl leading-relaxed text-muted-foreground">
            {overwhelm.lead}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/**
 * Се дари вуруд.
 *
 * Ҷойгиршавӣ қасдан нобаробар аст: тест кори асосист, аз ин рӯ дари он васеътар
 * аст. Се корти якхела ҳамаро баробар нишон медоданд ва интихобро душвор.
 */
function EntryDoors() {
  const { doors } = useHomeContent();
  const [primary, ...rest] = doors.items;

  const doorClass =
    "group flex h-full flex-col rounded-2xl border-2 border-border bg-card p-7 transition-colors duration-200 hover:border-foreground/35 hover:bg-muted focus-ring";

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32 lg:px-8">
        <Reveal as="h2"
          className="font-semibold leading-[1.1] tracking-[-0.02em] text-foreground"
          style={{ fontSize: "clamp(2.125rem, 4.6vw, 3.5rem)" }}
        >
          {doors.title}
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <Link to={primary.to} className={doorClass + " lg:row-span-2"}>
            <h3 className="text-2xl font-semibold text-foreground sm:text-3xl">
              {primary.label}
            </h3>
            <p className="mt-4 max-w-[36ch] text-lg leading-relaxed text-muted-foreground">
              {primary.body}
            </p>
            <span className="mt-auto inline-flex items-center gap-2.5 pt-8 text-lg font-bold text-foreground">
              {primary.cta}
              <ArrowRight
                className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1"
                strokeWidth={2}
                aria-hidden
              />
            </span>
          </Link>

          {rest.map((door) => (
            <Link key={door.to} to={door.to} className={doorClass}>
              <h3 className="text-xl font-semibold text-foreground sm:text-2xl">{door.label}</h3>
              <p className="mt-3 max-w-[40ch] text-[1.0625rem] leading-relaxed text-muted-foreground">
                {door.body}
              </p>
              <span className="mt-auto inline-flex items-center gap-2.5 pt-6 text-base font-bold text-foreground">
                {door.cta}
                <ArrowRight
                  className="h-4.5 w-4.5 transition-transform duration-200 group-hover:translate-x-1"
                  strokeWidth={2}
                  aria-hidden
                />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Намунаи ихтисосҳо. Тӯр, на рафи уфуқӣ: скролли паҳлӯӣ душвор идора мешавад. */
function TopCareers() {
  const { topCareers } = useHomeContent();
  const [careers, setCareers] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();
    axios
      .get(API + "/careers", { signal: controller.signal })
      .then(({ data }) => {
        setCareers(Array.isArray(data?.data) ? data.data : []);
        setStatus("ready");
      })
      .catch((error) => {
        // Бекоркунӣ ҳангоми unmount хато нест.
        if (!axios.isCancel(error)) setStatus("error");
      });
    return () => controller.abort();
  }, []);

  const items = careers.slice(0, 4);
  const empty = status === "error" || (status === "ready" && items.length === 0);

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32 lg:px-8">
        <Reveal as="h2"
          className="font-semibold leading-[1.1] tracking-[-0.02em] text-foreground"
          style={{ fontSize: "clamp(2.125rem, 4.6vw, 3.5rem)" }}
        >
          {topCareers.title}
        </Reveal>
        <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-muted-foreground">
          {topCareers.subtitle}
        </p>

        {status === "loading" && (
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-56 rounded-2xl" />
            ))}
          </div>
        )}

        {empty && (
          <p className="mt-12 text-lg text-muted-foreground">{topCareers.unavailable}</p>
        )}

        {status === "ready" && items.length > 0 && (
          <ul className="mt-12 grid gap-5 sm:grid-cols-2">
            {items.map((career) => (
              <li key={career.id ?? career.name}>
                <SpecialtyCard specialty={career} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/** Даъвати анҷомӣ. Як тугма, ҳеҷ чизи иловагӣ. */
function ClosingScene() {
  const { closing } = useHomeContent();

  return (
    <section className="bg-muted/40">
      <div className="mx-auto max-w-4xl px-6 py-24 sm:py-32 lg:px-8">
        {/* Видео пеш аз савол меистад: аввал хонандаро мебинед, баъд савол
            дода мешавад, баъд тугма. preload="none" — ин бахш дар поёни саҳифа
            аст, ва аксари корбарон то он ҷо намерасанд. */}
        <Reveal>
          <SceneVideo
            src={CLOSING_VIDEO}
            poster={CLOSING_POSTER}
            alt={closing.videoAlt}
            preload="none"
          />
        </Reveal>

        <div className="mt-12 text-center">
        <Reveal as="h2"
          className="font-semibold leading-[1.1] tracking-[-0.02em] text-foreground"
          style={{ fontSize: "clamp(2.125rem, 4.6vw, 3.5rem)" }}
        >
          {closing.title}
        </Reveal>

        <p className="mx-auto mt-6 max-w-[48ch] text-lg leading-relaxed text-muted-foreground">
          {closing.lead}
        </p>

        <Link
          to="/quiz"
          className="mt-10 inline-flex min-h-[3.5rem] items-center justify-center whitespace-nowrap gap-3 rounded-xl bg-foreground px-9 text-lg font-bold text-background transition-colors duration-200 hover:bg-foreground/88 focus-ring active:translate-y-px"
        >
          {closing.cta}
          <ArrowRight className="h-5 w-5" strokeWidth={2} aria-hidden />
        </Link>

        <p className="mt-5 text-base text-muted-foreground">{closing.badge}</p>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  useEffect(() => {
    // Агар бо лангар омада бошанд ("/#cluster-groups"), Layout ба ҳамон бахш
    // скролл мекунад — ба боло бурдан онро вайрон мекард.
    if (!window.location.hash) window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <HomeHero />
      <OverwhelmScene />
      <EntryDoors />
      <ClusterList />
      <TopCareers />
      <ClosingScene />
    </>
  );
}
