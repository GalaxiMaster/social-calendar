import { useColorScheme } from "@/hooks/use-color-scheme";
import { LoadingProvider } from "@/lib/loadingContext";
import {
  DarkTheme,
  ThemeProvider
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { AuthProvider } from "../lib/auth/authContext";

export const unstable_settings = {
  anchor: "(tabs)",
  title: "",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <LoadingProvider>
      <AuthProvider>
        <ThemeProvider value={DarkTheme}>
          <Stack screenOptions={{ headerShown: false }} />
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    </LoadingProvider>
  );
}
