import axios from "axios";
import { API } from "./config";

// Ихтисосҳои як самти ММТ (c1..c5) аз база: /clusters (рақам → id) ва /careers?clusterId=.
let clustersPromise = null;
export async function clusterCareers(key, lang, limit = 5) {
    if (!key) return [];
    clustersPromise ??= axios.get(`${API}/clusters`).then(({ data }) => data.data || data).catch(() => { clustersPromise = null; return []; });
    const list = await clustersPromise;
    const found = list.find((c) => Number(c.clusterId) === Number(String(key).slice(1)));
    if (!found) return [];
    const { data } = await axios.get(`${API}/careers`, { params: { clusterId: found.id, limit, lang } });
    return data.data || [];
}
