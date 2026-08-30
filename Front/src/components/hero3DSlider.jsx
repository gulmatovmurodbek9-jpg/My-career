import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HERO_IMAGES } from "../lib/media";

// Нусхаҳои webp аз lib/media. Қаблан ин ҷо PNG-ҳои аслии ~8 МБ ҳар яке
// мустақиман import мешуданд — ҳамон чор файл ~32 МБ-и bundle-ро ташкил медод.
const images = HERO_IMAGES;

export default function Hero3DSlider() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % images.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const variants = {
        enter: {
            opacity: 0,
            scale: 0.9,
            x: 50,
            filter: "blur(10px)",
        },
        center: {
            zIndex: 1,
            opacity: 1,
            scale: 1,
            x: 0,
            filter: "blur(0px)",
            transition: {
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.5 },
                scale: { duration: 0.5 },
                filter: { duration: 0.5 },
            },
        },
        exit: {
            zIndex: 0,
            opacity: 0,
            scale: 0.95,
            x: -50,
            filter: "blur(10px)",
            transition: {
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.5 },
                scale: { duration: 0.5 },
                filter: { duration: 0.5 },
            },
        },
    };

    return (
        <div className="relative w-full h-[500px] lg:h-[600px] flex items-center justify-center overflow-hidden perspective-1000">
            <AnimatePresence mode="popLayout">
                <motion.img
                    key={index}
                    src={images[index].src}
                    srcSet={images[index].srcSet}
                    sizes={images[index].sizes}
                    alt={`Hero Slide ${index + 1}`}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="absolute w-full h-full object-cover rounded-2xl shadow-2xl"
                    style={{
                        maxWidth: "90%",
                        maxHeight: "90%",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(e, { offset, velocity }) => {
                        const swipe = offset.x > 50 ? -1 : offset.x < -50 ? 1 : 0;
                        if (swipe !== 0) {
                            setIndex((prev) => (prev + swipe + images.length) % images.length);
                        }
                    }}
                />
            </AnimatePresence>

            {/* Navigation Dots */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                {images.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIndex(i)}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === index
                                ? "bg-white w-8 hover:bg-white/90"
                                : "bg-white/20 hover:bg-white/40"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}

// Lazy loading wrapper
export const LazyHero3DSlider = (props) => (
    <React.Suspense fallback={
        <div className="relative w-full h-[500px] lg:h-[600px] flex items-center justify-center overflow-hidden perspective-1000">
            <div className="glass-card w-full h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Боргузорӣ...</p>
                </div>
            </div>
        </div>
    }>
        <Hero3DSlider {...props} />
    </React.Suspense>
);
