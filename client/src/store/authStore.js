import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  user: null,
  isAuthenticated: !!localStorage.getItem('token'),

  login: (token, user) => {
    localStorage.setItem('token', token);
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, isAuthenticated: false });
  },

  setUser: (user) => {
    set({ user });
  },

  updateTailorings: (tailoringsUsed, tailoringsLimit) => {
    set((state) => ({
      user: {
        ...state.user,
        tailoringsUsed,
        tailoringsLimit,
      },
    }));
  },
}));
