import { useGoogleAuth } from "@/lib/auth/auth";
import { useAuth } from "@/lib/auth/authContext";
import { useLoading } from "@/lib/loadingContext";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import React from "react";

export default function TabsLayout() {
  const { session, loading } = useAuth();
  const { signOut } = useGoogleAuth();
  const { showLoading, hideLoading } = useLoading();

  if (loading) return null;
  if (!session) return <Redirect href="/" />;

  const handleSignOut = async () => {
    showLoading();
    await signOut();
    hideLoading();
  };
  return (
    <Tabs>
      <Tabs.Screen
        name="friends"
        options={{
          title: "Friends",
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
          headerRight: () => (
            <Ionicons
              name="exit-outline"
              size={24}
              color="#FF0000"
              style={{ marginRight: 16 }}
              onPress={handleSignOut}
            />
          ),
        }}
      />
    </Tabs>
  );
}
