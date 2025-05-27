import { useAuth } from '../contexts/AuthContext';

/**
 * Custom hook to access user authentication state
 * Provides a cleaner interface for components to access user data
 */
export function useUser() {
  const { user, login, logout, getAuthToken } = useAuth();
  
  return {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    getAuthToken,
  };
} 