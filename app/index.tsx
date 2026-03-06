import { GoogleSignInButton } from "@/lib/auth/auth";
import { Redirect } from "expo-router";
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../lib/auth/authContext";

const BG = "#0D1117";
const BORDER = "#21262D";
const TEXT_PRIMARY = "#C9D1D9";
const TEXT_SECONDARY = "#afb8c2";
const TEXT_MUTED = "#484F58";
const BLUE = "#388BFD";

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={BLUE} />
      </View>
    );
  }

  if (session) return <Redirect href="/(tabs)/calendar" />;

  return (
    <View style={styles.container}>
      <Text style={styles.wordmark}>Social Calendar</Text>

      <Text style={styles.tagline}>
        Share your calendar with friends.{"\n"}See when you're both free.
      </Text>

      <GoogleSignInButton />

      <TouchableOpacity
        style={styles.privacyLink}
        onPress={() => Linking.openURL("/privacy-policy")}
      >
        <Text style={styles.privacyText}>Privacy Policy</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 24,
  },
  wordmark: {
    fontSize: 36,
    fontWeight: "800",
    color: TEXT_PRIMARY,
    letterSpacing: -1.5,
  },
  tagline: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 22,
  },
  privacyLink: {
    position: "absolute",
    bottom: 32,
  },
  privacyText: {
    fontSize: 12,
    color: TEXT_MUTED,
    textDecorationLine: "underline",
  },
});
