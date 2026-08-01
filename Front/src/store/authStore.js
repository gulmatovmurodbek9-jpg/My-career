import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";
import { API } from "../lib/config";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: !!user && !!token,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),

      updateUser: (userData) =>
        set((state) => ({
          user: { ...state.user, ...userData },
        })),

      // Re-fetch the user profile with all relations from backend
      refreshProfile: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const { data } = await axios.get(`${API}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          set((state) => ({ user: { ...state.user, ...data } }));
        } catch (err) {
          console.error("Profile refresh failed:", err);
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
