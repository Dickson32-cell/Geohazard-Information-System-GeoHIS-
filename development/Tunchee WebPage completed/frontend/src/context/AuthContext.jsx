import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Configure axios defaults
  axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

  // Set auth header if token exists
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get('/api/v1/auth/profile');
          setUser(response.data.data.user);
        } catch {
          // Token is invalid, remove it
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/v1/auth/login', { email, password });

      if (response.data.success) {
        const { token: newToken, refresh_token: newRefreshToken, user: userData } = response.data.data;
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete axios.defaults.headers.common['Authorization'];
  };

  // Axios interceptor to handle token refresh
  useEffect(() => {
    const refreshTokenFn = async () => {
      try {
        const refreshTokenValue = localStorage.getItem('refreshToken');
        if (!refreshTokenValue) return false;

        const response = await axios.post('/api/v1/auth/refresh', { refresh_token: refreshTokenValue });

        if (response.data.success) {
          const { token: newToken } = response.data.data;
          setToken(newToken);
          localStorage.setItem('token', newToken);
          return true;
        }
      } catch {
        logout();
        return false;
      }
    };

    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const refreshed = await refreshTokenFn();
          if (refreshed) {
            return axios(originalRequest);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};