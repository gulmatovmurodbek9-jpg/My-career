import React from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Мазмунро ҳангоми ба назар расидан оромона мебарорад.
 *
 * Ин ҳамон ҳаракатест, ки саҳифа бояд дошта бошад: он назорати скроллро аз
 * корбар намегирад ва тартиби мазмунро иваз намекунад. Ҳикояи скролли pinned,
 * ки қаблан буд, ҳарду корро мекард ва аз ин рӯ бароварда шуд.
 *
 * Танҳо `transform` ва `opacity` анимасия мешаванд, то браузер онҳоро дар
 * compositor иҷро кунад ва скролл дар телефони суст ҳам ҳамвор бимонад.
 *
 * Ҳангоми `prefers-reduced-motion` ҳеҷ ҳаракат нест: мазмун фавран ва пурра
 * намоён мешавад. Ин на «беҳтаркунӣ», балки талаботи дастрасист — барои
 * баъзе корбарон ҳаракат сарчархзанӣ ба вуҷуд меорад.
 *
 * ҲАМАИ props-и боқимонда ба элемент мегузаранд. Ин муҳим аст: нусхаи аввал
 * танҳо `className`-ро мегирифт ва `style`-ро бесадо мепартофт, аз ин рӯ ҳамаи
 * сарлавҳаҳо `fontSize: clamp(...)`-и худро гум карда, ба 16px меафтоданд.
 */
export default function Reveal({ children, delay = 0, as = "div", ...rest }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    const Plain = as;
    return <Plain {...rest}>{children}</Plain>;
  }

  const Component = motion[as] ?? motion.div;

  return (
    <Component
      {...rest}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Component>
  );
}
