// Хонандаи бе почта дар синф: сервер як бор калид медиҳад (`<id>.<калид>`), он дар браузер
// нигоҳ дошта мешавад ва бо ҳар дархост ба API ҳамчун сарлавҳаи X-Class-Guest меравад —
// то тест ва санҷиши касб ба номи ҳамин хонанда дар саҳифаи омӯзгор намоён шаванд.
const KEY = "class_guest_v1";

export function readGuest() {
    try {
        const data = JSON.parse(localStorage.getItem(KEY));
        return data?.token ? data : null;
    } catch {
        return null;
    }
}

export function saveGuest(guest) {
    try {
        const old = readGuest();
        localStorage.setItem(KEY, JSON.stringify({ ...(old || {}), ...guest }));
    } catch {
        /* хотира баста — хонанда бояд дар ҳамин саҳифа тест гузарад */
    }
}

export function forgetGuest() {
    try {
        localStorage.removeItem(KEY);
    } catch {
        /* холӣ */
    }
}

export const hasGuest = () => Boolean(readGuest());

export function installGuestHeader(axios, apiBase) {
    axios.interceptors.request.use((config) => {
        const guest = readGuest();
        const url = String(config.url || "");
        if (guest?.token && url.startsWith(apiBase)) {
            config.headers = config.headers || {};
            if (typeof config.headers.set === "function") config.headers.set("X-Class-Guest", guest.token);
            else config.headers["X-Class-Guest"] = guest.token;
        }
        return config;
    });
}
