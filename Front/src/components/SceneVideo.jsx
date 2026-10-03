import React, { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useSlider } from "./SceneSlider";

// Интернети суст ё «сарфаи трафик» (хонандаи деҳа бо 3G) — видео тамоман бор намешавад,
// танҳо расм. Дар ҳолати дигар видео танҳо вақте бор мешавад, ки ба экран наздик шавад.
const slowConnection = () => {
  const connection = typeof navigator !== "undefined" ? navigator.connection : null;
  if (!connection) return false;
  return Boolean(connection.saveData) || /(^|-)(2g|3g)$/.test(String(connection.effectiveType || ""));
};

export default function SceneVideo({
  src,
  poster,
  alt,
  preload = "metadata",
  className = "",
}) {
  const reduceMotion = useReducedMotion();
  const slider = useSlider();
  const holder = useRef(null);
  const [visible, setVisible] = useState(false);
  const lite = reduceMotion || slowConnection();

  useEffect(() => {
    if (lite || visible || !holder.current) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "200px" });
    observer.observe(holder.current);
    return () => observer.disconnect();
  }, [lite, visible]);

  const shape = `h-[240px] w-full rounded-2xl border border-border object-cover sm:h-[340px] lg:h-[440px] ${className}`;

  if (lite || !visible) {
    return <img ref={holder} src={poster} alt={alt} width={1280} height={664} loading="lazy" decoding="async" className={shape} />;
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
