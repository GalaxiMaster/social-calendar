import { useAuth } from "@/lib/auth/authContext";
import DesktopSidebar from "@/lib/components/desktopSideBar";
import { useUserId } from "@/lib/databaseQueries";
import { useMySettings } from "@/lib/settingsState";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, router, Tabs } from "expo-router";
import React from "react";
import {
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";

export default function TabsLayout() {
  const { session, loading } = useAuth();
  const { width } = useWindowDimensions();

  const userId = useUserId();
  useMySettings(userId);

  if (loading) return null;
  if (!session) return <Redirect href="/" />;

  const isDesktop = width >= 768;

  const tabBarStyle: ViewStyle = {
    display: isDesktop ? "none" : "flex",
    height: 70,
    borderTopWidth: 1,
  };

  return (
    <View style={styles.container}>
      {isDesktop && <DesktopSidebar />}

      <View style={styles.content}>
        <Tabs
          screenOptions={{
            tabBarStyle: tabBarStyle,
          }}
        >
          <Tabs.Screen
            name="friends"
            options={{
              title: "Friends",
              headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="people-outline" color={color} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="calendar"
            options={{
              title: "Calendar",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="calendar-outline" color={color} size={size} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: "Profile",
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="person-outline" color={color} size={size} />
              ),
              headerShown: true,
              headerRight:
                Platform.OS !== "web"
                  ? () => (
                      <Ionicons
                        name="settings-outline"
                        size={24}
                        color="white"
                        style={{ marginRight: 16 }}
                        onPress={() => {
                          router.push("/settings");
                        }}
                      />
                    )
                  : undefined,
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              href: null,
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  content: {
    flex: 1,
  },
});
