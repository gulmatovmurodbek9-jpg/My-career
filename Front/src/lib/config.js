export const API = import.meta.env.VITE_API_URL || "http://localhost:3005/api";

/* Дархостҳои оддии API: 20 сония бештар аз кофист. */
export const REQUEST_TIMEOUT_MS = 20000;

/* Даъватҳои AI: генератсия то якчанд даҳ сония давом карда метавонад. */
export const AI_TIMEOUT_MS = 90000;

/**
 * Оё дархост аз рӯи timeout афтод?
 *
 * Дар ин ҳолат `err.response` нест, аз ин рӯ коди муқаррарии
 * `err.response?.data?.message` чизе намедиҳад ва корбар паёми номафҳум
 * мебинад. Ин ҷо онро ҷудо мекунем, то паёми аниқ нишон дода шавад.
 */
export const isTimeout = (err) =>
    err?.code === "ECONNABORTED" || err?.code === "ETIMEDOUT";
