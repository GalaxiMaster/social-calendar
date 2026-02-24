import { supabase } from "@/lib/supabase";
import * as Google from "expo-auth-session/providers/google";
import { useEffect } from "react";

export function useGoogleAuthWeb() {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
    webClientId: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      supabase.auth.signInWithIdToken({ provider: "google", token: id_token });
    }
  }, [response]);

  return {
    signIn: () => promptAsync(),
    signOut: () => supabase.auth.signOut(),
    disabled: !request,
  };
}
