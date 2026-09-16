import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const SliderContext = createContext(null);

export const useSlider = () => useContext(SliderContext);

export default function SceneSlider({ slides, interval = 20000, label }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [focused, setFocused] = useState(false);
  const total = slides.length;
  const timer = useRef(null);

  const go = useCallback(
    (next) => setIndex(((next % total) + total) % total),
    [total],
  );

  const running = !reduceMotion && !focused && total > 1;

  const next = useCallback(() => go(index + 1), [go, index]);

  useEffect(() => {
    if (!running) return undefined;
    timer.current = setTimeout(next, interval);
    return () => clearTimeout(timer.current);
  }, [running, next, interval]);

  const sceneEnded = useCallback(() => {
    if (running) next();
  }, [running, next]);

  const context = useMemo(() => ({ onSceneEnded: sceneEnded }), [sceneEnded]);

  if (total === 0) return null;

  const step = (delta) => go(index + delta);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      className="relative border-b border-border bg-background"
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={() => setFocused(false)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          initial={reduceMotion ? false : { opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -40 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          aria-roledescription="slide"
          aria-label={t("misc.slide_of", { index: index + 1, total })}
        >
          <SliderContext.Provider value={context}>{slides[index]}</SliderContext.Provider>
        </motion.div>
      </AnimatePresence>

      {total > 1 && (
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 pb-10 lg:px-8">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label={t("misc.slide_prev")}
            className="focus-ring inline-flex h-12 w-12 items-center justify-center rounded-xl border-2 border-border text-foreground transition-colors hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label={t("misc.slide_next")}
            className="focus-ring inline-flex h-12 w-12 items-center justify-center rounded-xl border-2 border-border text-foreground transition-colors hover:bg-muted"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>

          <div className="mx-2 flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={t("misc.slide_go", { index: i + 1 })}
                aria-current={i === index}
                className={`focus-ring h-3 rounded-full transition-all ${
                  i === index ? "w-8 bg-foreground" : "w-3 bg-border hover:bg-foreground/40"
                }`}
              />
            ))}
          </div>

        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {t("misc.slide_go", { index: index + 1 })} / {total}
      </p>
    </section>
  );
}
