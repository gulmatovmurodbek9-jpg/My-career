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
 * Гардиш беохир аст: баъди экрани охирин аз аввал сар мешавад.
 *
 * Пештар он ҳангоми дар боло будани муш меистод. Аммо ин бахш қариб тамоми
 * экранро мегирад, аз ин рӯ дар компютер муш ҳамеша дар болои он буд ва
 * гардиш амалан ҳеҷ гоҳ кор намекард. Зер кардани тир низ онро абадӣ мебаст.
 *
 * Он ҳимояҳо аз он сабаб буданд, ки экранҳо тартиби гуногун доштанд ва тугма
 * метавонист аз таги ангушти корбар равад. Ҳоло ҳарду экран як тартиб ва як
 * тугмаҳо дар як ҷой доранд, пас ин хатар нест.
 *
 * Он чи мондааст:
 *   - ҳангоми фокуси клавиатура дар дохили слайдер гардиш МЕИСТАД, то
 *     истифодабарандаи клавиатура аз ҷои худ партофта нашавад;
 *   - бо `prefers-reduced-motion` гардиши худкор тамоман хомӯш мешавад;
 *   - тағйири экран ба хонандаи экран эълон мешавад.
 *
 * Тирҳо ва нуқтаҳо тугмаҳои воқеӣ ҳастанд, аз ин рӯ клавиатура кор мекунад.
 */
export default function SceneSlider({ slides, interval = 20000, label }) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  // Танҳо фокуси клавиатура гардишро мебандад; ҳаракати муш не.
  const [focused, setFocused] = useState(false);
  const total = slides.length;
  const timer = useRef(null);

  const go = useCallback(
    (next) => setIndex(((next % total) + total) % total),
    [total],
  );

  const running = !reduceMotion && !focused && total > 1;

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

  // Гардишро намебандад: танҳо ба экрани дигар мегузарад ва таймер аз нав
  // сар мешавад, чун `index` вобастагии эффект аст.
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
                onClick={() => go(i)}
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
