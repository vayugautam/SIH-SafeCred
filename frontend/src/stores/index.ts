import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  roles: string[];
  user: any | null;
  setAuth: (token: string, roles: string[], user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  token: null,
  roles: [],
  user: null,
  setAuth: (token, roles, user) => {
    localStorage.setItem('safecred_token', token);
    set({ isAuthenticated: true, token, roles, user });
  },
  logout: () => {
    localStorage.removeItem('safecred_token');
    set({ isAuthenticated: false, token: null, roles: [], user: null });
  },
}));

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
