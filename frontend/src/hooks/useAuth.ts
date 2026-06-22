import { useState, useEffect } from 'react';
import { AuthState } from '../types';

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    token: localStorage.getItem('token'),
    username: localStorage.getItem('username'),
    role: localStorage.getItem('role'),
    isAuthenticated: !!localStorage.getItem('token'),
  });

  const login = (token: string, username: string, role: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    localStorage.setItem('role', role);
    setAuth({ token, username, role, isAuthenticated: true });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    setAuth({ token: null, username: null, role: null, isAuthenticated: false });
  };

  const isAdmin = () => auth.role === 'admin';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuth({
        token,
        username: localStorage.getItem('username'),
        role: localStorage.getItem('role'),
        isAuthenticated: true,
      });
    }
  }, []);

  return { auth, login, logout, isAdmin };
}
