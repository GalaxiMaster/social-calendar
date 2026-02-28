import { useColorScheme } from "@/hooks/use-color-scheme";
import { LoadingProvider } from "@/lib/loadingContext";
import {
  createNavigationContainerRef,
  DarkTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import "react-native-reanimated";
import { AuthProvider } from "../lib/auth/authContext";
export const navigationRef = createNavigationContainerRef();

export const unstable_settings = {
  anchor: "(tabs)",
  title: "",
};

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  const responseListener =
    useRef<
      ReturnType<typeof Notifications.addNotificationResponseReceivedListener>
    >(null);
  useEffect(() => {
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (typeof data.screen === "string") {
          console.log(data);
          router.push({
            pathname: data.screen as any,
            params: (data.params as Record<string, any>) || {},
          });
        }
      });
    return () => responseListener.current?.remove();
  }, []);
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
