import hero1 from "../images/optimized/hero-1.webp";
import hero1Sm from "../images/optimized/hero-1@sm.webp";
import hero2 from "../images/optimized/hero-2.webp";
import hero2Sm from "../images/optimized/hero-2@sm.webp";
import hero3 from "../images/optimized/hero-3.webp";
import hero3Sm from "../images/optimized/hero-3@sm.webp";
import hero4 from "../images/optimized/hero-4.webp";
import hero4Sm from "../images/optimized/hero-4@sm.webp";
import heroGroup from "../images/optimized/hero-group.webp";
import aiAvatar from "../images/optimized/ai-avatar.webp";

import cluster1 from "../images/optimized/cluster-1.webp";
import cluster1Sm from "../images/optimized/cluster-1@sm.webp";
import cluster2 from "../images/optimized/cluster-2.webp";
import cluster2Sm from "../images/optimized/cluster-2@sm.webp";
import cluster3 from "../images/optimized/cluster-3.webp";
import cluster3Sm from "../images/optimized/cluster-3@sm.webp";
import cluster4 from "../images/optimized/cluster-4.webp";
import cluster4Sm from "../images/optimized/cluster-4@sm.webp";
import cluster5 from "../images/optimized/cluster-5.webp";
import cluster5Sm from "../images/optimized/cluster-5@sm.webp";

const responsive = (full, small, sizes = "(max-width: 900px) 100vw, 50vw") => ({
  src: full,
  srcSet: `${small} 900w, ${full} 1600w`,
  sizes,
});

export const HERO_IMAGES = [
  responsive(hero1, hero1Sm),
  responsive(hero2, hero2Sm),
  responsive(hero3, hero3Sm),
  responsive(hero4, hero4Sm),
];

export const HERO_GROUP = heroGroup;
export const AI_AVATAR = aiAvatar;

export const CLUSTER_IMAGES = {
  1: responsive(cluster1, cluster1Sm, "(max-width: 1024px) 100vw, 22rem"),
  2: responsive(cluster2, cluster2Sm, "(max-width: 1024px) 100vw, 22rem"),
  3: responsive(cluster3, cluster3Sm, "(max-width: 1024px) 100vw, 22rem"),
  4: responsive(cluster4, cluster4Sm, "(max-width: 1024px) 100vw, 22rem"),
  5: responsive(cluster5, cluster5Sm, "(max-width: 1024px) 100vw, 22rem"),
};

export const HERO_VIDEO = "/hero.mp4";
export const HERO_POSTER = "/hero-poster.webp";
export const CHOICES_VIDEO = "/choices.mp4";
export const CHOICES_POSTER = "/choices-poster.webp";
export const CLOSING_VIDEO = "/closing.mp4";
export const CLOSING_POSTER = "/closing-poster.webp";
