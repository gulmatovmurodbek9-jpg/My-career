// Суроғаи API аз .env гирифта мешавад; вагарна backend-и маҳаллӣ.
export const API = import.meta.env.VITE_API_URL || "http://localhost:3005/api";

export const REQUEST_TIMEOUT_MS = 20000;

export const AI_TIMEOUT_MS = 90000;

export const isTimeout = (err) =>
    err?.code === "ECONNABORTED" || err?.code === "ETIMEDOUT";
