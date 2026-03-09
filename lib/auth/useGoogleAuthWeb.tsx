import { supabase } from "@/lib/supabase";
import { useCallback } from "react";

export function useGoogleAuthWeb() {
  const signIn = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        scopes: "https://www.googleapis.com/auth/calendar.events.readonly",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
  }, []);

  const signOut = useCallback(() => {
    return supabase.auth.signOut();
  }, []);

  return {
    signIn,
    signOut,
    disabled: false,
  };
}
