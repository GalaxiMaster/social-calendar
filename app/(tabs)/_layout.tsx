import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Entypo from "@expo/vector-icons/Entypo";
import { View } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2a8fbf",
        tabBarInactiveTintColor: "#6b8ea8",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: "#0a2540",
          borderTopWidth: 0,
          height: 80,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarIconStyle: {
          marginTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 0,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: "",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 75,
                height: 40,
                borderRadius: 25,
                backgroundColor: focused ? "#006793" : "#0a2540",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Entypo name="calendar" size={24} color="white" />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
