import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthTokens, AuthContextType } from '../types';
import { apiService } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!tokens;

  // Load tokens from localStorage on app start
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedTokens = localStorage.getItem('auth_tokens');
        const storedUser = localStorage.getItem('auth_user');
        
        if (storedTokens && storedUser) {
          const parsedTokens = JSON.parse(storedTokens);
          const parsedUser = JSON.parse(storedUser);
          
          // Check if tokens are still valid
          const now = Date.now() / 1000;
          const tokenExpiry = parsedTokens.expires_in;
          
          if (tokenExpiry > now) {
            setTokens(parsedTokens);
            setUser(parsedUser);
          } else {
            // Try to refresh tokens
            try {
              const refreshed = await apiService.refreshToken(parsedTokens.refresh_token);
              setTokens(refreshed.tokens);
              setUser(parsedUser);
              
              // Update localStorage
              localStorage.setItem('auth_tokens', JSON.stringify(refreshed.tokens));
            } catch (error) {
              // Refresh failed, clear stored data
              localStorage.removeItem('auth_tokens');
              localStorage.removeItem('auth_user');
            }
          }
        }
      } catch (error) {
        console.error('Failed to load stored authentication:', error);
        localStorage.removeItem('auth_tokens');
        localStorage.removeItem('auth_user');
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { user: userData, tokens: tokenData } = await apiService.login(email, password);
      
      // Add expiry timestamp
      const tokensWithExpiry = {
        ...tokenData,
        expires_in: Date.now() / 1000 + tokenData.expires_in,
      };
      
      setUser(userData);
      setTokens(tokensWithExpiry);
      
      // Store in localStorage
      localStorage.setItem('auth_tokens', JSON.stringify(tokensWithExpiry));
      localStorage.setItem('auth_user', JSON.stringify(userData));
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      throw error; // Propagate the error instead of returning false
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { user: userData, tokens: tokenData } = await apiService.register(
        email, 
        password, 
        firstName, 
        lastName
      );
      
      // Add expiry timestamp
      const tokensWithExpiry = {
        ...tokenData,
        expires_in: Date.now() / 1000 + tokenData.expires_in,
      };
      
      setUser(userData);
      setTokens(tokensWithExpiry);
      
      // Store in localStorage
      localStorage.setItem('auth_tokens', JSON.stringify(tokensWithExpiry));
      localStorage.setItem('auth_user', JSON.stringify(userData));
      
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error; // Propagate the error instead of returning false
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('auth_user');
  };

  const refreshTokens = async (): Promise<boolean> => {
    if (!tokens?.refresh_token) {
      return false;
    }

    try {
      const { tokens: newTokens } = await apiService.refreshToken(tokens.refresh_token);
      
      // Add expiry timestamp
      const tokensWithExpiry = {
        ...newTokens,
        expires_in: Date.now() / 1000 + newTokens.expires_in,
      };
      
      setTokens(tokensWithExpiry);
      localStorage.setItem('auth_tokens', JSON.stringify(tokensWithExpiry));
      
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    tokens,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshTokens,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};