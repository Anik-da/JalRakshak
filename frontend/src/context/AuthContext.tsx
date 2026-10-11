import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSession } from '../types';
import {
  getStoredSession,
  cognitoSignIn,
  cognitoSignUp,
  cognitoSignOut,
  loginAsDemo,
  signInWithGoogleCognito,
} from '../services/cognitoAuth';

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<UserSession>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  loginGoogle: () => { redirecting: boolean; session?: UserSession };
  handleOAuthCallback: (code: string) => Promise<UserSession>;
  loginDemo: (role: 'CITIZEN' | 'ADMIN') => UserSession;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<UserSession | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    const existing = getStoredSession();
    if (existing) {
      setUser(existing);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    const session = await cognitoSignIn(email, pass);
    setUser(session);
    return session;
  };

  const register = async (email: string, pass: string, name: string) => {
    await cognitoSignUp(email, pass, name);
    const session = getStoredSession();
    if (session) setUser(session);
  };

  const loginDemo = (role: 'CITIZEN' | 'ADMIN') => {
    const session = loginAsDemo(role);
    setUser(session);
    return session;
  };

  const loginGoogle = () => {
    const res = signInWithGoogleCognito();
    if (res.session) {
      setUser(res.session);
    }
    return res;
  };

  const handleOAuthCallback = async (code: string) => {
    const { handleCognitoOAuthCallback } = await import('../services/cognitoAuth');
    const session = await handleCognitoOAuthCallback(code);
    setUser(session);
    return session;
  };

  const logout = () => {
    cognitoSignOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        login,
        register,
        loginGoogle,
        handleOAuthCallback,
        loginDemo,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
