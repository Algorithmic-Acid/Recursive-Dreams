import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      login: (user: User, token: string) => {
        set({ user, token });
      },

      logout: () => {
        set({ user: null, token: null });
      },

      isAuthenticated: () => {
        return get().token !== null;
      },

      isAdmin: () => {
        return get().user?.role === 'admin';
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
