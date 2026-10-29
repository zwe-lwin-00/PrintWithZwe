import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getAdminSession, loginAdmin, logoutAdmin } from "@/api/catalogClient";

interface AdminAuthContextValue {
  email: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    try {
      sessionStorage.removeItem("pzw_admin_token");
      sessionStorage.removeItem("pzw_admin_email");
    } catch {}
    const expire = () => setEmail(null);
    window.addEventListener("pzw-session-expired", expire);
    void getAdminSession()
      .then((session) => { if (active) setEmail(session?.email ?? null); })
      .catch(() => { if (active) setEmail(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; window.removeEventListener("pzw-session-expired", expire); };
  }, []);

  const login = useCallback(async (nextEmail: string, password: string, code: string) => {
    const result = await loginAdmin(nextEmail, password, code);
    setEmail(result.email);
  }, []);

  const logout = useCallback(async () => {
    await logoutAdmin();
    setEmail(null);
  }, []);

  const value = useMemo(
    () => ({
      email,
      loading,
      isAuthenticated: !!email,
      login,
      logout,
    }),
    [email, loading, login, logout],
  );

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}
