import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useMutation, useQuery, useApolloClient } from '@apollo/client/react';
import { LOGIN_USER, REGISTER_USER, GET_CURRENT_USER, GOOGLE_OAUTH_LOGIN, GET_USER_PROFILE } from './graphql-operations';

// Helper to safely access localStorage (not available during SSR)
const isClient = typeof window !== 'undefined';

const getToken = (): string | null => {
  if (!isClient) return null;
  return localStorage.getItem('authToken');
};

const setToken = (token: string): void => {
  if (isClient) {
    localStorage.setItem('authToken', token);
  }
};

const removeToken = (): void => {
  if (isClient) {
    localStorage.removeItem('authToken');
  }
};

interface User {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  phoneNumber?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  preferredDiscipline?: string;
  website?: string;
  socialLinks?: Record<string, string>;
  notificationPreferences?: Record<string, boolean>;
  isOauthUser?: boolean;
  provider?: string;
  role?: string;
  isAdmin?: boolean;
  buildsCount?: number;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; errors: string[] }>;
  loginWithGoogle: (idToken: string) => Promise<{ success: boolean; errors: string[] }>;
  register: (data: RegisterData) => Promise<{ success: boolean; errors: string[] }>;
  logout: () => void;
  refetchUser: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

interface AuthMutationResult {
  token?: string;
  user?: User;
  errors?: string[];
}

interface LoginMutationData { loginUser: AuthMutationResult; }
interface GoogleOauthMutationData { googleOauthLogin: AuthMutationResult; }
interface RegisterMutationData { registerUser: AuthMutationResult; }
interface CurrentUserQueryData { currentUser: User | null; }

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
  const [hasToken, setHasToken] = useState(false);
  const client = useApolloClient();

  const [loginMutation] = useMutation<LoginMutationData>(LOGIN_USER);
  const [registerMutation] = useMutation<RegisterMutationData>(REGISTER_USER);
  const [googleOauthLoginMutation] = useMutation<GoogleOauthMutationData>(GOOGLE_OAUTH_LOGIN);

  // Check for token on client side only
  useEffect(() => {
    const token = getToken();
    setHasToken(!!token);
    if (!token) {
      setIsLoading(false);
    }
  }, []);

  // Check for existing token on mount
  const { data: currentUserData, loading: currentUserLoading, error: currentUserError } = useQuery<CurrentUserQueryData>(GET_CURRENT_USER, {
    skip: !hasToken,
  });

  // Token is invalid if query errors — clear it
  useEffect(() => {
    if (currentUserError) {
      removeToken();
      setUser(null);
      setIsLoading(false);
    }
  }, [currentUserError]);

  useEffect(() => {
    if (hasToken && !currentUserLoading) {
      if (currentUserData?.currentUser) {
        setUser(currentUserData.currentUser as User);
      }
      setIsLoading(false);
    }
  }, [currentUserData, currentUserLoading, hasToken]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await loginMutation({
        variables: { email, password },
      });

      if (data?.loginUser?.token && data?.loginUser?.user) {
        setToken(data.loginUser.token);
        setUser(data.loginUser.user);
        setHasToken(true);
        // Reset Apollo cache to refetch queries with new auth
        await client.resetStore();
        return { success: true, errors: [] };
      }

      return { success: false, errors: data?.loginUser?.errors || ['Login failed'] };
    } catch (error) {
      return { success: false, errors: [(error as Error).message] };
    }
  }, [loginMutation, client]);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    try {
      const { data } = await googleOauthLoginMutation({
        variables: { accessToken: idToken },
      });

      if (data?.googleOauthLogin?.token && data?.googleOauthLogin?.user) {
        setToken(data.googleOauthLogin.token);
        setUser(data.googleOauthLogin.user);
        setHasToken(true);
        await client.resetStore();
        return { success: true, errors: [] };
      }

      return { success: false, errors: data?.googleOauthLogin?.errors || ['Google login failed'] };
    } catch (error) {
      return { success: false, errors: [(error as Error).message] };
    }
  }, [googleOauthLoginMutation, client]);

  const register = useCallback(async (data: RegisterData) => {
    try {
      const { data: responseData } = await registerMutation({
        variables: data,
      });

      if (responseData?.registerUser?.token && responseData?.registerUser?.user) {
        setToken(responseData.registerUser.token);
        setUser(responseData.registerUser.user);
        setHasToken(true);
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
    removeToken();
    setUser(null);
    setHasToken(false);
    // Clear Apollo cache
    client.clearStore();
  }, [client]);

  const refetchUser = useCallback(async () => {
    try {
      const { data } = await client.query<CurrentUserQueryData>({
        query: GET_USER_PROFILE,
        fetchPolicy: 'network-only',
      });
      if (data?.currentUser) {
        setUser(data.currentUser);
      }
    } catch (error) {
      console.error('Failed to refetch user:', error);
    }
  }, [client]);

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        refetchUser,
        updateUser,
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
