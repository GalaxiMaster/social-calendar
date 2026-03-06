import { supabase } from "@/lib/supabase";
import { useCallback } from "react";

export function useGoogleAuthWeb() {
  const signIn = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
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
