import { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase";

const AuthContext = createContext<{
  session: Session | null;
  loading: boolean;
}>({
  session: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      if (session?.provider_token) {
        saveGoogleToken(session.provider_token);
      }
      if (_event === "SIGNED_OUT") {
        localStorage.removeItem("google_token");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

const saveGoogleToken = (token: string) => {
  localStorage.setItem("google_token", token);
  localStorage.setItem("google_token_saved_at", Date.now().toString());
};

export const getGoogleToken = async () => {
  const token = localStorage.getItem("google_token");
  const savedAt = localStorage.getItem("google_token_saved_at");
  const age = Date.now() - Number(savedAt);

  if (token && age < 55 * 60 * 1000) return token;

  await supabase.auth.refreshSession();

  return localStorage.getItem("google_token");
};
