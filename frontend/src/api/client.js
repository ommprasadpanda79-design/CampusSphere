import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "/api";
let accessToken = null;
let refreshPromise = null;

export const api = axios.create({ baseURL, withCredentials: true });
export const setAccessToken = (token) => { accessToken = token; };

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const isAuthEndpoint = request?.url?.includes("/auth/login") || request?.url?.includes("/auth/refresh");
    if (error.response?.status !== 401 || request?._retried || isAuthEndpoint) return Promise.reject(error);
    request._retried = true;
    refreshPromise ??= axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
      .then(({ data }) => { setAccessToken(data.accessToken); return data; })
      .finally(() => { refreshPromise = null; });
    await refreshPromise;
    request.headers.Authorization = `Bearer ${accessToken}`;
    return api(request);
  },
);

