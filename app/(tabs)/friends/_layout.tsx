// app/(tabs)/friends/_layout.tsx
import { Stack } from "expo-router";

export default function FriendsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Friends" }} />
      <Stack.Screen
        name="shared_calendar"
        options={{ title: "Shared Calendar" }}
      />
    </Stack>
  );
}
