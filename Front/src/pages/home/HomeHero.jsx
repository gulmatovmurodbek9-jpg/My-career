import StoryScene from "./StoryScene";
import { HERO_POSTER, HERO_VIDEO } from "../../lib/media";
import { useHomeContent } from "./useHomeContent";

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
      titleSize="clamp(2.25rem, 5.4vw, 4.25rem)"
      ctaPrimary={opening.ctaPrimary}
      ctaSecondary={opening.ctaSecondary}
    />
  );
}
