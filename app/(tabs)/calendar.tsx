import { TimeSlot } from "@/lib/models";
import * as Calendar from "expo-calendar";
import React, { useState } from "react";
import { Alert, Animated, Button, StyleSheet, Text, View } from "react-native";
import InfiniteCalendar from "../../lib/scrollableCalendar";

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

export default function Explore() {
  const [availabilities, setAvailabilities] = useState<TimeSlot[]>([]);
  const now = new Date();
  const sleepingHours = [0, 24];

  return (
    <Animated.ScrollView>
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
              ...generateBoundaryBusy(sleepingHours, now, oneWeekLater),
            ],
            now,
            oneWeekLater,
          );

          console.log("Intersected:", intersected);

          setAvailabilities(intersected);
        }}
      />
      <InfiniteCalendar
        availabilities={availabilities}
        startHour={sleepingHours[0]}
        endHour={sleepingHours[1]}
        onSlotPress={() => {}}
      />
      <AvailabilitiesSection availabilities={availabilities} />
    </Animated.ScrollView>
  );
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
}

function formatDayHeader(dateStr: string) {
  const d = new Date(dateStr);
  const isToday = d.toDateString() === new Date().toDateString();
  const isTomorrow =
    d.toDateString() === new Date(Date.now() + 86400000).toDateString();

  const weekday = d.toLocaleDateString("en", { weekday: "long" });
  const date = d.toLocaleDateString("en", { month: "short", day: "numeric" });

  if (isToday) return { label: "Today", sub: date, highlight: true };
  if (isTomorrow) return { label: "Tomorrow", sub: date, highlight: false };
  return { label: weekday, sub: date, highlight: false };
}

function slotDurationMins(slot: TimeSlot) {
  return Math.round((slot.end.getTime() - slot.start.getTime()) / 60000);
}

function formatDuration(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function AvailabilitiesSection({
  availabilities,
}: {
  availabilities: TimeSlot[];
}): React.ReactElement {
  const grouped: Record<string, TimeSlot[]> = {};
  for (const slot of availabilities) {
    const key = slot.start.toDateString();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(slot);
  }
  const dates = Object.keys(grouped);

  if (dates.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyDot} />
        <Text style={styles.emptyText}>No availability</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Summary row */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryPill}>
          <View style={styles.pillDot} />
          <Text style={styles.pillText}>
            {dates.length} {dates.length === 1 ? "day" : "days"} available
          </Text>
        </View>
        <Text style={styles.summarySlots}>
          {availabilities.length}{" "}
          {availabilities.length === 1 ? "slot" : "slots"}
        </Text>
      </View>

      {/* Day groups */}
      <View style={styles.list}>
        {dates.map((date, di) => {
          const slots = grouped[date];
          const { label, sub, highlight } = formatDayHeader(date);

          return (
            <View key={date} style={styles.dayGroup}>
              {/* Day header */}
              <View style={styles.dayHeaderRow}>
                <View
                  style={[
                    styles.dayAccentBar,
                    highlight && styles.dayAccentBarToday,
                  ]}
                />
                <Text
                  style={[styles.dayLabel, highlight && styles.dayLabelToday]}
                >
                  {label}
                </Text>
                <Text style={styles.daySub}>{sub}</Text>
              </View>

              {/* Slots */}
              <View style={styles.slotsContainer}>
                {slots.map((slot, i) => {
                  const mins = slotDurationMins(slot);
                  return (
                    <View key={i} style={styles.slotRow}>
                      <View style={styles.slotTimeBlock}>
                        <Text style={styles.slotStart}>
                          {formatTime(slot.start)}
                        </Text>
                        <View style={styles.slotLine} />
                        <Text style={styles.slotEnd}>
                          {formatTime(slot.end)}
                        </Text>
                      </View>
                      <View style={styles.slotBar}>
                        <View style={styles.slotBarFill} />
                      </View>
                      <View style={styles.slotDurationBadge}>
                        <Text style={styles.slotDurationText}>
                          {formatDuration(mins)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Divider between days */}
              {di < dates.length - 1 && <View style={styles.divider} />}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingVertical: 4,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(31, 111, 235, 0.15)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(31, 111, 235, 0.4)",
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#1F6FEB",
    marginRight: 6,
  },
  pillText: {
    color: "#1F6FEB",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  summarySlots: {
    color: "#8B949E",
    fontSize: 12,
  },

  list: {
    gap: 0,
  },
  dayGroup: {
    marginBottom: 4,
  },

  dayHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  dayAccentBar: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: "#30363D",
  },
  dayAccentBarToday: {
    backgroundColor: "#1F6FEB",
  },
  dayLabel: {
    color: "#E6EDF3",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  dayLabelToday: {
    color: "#1F6FEB",
  },
  daySub: {
    color: "#8B949E",
    fontSize: 12,
  },

  slotsContainer: {
    paddingLeft: 11,
    gap: 6,
    marginBottom: 4,
  },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  slotTimeBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: 160,
  },
  slotStart: {
    color: "#E6EDF3",
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
  slotLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#30363D",
  },
  slotEnd: {
    color: "#8B949E",
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
  slotBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#21262D",
    borderRadius: 2,
    overflow: "hidden",
  },
  slotBarFill: {
    // Visual indicator — make proportional to duration later
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(74, 149, 202, 0.5)",
    borderRadius: 2,
  },
  slotDurationBadge: {
    backgroundColor: "#21262D",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#30363D",
  },
  slotDurationText: {
    color: "#8B949E",
    fontSize: 11,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#21262D",
    marginTop: 12,
    marginBottom: 12,
  },

  emptyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  emptyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#30363D",
  },
  emptyText: {
    color: "#8B949E",
    fontSize: 13,
  },
  availabilityText: {
    fontSize: 16,
    color: "#ffffff",
  },
});
