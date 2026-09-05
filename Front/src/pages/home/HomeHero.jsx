import StoryScene from "./StoryScene";
import { HERO_POSTER, HERO_VIDEO } from "../../lib/media";
import { useHomeContent } from "./useHomeContent";

/**
 * Экрани аввали слайдер: савол, шарҳ, ду тугма.
 *
 * Тартиб дар StoryScene аст, то ин экран ва экрани мушкил дақиқан як хел
 * бошанд. Пештар ин ҷо тартиби худро дошт — сарлавҳа болои видео — ва
 * ҳангоми гардиш ҷойи ҳама чиз меҷаҳид.
 */
export default function HomeHero() {
  const { opening } = useHomeContent();

  return (
    <StoryScene
      video={HERO_VIDEO}
      poster={HERO_POSTER}
      videoAlt={opening.imageAlt}
      preload="metadata"
      title={opening.title}
      lead={opening.lead}
      /* Саволи асосии сомона аст, аз ин рӯ каме калонтар аз экрани дуюм. */
      titleSize="clamp(2.25rem, 5.4vw, 4.25rem)"
      ctaPrimary={opening.ctaPrimary}
      ctaSecondary={opening.ctaSecondary}
    />
  );
}
