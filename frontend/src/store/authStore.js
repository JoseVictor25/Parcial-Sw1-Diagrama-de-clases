import { create } from 'zustand';
import api from '../api/axios';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  login: async (email, password) => {
    const res = await api.post('auth/login/', { 
      email: typeof email === 'string' ? email.trim() : email, 
      password 
    });
    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    set({ user: res.data.user, isAuthenticated: true, loading: false });
    return res.data;
  },

  register: async (email, username, password) => {
    const res = await api.post('auth/register/', { 
      email: typeof email === 'string' ? email.trim() : email, 
      username: typeof username === 'string' ? username.trim() : username, 
      password 
    });
    if (res.data?.tokens) {
      localStorage.setItem('access_token', res.data.tokens.access);
      localStorage.setItem('refresh_token', res.data.tokens.refresh);
      set({ user: res.data.user, isAuthenticated: true, loading: false });
    }
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, isAuthenticated: false, loading: false });
  },

  checkAuth: async () => {
    if (!localStorage.getItem('access_token')) {
      set({ loading: false });
      return;
    }
    try {
      const res = await api.get('auth/me/');
      set({ user: res.data, isAuthenticated: true });
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      set({ loading: false });
    }
  }
}));
