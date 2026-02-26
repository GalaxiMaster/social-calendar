import { useColorScheme } from "@/hooks/use-color-scheme";
import { LoadingProvider } from "@/lib/loadingContext";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { AuthProvider } from "../lib/auth/authContext";

export const unstable_settings = {
  anchor: "(tabs)",
  title: "",
};

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <LoadingProvider>
        <AuthProvider>
          <ThemeProvider value={DarkTheme}>
            <Stack screenOptions={{ headerShown: false }} />
            <StatusBar style="auto" />
          </ThemeProvider>
        </AuthProvider>
      </LoadingProvider>
    </QueryClientProvider>
  );
}
