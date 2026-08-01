import { API_URL } from "../config";

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

const buildUrl = (path, params) => {
  const url = new URL(`${API_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
};

export async function api(path, options = {}) {
  const { params, body, token = authToken, headers, ...rest } = options;
  const response = await fetch(buildUrl(path, params), {
    ...rest,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message || `Request failed: ${response.status}`;
    const error = new Error(Array.isArray(message) ? message.join(", ") : message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
