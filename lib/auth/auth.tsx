import { GoogleSigninButton } from "@react-native-google-signin/google-signin";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useGoogleAuthNative } from "./useGoogleAuthNative";
import { useGoogleAuthWeb } from "./useGoogleAuthWeb";

export function useGoogleAuth() {
  return Platform.OS === "android" ? useGoogleAuthNative() : useGoogleAuthWeb();
}

function GoogleIcon() {
  return <Text style={styles.googleIcon}>G</Text>;
}

export function GoogleSignInButton() {
  const { signIn, disabled } = useGoogleAuth();

  if (Platform.OS === "android") {
    return (
      <GoogleSigninButton
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Dark}
        onPress={signIn}
      />
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={signIn}
      disabled={disabled}
      activeOpacity={0.75}
    >
      <View style={styles.iconWrap}>
        <GoogleIcon />
      </View>
      <Text style={styles.label}>Sign in with Google</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161B22",
    borderWidth: 1,
    borderColor: "#21262D",
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 20,
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  iconWrap: {
    width: 18,
    height: 18,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  googleIcon: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4285F4",
    letterSpacing: -0.5,
  },
  label: {
    color: "#C9D1D9",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
});
