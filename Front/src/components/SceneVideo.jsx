import React from "react";
import { useReducedMotion } from "framer-motion";
import { useSlider } from "./SceneSlider";

export default function SceneVideo({
  src,
  poster,
  alt,
  preload = "metadata",
  className = "",
}) {
  const reduceMotion = useReducedMotion();
  const slider = useSlider();

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
      loop={!slider}
      onEnded={slider?.onSceneEnded}
      playsInline
      preload={preload}
      aria-hidden="true"
      tabIndex={-1}
      className={shape}
    />
  );
}
