import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  role: string | null;
  isAuthenticated: boolean;
  login: (token: string, role: string) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      isAuthenticated: false,
      login: (token, role) => set({ token, role, isAuthenticated: true }),
      logout: () => set({ token: null, role: null, isAuthenticated: false }),
    }),
    {
      name: 'safecred-auth-storage',
    }
  )
);

export default useAuthStore;
