import React from "react";
import { motion, useReducedMotion } from "framer-motion";

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
