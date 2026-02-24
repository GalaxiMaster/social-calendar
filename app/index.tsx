import { GoogleSignInButton } from "@/lib/auth/auth";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../lib/auth/authContext";

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (session) return <Redirect href="/(tabs)/calendar" />;

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <GoogleSignInButton />
    </View>
  );
}
