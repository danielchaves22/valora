// frontend/contexts/AuthContext.tsx - VERSÃƒO CORRIGIDA URGENTE
import {
  createContext, useContext, useEffect, useRef, useState, ReactNode,
} from 'react'
import { useRouter } from 'next/router'
import api from '@/lib/api'
import { useTheme } from '@/contexts/ThemeContext'

interface CompanyRole {
  id: number;
  name: string;
  role: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  companies: CompanyRole[];
  mustChangePassword?: boolean;
}

interface Preferences {
  colorScheme?: string;
  data?: any;
  updatedAt?: string;
}

interface AuthContextData {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
  userRole: string | null;
  userId: number | null;
  companyId: number | null;
  userName: string | null;
  companyName: string | null;
  // financial permissions removed
  refreshToken: () => Promise<boolean>;
  mustChangePassword: boolean;
  updateMustChangePassword: (value: boolean) => void;
  changeCompany: (id: number) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// FunÃ§Ã£o auxiliar para configurar cookies de forma segura
function setSecureCookie(name: string, value: string, maxAge?: number) {
  const domain = window.location.hostname;
  const isLocalhost = domain === 'localhost' || domain === '127.0.0.1';
  
  let cookieString = `${name}=${value}; path=/`;
  
  // SÃ³ adicionar domÃ­nio se nÃ£o for localhost
  if (!isLocalhost) {
    cookieString += `; domain=${domain}`;
  }
  
  // Adicionar configuraÃ§Ãµes de seguranÃ§a
  cookieString += `; samesite=strict`;
  
  // SÃ³ usar secure em HTTPS
  if (window.location.protocol === 'https:') {
    cookieString += `; secure`;
  }
  
  // Adicionar expiraÃ§Ã£o se fornecida
  if (maxAge !== undefined) {
    cookieString += `; max-age=${maxAge}`;
  }
  
  document.cookie = cookieString;
}

// FunÃ§Ã£o auxiliar para remover cookies de forma segura
function removeSecureCookie(name: string) {
  const domain = window.location.hostname;
  const isLocalhost = domain === 'localhost' || domain === '127.0.0.1';
  
  // Tentar remover com diferentes configuraÃ§Ãµes para garantir limpeza
  const cookieConfigs = [
    `${name}=; max-age=0; path=/`,
    `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`,
  ];
  
  // SÃ³ adicionar domÃ­nio se nÃ£o for localhost
  if (!isLocalhost) {
    cookieConfigs.push(
      `${name}=; max-age=0; path=/; domain=${domain}`,
      `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`,
      `${name}=; max-age=0; path=/; domain=.${domain}`,
    );
  }
  
  cookieConfigs.forEach(config => {
    document.cookie = config;
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { changeColorMode, colorMode } = useTheme();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(false);
  const serverPrefUpdatedAtRef = useRef<number>(0);

  const COLOR_MODE_KEY = 'valora_color_mode';
  const COLOR_MODE_UPDATED_AT_KEY = 'valora_color_mode_updated_at';

  // Carregar estado inicial
  useEffect(() => {
    initializeAuth();
  }, []);

  async function initializeAuth() {
    setIsLoading(true);
    
    try {
      // APENAS buscar do localStorage - nÃ£o mexer com cookies de outros sites
      const storedToken = localStorage.getItem('valora_token'); // Prefixo especÃ­fico
      const storedMustChange = localStorage.getItem('valora_must_change_password');

      if (storedMustChange) {
        setMustChangePassword(storedMustChange === 'true');
      }

      if (storedToken) {
        const response = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` }
        });

        setToken(storedToken);
        setUser({ ...response.data.user, mustChangePassword: storedMustChange === 'true' });
        syncColorPreference(response.data.preferences || null);

        const storedCompanyId = localStorage.getItem('valora_company_id');
        const initialCompanyId = storedCompanyId
          ? Number(storedCompanyId)
          : response.data.user.companies?.[0]?.id || null;
        setCompanyId(initialCompanyId);
        if (!storedCompanyId && initialCompanyId !== null) {
          localStorage.setItem('valora_company_id', String(initialCompanyId));
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar autenticaÃ§Ã£o:', error);
      // Token invÃ¡lido - limpar APENAS nossos dados
      safeCleanup();
    } finally {
      setIsLoading(false);
    }
  }

  function getLocalColorPreference(): { mode: 'dark' | 'light' | null; updatedAt: number } {
    let mode = localStorage.getItem(COLOR_MODE_KEY);
    if (!mode) {
      const legacy = localStorage.getItem('color-mode');
      if (legacy === 'dark' || legacy === 'light') {
        localStorage.setItem(COLOR_MODE_KEY, legacy);
        mode = legacy;
      }
    }
    const updatedAtRaw = localStorage.getItem(COLOR_MODE_UPDATED_AT_KEY);
    const updatedAt = updatedAtRaw ? Number(updatedAtRaw) : 0;
    if (mode === 'dark' || mode === 'light') {
      if (!updatedAtRaw || Number.isNaN(updatedAt)) {
        const now = Date.now();
        localStorage.setItem(COLOR_MODE_UPDATED_AT_KEY, String(now));
        return { mode, updatedAt: now };
      }
      return { mode, updatedAt };
    }
    return { mode: null, updatedAt: 0 };
  }

  async function updateServerColorScheme(mode: 'dark' | 'light') {
    try {
      await api.put('/preferences/color-scheme', { colorScheme: mode });
    } catch (err) {
      console.error('Erro ao atualizar preferencia de tema:', err);
    }
  }

  async function syncColorPreference(preferences: Preferences | null) {
    if (typeof window === 'undefined') return;
    const local = getLocalColorPreference();
    const serverMode = preferences?.colorScheme === 'dark' || preferences?.colorScheme === 'light'
      ? preferences.colorScheme
      : null;
    const serverUpdatedAt = preferences?.updatedAt ? new Date(preferences.updatedAt).getTime() : 0;

    if (serverUpdatedAt) {
      serverPrefUpdatedAtRef.current = serverUpdatedAt;
    }

    if (serverMode && !local.mode) {
      changeColorMode(serverMode, serverUpdatedAt);
      serverPrefUpdatedAtRef.current = serverUpdatedAt;
      return;
    }

    if (serverMode && local.mode) {
      if (serverUpdatedAt > local.updatedAt) {
        changeColorMode(serverMode, serverUpdatedAt);
        serverPrefUpdatedAtRef.current = serverUpdatedAt;
        return;
      }
      if (local.updatedAt > serverUpdatedAt) {
        await updateServerColorScheme(local.mode);
        serverPrefUpdatedAtRef.current = local.updatedAt;
        return;
      }
      return;
    }

    if (!serverMode && local.mode) {
      await updateServerColorScheme(local.mode);
      serverPrefUpdatedAtRef.current = local.updatedAt;
    }
  }

  async function login(email: string, password: string): Promise<User> {
    console.log('ðŸ” [AUTH] Starting login process...');
    console.log('ðŸ” [AUTH] Email:', email);
    
    try {
      console.log('ðŸ” [AUTH] Making API call to /auth/login');
      const res = await api.post('/auth/login', { 
        email: email.toLowerCase().trim(), 
        password 
      });
      
      const { token: newToken, user: userData, refreshToken: newRefreshToken } = res.data;
      const preferences: Preferences | null = res.data.preferences || null;

      // Armazenar tokens com prefixos especÃ­ficos da aplicaÃ§Ã£o
      localStorage.setItem('valora_token', newToken);
      localStorage.setItem('valora_refresh_token', newRefreshToken);
      
      // Cookie com configuraÃ§Ã£o MUITO especÃ­fica e segura
      setSecureCookie('valora_token', newToken, 60 * 60 * 24 * 7); // 7 dias

      console.log(userData);

      localStorage.setItem('valora_must_change_password', String(userData.mustChangePassword));
      setMustChangePassword(userData.mustChangePassword);

      setToken(newToken);
      setUser(userData);
      syncColorPreference(preferences);
      if (userData.companies && userData.companies.length > 0) {
        const firstCompany = userData.companies[0];
        setCompanyId(firstCompany.id);
        localStorage.setItem('valora_company_id', firstCompany.id.toString());
      }

      return userData;
      
    } catch (error: any) {
      console.error('ðŸ” [AUTH] Login failed:', error);
      console.error('ðŸ” [AUTH] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });
      
      if (error.response?.status === 429) {
        throw new Error('Muitas tentativas de login. Tente novamente em alguns minutos.');
      }
      
      if (error.response?.status === 423) {
        throw new Error('Conta temporariamente bloqueada. Contate o suporte.');
      }
      
      throw new Error(error.response?.data?.error || 'Erro ao fazer login');
    }
  }

  async function refreshToken(): Promise<boolean> {
    try {
      const storedRefreshToken = localStorage.getItem('valora_refresh_token');
      
      if (!storedRefreshToken) {
        return false;
      }

      const response = await api.post('/auth/refresh', {
        refreshToken: storedRefreshToken
      });

      const { token: newToken } = response.data;
      
      localStorage.setItem('valora_token', newToken);
      setSecureCookie('valora_token', newToken, 60 * 60 * 24 * 7); // 7 dias
      
      setToken(newToken);
      
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      safeCleanup();
      return false;
    }
  }

  // FunÃ§Ã£o de limpeza SEGURA - apenas nossos dados
  function safeCleanup() {
    // Limpar APENAS dados da nossa aplicaÃ§Ã£o
    localStorage.removeItem('valora_token');
    localStorage.removeItem('valora_refresh_token');
    localStorage.removeItem('valora_must_change_password');
    localStorage.removeItem('valora_company_id');
    
    // Remover APENAS nosso cookie especÃ­fico
    removeSecureCookie('valora_token');
    
    setToken(null);
    setUser(null);
    setCompanyId(null);
  }

  function logout() {
    safeCleanup();
    
    console.log('User logged out', { timestamp: new Date().toISOString() });
    
    // Redirecionar apÃ³s cleanup
    window.location.href = '/login';
  }

  useEffect(() => {
    if (!isLoading && user?.mustChangePassword && router.pathname !== '/first-access') {
      router.replace('/first-access');
    }
  }, [isLoading, user, router.pathname]);

  function updateMustChangePassword(value: boolean) {
    setMustChangePassword(value);
    localStorage.setItem('valora_must_change_password', String(value));
    if (user) {
      setUser({ ...user, mustChangePassword: value });
    }
  }

  function changeCompany(id: number) {
    setCompanyId(id);
    localStorage.setItem('valora_company_id', String(id));
  }

  useEffect(() => {
    if (!user || !token) return;
    const local = getLocalColorPreference();
    if (!local.mode || !local.updatedAt) return;
    if (local.updatedAt > serverPrefUpdatedAtRef.current) {
      updateServerColorScheme(local.mode);
      serverPrefUpdatedAtRef.current = local.updatedAt;
    }
  }, [colorMode, user, token]);

  // Auto-refresh com verificaÃ§Ã£o menos agressiva
  useEffect(() => {
    if (!token) return;

    const checkTokenValidity = async () => {
      try {
        await api.get('/auth/validate');
      } catch (error: any) {
        if (error.response?.status === 401) {
          const refreshed = await refreshToken();
          if (!refreshed) {
            logout();
          }
        }
      }
    };

    // Verificar a cada 10 minutos (menos agressivo)
    const interval = setInterval(checkTokenValidity, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        refreshToken,
        isLoading,
        userRole: user && companyId ? user.companies.find(c => c.id === companyId)?.role || null : null,
        userId: user?.id || null,
        companyId,
        userName: user?.name || null,
        companyName: user && companyId ? user.companies.find(c => c.id === companyId)?.name || null : null,
        // financial flags removed
        mustChangePassword,
        updateMustChangePassword,
        changeCompany
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

