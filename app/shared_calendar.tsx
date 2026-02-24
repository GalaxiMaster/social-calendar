import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import InfiniteCalendar from "@/lib/scrollableCalendar";
import { AvailabilitiesSection } from "./(tabs)/calendar";

export type TimeSlot = {
  id: string;
  start: Date;
  end: Date;
};

export default function SharedCalendarScreen() {
  const { friendId } = useLocalSearchParams<{ friendId?: string }>();

  // STRUCTURE ONLY — replace later with real intersection data
  const sharedAvailabilities: TimeSlot[] = [];

  return (
    <>
      <Stack.Screen
        options={{
          title: "Shared Availability",
          headerBackTitle: "Friends",
          gestureEnabled: true,
          headerShown: true,
        }}
      />

      <View style={styles.container}>
        {sharedAvailabilities.length === -1 ? (
          <Text style={styles.empty}>No shared availability yet.</Text>
        ) : (
          <>
            <InfiniteCalendar
              availabilities={sharedAvailabilities}
              startHour={0}
              endHour={24}
              onSlotPress={() => {}}
            />
            <AvailabilitiesSection availabilities={sharedAvailabilities} />
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D1117",
    padding: 16,
  },
  empty: {
    color: "#8B949E",
    marginTop: 40,
    textAlign: "center",
  },
});
