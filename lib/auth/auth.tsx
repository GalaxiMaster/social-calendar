import { GoogleSigninButton } from "@react-native-google-signin/google-signin";
import React from "react";
import { Button, Platform } from "react-native";
import { useGoogleAuthNative } from "./useGoogleAuthNative"; // android
import { useGoogleAuthWeb } from "./useGoogleAuthWeb"; // ios

export function useGoogleAuth() {
  return Platform.OS === "android" ? useGoogleAuthNative() : useGoogleAuthWeb();
}

export function GoogleSignInButton() {
  const { signIn, disabled } = useGoogleAuth();

  // Native button on Android, plain button on iOS (Expo Go)
  if (Platform.OS === "android") {
    return (
      <GoogleSigninButton
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Dark}
        onPress={() => {
          signIn();
        }}
      />
    );
  }

  return (
    <Button title="Sign in with Google" onPress={signIn} disabled={disabled} />
  );
}
