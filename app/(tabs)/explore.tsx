import * as Calendar from "expo-calendar";
import React, { useState } from "react";
import { Alert, Animated, Button, StyleSheet, Text, View } from "react-native";
import InfiniteCalendar from "../scrollableCalendar";
import { formatHour } from "../utils";

type TimeSlot = {
  start: Date;
  end: Date;
};

const exampleData: TimeSlot[] = [
  {
    start: new Date(2026, 1, 24, 9, 0),
    end: new Date(2026, 1, 24, 10, 30),
  },
  {
    start: new Date(2026, 1, 25, 13, 0),
    end: new Date(2026, 1, 25, 14, 30),
  },
  {
    start: new Date(2026, 1, 26, 0, 0),
    end: new Date(2026, 1, 26, 24, 0),
  },
  {
    start: new Date(2026, 1, 27, 18, 0),
    end: new Date(2026, 1, 27, 20, 0),
  },
  {
    start: new Date(2026, 1, 28, 8, 30),
    end: new Date(2026, 1, 28, 11, 0),
  },
];

export async function getBusySlots(
  start: Date,
  end: Date,
): Promise<TimeSlot[]> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();

  if (status !== "granted") {
    Alert.alert("Permission Denied", "Calendar access is required.");
    return [];
  }

  const calendars = await Calendar.getCalendarsAsync(
    Calendar.EntityTypes.EVENT,
  );

  const events = await Calendar.getEventsAsync(
    calendars.map((cal) => cal.id),
    start,
    end,
  );

  return events.map((event) => ({
    start: new Date(event.startDate),
    end: new Date(event.endDate),
  }));
}

export function invertBusyToAvailability(
  busy: TimeSlot[],
  rangeStart: Date,
  rangeEnd: Date,
): TimeSlot[] {
  const startMs = rangeStart.getTime();
  const endMs = rangeEnd.getTime();
  if (startMs >= endMs) return [];

  if (!busy?.length) {
    return [{ start: rangeStart, end: rangeEnd }];
  }

  const clamped = busy
    .map(({ start, end }) => {
      const s = new Date(start).getTime();
      const e = new Date(end).getTime();
      return {
        start: Math.max(s, startMs),
        end: Math.min(e, endMs),
      };
    })
    .filter(
      (slot) =>
        Number.isFinite(slot.start) &&
        Number.isFinite(slot.end) &&
        slot.end > slot.start,
    )
    .sort((a, b) => a.start - b.start);

  if (clamped.length === 0) {
    return [{ start: rangeStart, end: rangeEnd }];
  }

  // Merge overlaps
  const merged: { start: number; end: number }[] = [];
  for (const slot of clamped) {
    const last = merged[merged.length - 1];
    if (!last || slot.start > last.end) {
      merged.push({ ...slot });
    } else {
      last.end = Math.max(last.end, slot.end);
    }
  }

  // Invert to availability
  const raw: TimeSlot[] = [];
  let cursor = startMs;

  for (const slot of merged) {
    if (slot.start > cursor) {
      raw.push({
        start: new Date(cursor),
        end: new Date(slot.start),
      });
    }
    cursor = Math.max(cursor, slot.end);
  }

  if (cursor < endMs) {
    raw.push({
      start: new Date(cursor),
      end: new Date(endMs),
    });
  }

  return splitByDaySafe(raw);
}

