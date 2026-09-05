import React from "react";
import { useReducedMotion } from "framer-motion";
import { useSlider } from "./SceneSlider";

/**
 * Видеои ороишии як бахш, ё расми беҳаракат ба ҷои он.
 *
 * Ҳангоми `prefers-reduced-motion` видео умуман бор намешавад — на танҳо
 * ғайрифаъол мешавад. Ин ҳам талаботи дастрасист, ҳам сарфаи садҳо килобайт.
 *
 * Видеоҳо овоз надоранд (ҷараёни аудио ҳангоми фишурдан бароварда шудааст),
 * барои ҳамин `muted` ҳамеша дуруст аст ва браузер иҷозати худкор-пахшро
 * медиҳад. Бе ин, Safari ва Chrome пахшро бекор мекунанд.
 *
 * `poster` ҳатмист: бе он ҷои видео то боркунӣ холӣ мемонад ва саҳифа ҷаҳиш
 * мехӯрад.
 */
export default function SceneVideo({
  src,
  poster,
  alt,
  /** "metadata" барои видеои болоӣ, "none" барои поёнӣ. */
  preload = "metadata",
  className = "",
}) {
  const reduceMotion = useReducedMotion();
  const slider = useSlider();

  // Баландӣ маҳдуд аст, на таносуб. Бо `aspect` видео тамоми паҳноро мегирифт
  // ва дар экрани калон 600px баланд мешуд — саҳифаро мехӯрд. Маҳдуд кардани
  // паҳноӣ ҷои холии яктарафа месохт. Маҳдудияти баландӣ + object-cover ҳарду
  // мушкилро ҳал мекунад: видео тамоми паҳно, вале ором.
  const shape = `h-[240px] w-full rounded-2xl border border-border object-cover sm:h-[340px] lg:h-[440px] ${className}`;

  if (reduceMotion) {
    return <img src={poster} alt={alt} width={1280} height={664} className={shape} />;
  }

  return (
    <video
      src={src}
      poster={poster}
      autoPlay
      muted
      /* Дар слайдер такрор намешавад: охири видео экранро иваз мекунад. */
      loop={!slider}
      onEnded={slider?.onSceneEnded}
      playsInline
      preload={preload}
      /* Видеои фазоӣ аст: маънои саҳифа пурра дар матн ҳаст. */
      aria-hidden="true"
      tabIndex={-1}
      className={shape}
    />
  );
}
