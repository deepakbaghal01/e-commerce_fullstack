import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

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

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleRegistrationError = (error, fallback) => ({
    success: false,
    message: error.response?.data?.message || fallback
  });

  // Registration may complete immediately when phone verification is disabled.
  const register = async (name, email, password, phone) => {
    try {
      const response = await api.post('/auth/register', { name, email, password, phone });
      if (response.data.token && response.data.user) {
        completeVerification(response.data);
        return { success: true, requiresVerification: false };
      }
      return { success: true, requiresVerification: true, challenge: response.data };
    } catch (error) {
      return handleRegistrationError(error, 'Registration failed.');
    }
  };

  const registerSeller = async (sellerDetails) => {
    try {
      const response = await api.post('/auth/register-seller', sellerDetails);
      if (response.data.token && response.data.user) {
        completeVerification(response.data);
        return { success: true, requiresVerification: false };
      }
      return { success: true, requiresVerification: true, challenge: response.data };
    } catch (error) {
      return handleRegistrationError(error, 'Seller registration failed.');
    }
  };

  const completeVerification = ({ token, user: verifiedUser }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(verifiedUser));
    setUser(verifiedUser);
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      completeVerification(response.data);
      return { success: true };
    } catch (error) {
      return handleRegistrationError(error, 'Login failed.');
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    registerSeller,
    completeVerification,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isSeller: user?.role === 'seller',
    isBuyer: user?.role === 'buyer'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
