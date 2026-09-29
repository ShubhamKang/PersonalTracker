import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, MeResponse } from '../api/client';
import { clearToken, getToken, saveToken } from '../lib/token-storage';
import { registerForPushNotifications } from '../lib/push';

interface AuthContextValue {
  loading: boolean;
  user: MeResponse | null;
  signup: (email: string, password: string, timezone?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<MeResponse | null>(null);

  const loadUser = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const me = await api.me();
      setUser(me);
    } catch {
      await clearToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await loadUser();
      setLoading(false);
    })();
  }, [loadUser]);

  const afterAuth = useCallback(async (accessToken: string) => {
    await saveToken(accessToken);
    const me = await api.me();
    setUser(me);
    // Register for push in the background; don't block the UI.
    void registerForPushNotifications();
  }, []);

  const signup = useCallback(
    async (email: string, password: string, timezone?: string) => {
      const res = await api.signup(email, password, timezone);
      await afterAuth(res.accessToken);
    },
    [afterAuth],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.login(email, password);
      await afterAuth(res.accessToken);
    },
    [afterAuth],
  );

  const logout = useCallback(async () => {
    await clearToken();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  const value = useMemo(
    () => ({ loading, user, signup, login, logout, refreshUser }),
    [loading, user, signup, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
