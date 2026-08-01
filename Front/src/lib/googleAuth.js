const GOOGLE_SCRIPT_ID = "google-identity-services";

export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export const loadGoogleIdentity = () =>
    new Promise((resolve, reject) => {
        if (!googleClientId) {
            reject(new Error("Google Client ID is not configured"));
            return;
        }

        if (window.google?.accounts?.id) {
            resolve(window.google);
            return;
        }

        const existing = document.getElementById(GOOGLE_SCRIPT_ID);
        if (existing) {
            existing.addEventListener("load", () => resolve(window.google));
            existing.addEventListener("error", reject);
            return;
        }

        const script = document.createElement("script");
        script.id = GOOGLE_SCRIPT_ID;
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(window.google);
        script.onerror = reject;
        document.head.appendChild(script);
    });

export const loginWithGoogleToken = async ({ credential, axios, API, setAuth, navigate, redirectTo = "/dashboard" }) => {
    const { data } = await axios.post(`${API}/auth/google`, { idToken: credential });
    setAuth(data.user, data.access_token);
    navigate(redirectTo);
};
