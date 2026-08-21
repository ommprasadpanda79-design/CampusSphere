import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, setAccessToken } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    // The access token stays in memory, limiting exposure to injected scripts. A rotating
    // refresh token lives in an httpOnly cookie, so reloads can restore the session without
    // localStorage. The tradeoff is an extra refresh request on every new browser tab/load.
    api.post("/auth/refresh")
      .then(({ data }) => { if (active) { setAccessToken(data.accessToken); setUser(data.user); } })
      .catch(() => { if (active) { setAccessToken(null); setUser(null); } })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({
    user, ready,
    async login(credentials) {
      const { data } = await api.post("/auth/login", credentials);
      setAccessToken(data.accessToken); setUser(data.user); return data.user;
    },
    async register(details) {
      const { data } = await api.post("/auth/register", details);
      setAccessToken(data.accessToken); setUser(data.user); return data.user;
    },
    async logout() {
      try { await api.post("/auth/logout"); } finally { setAccessToken(null); setUser(null); }
    },
  }), [user, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

