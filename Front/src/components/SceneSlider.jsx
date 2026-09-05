import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Ба видеои дохили слайдер мегӯяд, ки такрор нашавад ва охирашро хабар диҳад.
 *
 * Бе ин SceneVideo `loop` дорад ва ҳодисаи `ended` ҳеҷ гоҳ рух намедиҳад.
 */
const SliderContext = createContext(null);

export const useSlider = () => useContext(SliderContext);

/**
 * Экранҳои ҳикояро як-як бо гардиш нишон медиҳад.
 *
 * Слайдери худкор барои хониш хатарнок аст: матн пеш аз он ки хонанда онро
 * тамом кунад, нопадид мешавад, ва ин маҳз ба одамони калонсол ва сустхон
 * мезанад. Аз ин рӯ ин ҷо чанд ҳимоя гузошта шудааст:
 *
 *   - гардиш ҳангоми ламс, ҳаракати муш ё фокуси клавиатура МЕИСТАД, то
 *     тугма зери ангушти корбар аз ҷояш наравад;
 *   - зер кардани тир ё нуқта гардиши худкорро тамоман мебандад;
 *   - бо `prefers-reduced-motion` гардиши худкор тамоман хомӯш мешавад;
 *   - тағйири экран ба хонандаи экран эълон мешавад.
 *
 * Тирҳо ва нуқтаҳо тугмаҳои воқеӣ ҳастанд, аз ин рӯ клавиатура кор мекунад.
 */
export default function SceneSlider({ slides, interval = 20000, label }) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [manual, setManual] = useState(false);
  const total = slides.length;
  const timer = useRef(null);

  const go = useCallback(
    (next) => setIndex(((next % total) + total) % total),
    [total],
  );

  // Гардиш танҳо вақте кор мекунад, ки корбар ба он даст назада бошад.
  const running = !reduceMotion && !paused && !manual && total > 1;

  const next = useCallback(() => go(index + 1), [go, index]);

  /*
   * Таймер ин ҷо заҳира аст, на манбаи асосии суръат.
   *
   * Экран вақте иваз мешавад, ки видеояш тамом шавад — суръат ба худи мазмун
   * вобаста мешавад. Вале видео метавонад тамоман наояд: шабака бурида шавад,
   * браузер пахшро манъ кунад, ё `prefers-reduced-motion` онро ба акс табдил
   * диҳад. Дар он ҳолат слайдер бе ин таймер абадӣ дар як экран мемонад.
   *
   * 20 сония қасдан аз видеоҳо (ҳар кадом 8.0с) хеле дарозтар аст: он набояд
   * видеои сустборшавандаро бурад, балки танҳо вақте кор кунад, ки видео
   * тамоман наомадааст.
   */
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

  const step = (delta) => {
    setManual(true);
    go(index + delta);
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      className="relative border-b border-border bg-background"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={() => setManual(true)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          initial={reduceMotion ? false : { opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -40 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          aria-roledescription="slide"
          aria-label={`${index + 1} аз ${total}`}
        >
          <SliderContext.Provider value={context}>{slides[index]}</SliderContext.Provider>
        </motion.div>
      </AnimatePresence>

      {total > 1 && (
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 pb-10 lg:px-8">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Экрани пешина"
            className="focus-ring inline-flex h-12 w-12 items-center justify-center rounded-xl border-2 border-border text-foreground transition-colors hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Экрани навбатӣ"
            className="focus-ring inline-flex h-12 w-12 items-center justify-center rounded-xl border-2 border-border text-foreground transition-colors hover:bg-muted"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>

          <div className="mx-2 flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setManual(true); go(i); }}
                aria-label={`Экрани ${i + 1}`}
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
        Экрани {index + 1} аз {total}
      </p>
    </section>
  );
}
