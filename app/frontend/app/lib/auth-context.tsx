import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useMutation, useQuery, useApolloClient } from '@apollo/client';
import { LOGIN_USER, REGISTER_USER, GET_CURRENT_USER } from './graphql-operations';

interface User {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  phoneNumber?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; errors: string[] }>;
  register: (data: RegisterData) => Promise<{ success: boolean; errors: string[] }>;
  logout: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  passwordConfirmation: string;
  username: string;
  fullName?: string;
  phoneNumber?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const client = useApolloClient();

  const [loginMutation] = useMutation(LOGIN_USER);
  const [registerMutation] = useMutation(REGISTER_USER);

  // Check for existing token on mount
  const { data: currentUserData, loading: currentUserLoading } = useQuery(GET_CURRENT_USER, {
    skip: !localStorage.getItem('authToken'),
    onError: () => {
      // Token is invalid, clear it
      localStorage.removeItem('authToken');
      setUser(null);
    },
  });

  useEffect(() => {
    if (!currentUserLoading) {
      if (currentUserData?.currentUser) {
        setUser(currentUserData.currentUser);
      }
      setIsLoading(false);
    }
  }, [currentUserData, currentUserLoading]);

  // If no token, set loading to false
  useEffect(() => {
    if (!localStorage.getItem('authToken')) {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await loginMutation({
        variables: { email, password },
      });

      if (data?.loginUser?.token && data?.loginUser?.user) {
        localStorage.setItem('authToken', data.loginUser.token);
        setUser(data.loginUser.user);
        // Reset Apollo cache to refetch queries with new auth
        await client.resetStore();
        return { success: true, errors: [] };
      }

      return { success: false, errors: data?.loginUser?.errors || ['Login failed'] };
    } catch (error) {
      return { success: false, errors: [(error as Error).message] };
    }
  }, [loginMutation, client]);

  const register = useCallback(async (data: RegisterData) => {
    try {
      const { data: responseData } = await registerMutation({
        variables: data,
      });

      if (responseData?.registerUser?.token && responseData?.registerUser?.user) {
        localStorage.setItem('authToken', responseData.registerUser.token);
        setUser(responseData.registerUser.user);
        // Reset Apollo cache to refetch queries with new auth
        await client.resetStore();
        return { success: true, errors: [] };
      }

      return { success: false, errors: responseData?.registerUser?.errors || ['Registration failed'] };
    } catch (error) {
      return { success: false, errors: [(error as Error).message] };
    }
  }, [registerMutation, client]);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    setUser(null);
    // Clear Apollo cache
    client.clearStore();
  }, [client]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
