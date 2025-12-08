import { create } from 'zustand';
import { authApi, getToken, setToken, removeToken } from '../Services/api';

const useAuthStore = create((set) => ({
  user: null,
  token: getToken(),
  isAuthenticated: !!getToken(),
  loading: false,
  error: null,

  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const response = await authApi.login(credentials);
      setToken(response.token);
      set({ 
        user: response.user, 
        token: response.token, 
        isAuthenticated: true, 
        loading: false 
      });
      return response;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  logout: () => {
    removeToken();
    set({ user: null, token: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