function splitByDaySafe(slots: TimeSlot[]): TimeSlot[] {
  const result: TimeSlot[] = [];
  const minDuration = 1 * 60 * 1000; // ignore slivers under x minutes

  for (const slot of slots) {
    let start = new Date(slot.start);
    const end = new Date(slot.end);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;

    while (start < end) {
      const nextMidnight = new Date(start);
      nextMidnight.setHours(24, 0, 0, 0);

      const segmentEnd = nextMidnight < end ? nextMidnight : end;

      if (segmentEnd.getTime() - start.getTime() >= minDuration) {
        result.push({ start: new Date(start), end: new Date(segmentEnd) });
      }

      start = nextMidnight;
    }
  }

  return result;
}
function generateBoundaryBusy(
  hours: number[],
  rangeStart: Date,
  rangeEnd: Date,
): TimeSlot[] {
  const busy: TimeSlot[] = [];
  const cursor = new Date(rangeStart);
  cursor.setHours(0, 0, 0, 0);

  while (cursor < rangeEnd) {
    const dayStart = new Date(cursor);
    const dayEnd = new Date(cursor);
    dayEnd.setHours(24, 0, 0, 0);

    // block morning
    busy.push({
      start: new Date(dayStart),
      end: new Date(cursor.setHours(hours[0], 0, 0, 0)),
    });

    // block night
    const eveningStart = new Date(cursor);
    eveningStart.setHours(hours[1], 0, 0, 0);
    busy.push({ start: eveningStart, end: dayEnd });

    cursor.setHours(24, 0, 0, 0); // advance to next day
  }

  return busy;
}

export function calculateRemainingTimeInDay(sleepingHours: number[]): number {
  const [startSleep, endSleep] = sleepingHours;
  const remainingHours = endSleep - startSleep;
  return remainingHours;
}

export default function TabTwoScreen() {
  const [availabilities, setAvailabilities] = useState<TimeSlot[]>([]);
  const now = new Date();
  const sleepingHours = [0, 24];

  return (
    <Animated.ScrollView>
      <View style={{ marginTop: 50, padding: 20 }}>
        <Button
          title="Intersect Calendars"
          onPress={async () => {
            const oneWeekLater = new Date(
              now.getTime() + 7 * 24 * 60 * 60 * 1000,
            );
            oneWeekLater.setHours(24, 0, 0, 0);

            const busySlots = await getBusySlots(now, oneWeekLater);

            console.log(
              "Calendar Busy:",
              busySlots.map((b) => ({
                local: b.start.toString(),
                utc: b.start.toISOString(),
              })),
            );

            const intersected = invertBusyToAvailability(
              [
                ...busySlots,
                ...exampleData,
                ...generateBoundaryBusy(sleepingHours, now, oneWeekLater),
              ],
              now,
              oneWeekLater,
            );

            console.log("Intersected:", intersected);

            setAvailabilities(intersected);
          }}
        />
      </View>
      <InfiniteCalendar
        availabilities={availabilities}
        startHour={sleepingHours[0]}
        endHour={sleepingHours[1]}
        onSlotPress={() => {}}
      />
      <AvailabilitesSection availabilities={availabilities} />
    </Animated.ScrollView>
  );
}

export function AvailabilitesSection({
  availabilities,
}: {
  availabilities: TimeSlot[];
}): React.ReactElement {
  function formatAvailabilitiesByDate(
    availabilities: TimeSlot[],
  ): Record<string, TimeSlot[]> {
    const result: Record<string, TimeSlot[]> = {};
    for (const slot of availabilities) {
      const dateKey = slot.start.toDateString();
      if (!result[dateKey]) {
        result[dateKey] = [];
      }
      result[dateKey].push(slot);
    }
    return result;
  }
  const grouped = formatAvailabilitiesByDate(availabilities);

  return (
    <View>
      {Object.keys(grouped).length === 0 ? (
        <Text>No availabilities</Text>
      ) : (
        <View>
          <Text style={[styles.availabilityText, { color: "#107ce7" }]}>
            {Object.keys(grouped).length} available days
          </Text>
          {Object.keys(grouped).map((date) => {
            const slots = grouped[date];
            return (
              <View key={date} style={{ marginBottom: 10 }}>
                <Text style={{ fontWeight: "bold", color: "#ffffff" }}>
                  {date}
                </Text>
                {slots.map((slot, idx) => (
                  <Text key={idx} style={{ color: "#ffffff" }}>
                    {formatHour(slot.start.getHours())} -{" "}
                    {formatHour(slot.end.getHours())}
                  </Text>
                ))}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  availabilityText: {
    fontSize: 16,
    color: "#ffffff",
  },
});
