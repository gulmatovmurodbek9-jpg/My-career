import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, setAuthToken } from "../api/client";

const STORAGE_KEY = "my_career_auth";
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          setUser(saved.user || null);
          setToken(saved.token || null);
          setAuthToken(saved.token || null);
        }
      } finally {
        setBooting(false);
      }
    };
    restore();
  }, []);

  const persist = async (nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
    setAuthToken(nextToken);
    if (nextUser && nextToken) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ user: nextUser, token: nextToken }));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  };

  const login = async (email, password) => {
    const data = await api("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    await persist(data.user, data.access_token || data.token);
    return data;
  };

  const register = async (payload) => {
    const data = await api("/auth/register", {
      method: "POST",
      body: payload,
    });
    await persist(data.user, data.access_token || data.token);
    return data;
  };

  const loginWithGoogle = async (idToken) => {
    const data = await api("/auth/google", {
      method: "POST",
      body: { idToken },
    });
    await persist(data.user, data.access_token || data.token);
    return data;
  };

  const refreshProfile = async () => {
    if (!token) return null;
    const profile = await api("/users/profile", { token });
    setUser((prev) => ({ ...prev, ...profile }));
    return profile;
  };

  const logout = async () => {
    await persist(null, null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      booting,
      isAuthenticated: !!user && !!token,
      login,
      register,
      loginWithGoogle,
      logout,
      refreshProfile,
      updateUser: (patch) => setUser((prev) => ({ ...prev, ...patch })),
    }),
    [user, token, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
