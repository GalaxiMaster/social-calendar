import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
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
        AsyncStorage.removeItem("google_token");
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
  if (Platform.OS !== "web") return; // skip if not web as its not ever accessed

  AsyncStorage.setItem("google_token", token);
  AsyncStorage.setItem("google_token_saved_at", Date.now().toString());
};

export const getGoogleToken = async () => {
  if (Platform.OS !== "web") {
    return (await GoogleSignin.getTokens()).accessToken;
  }

  const token = await AsyncStorage.getItem("google_token");

  const savedAt = AsyncStorage.getItem("google_token_saved_at");
  const age = Date.now() - Number(savedAt);

  if (token && age < 55 * 60 * 1000) return token;

  await supabase.auth.refreshSession();

  return AsyncStorage.getItem("google_token");
};
