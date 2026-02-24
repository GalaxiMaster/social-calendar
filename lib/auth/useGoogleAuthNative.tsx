import { supabase } from "@/lib/supabase";
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";

GoogleSignin.configure({
  webClientId:
    "54881957214-vvm7i12n7sllnceoj3j2hc2ioj6div6s.apps.googleusercontent.com",
  scopes: ["profile", "email"],
});

export function useGoogleAuthNative() {
  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const { data } = await GoogleSignin.signIn();
      if (!data?.idToken) throw new Error("No ID token");

      const { data: session, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: data.idToken,
      });

      if (error) throw error;

      return session;
    } catch (error) {
      if (isErrorWithCode(error)) {
        if (error instanceof Error) {
          console.log(error.message);
        }
        if (error.code === statusCodes.SIGN_IN_CANCELLED) return null;
        if (error.code === statusCodes.IN_PROGRESS) return null;
      }

      throw error;
    }
  };

  const signOut = async () => {
    await GoogleSignin.signOut();
    await supabase.auth.signOut();
  };

  return { signIn, signOut, disabled: false };
}
