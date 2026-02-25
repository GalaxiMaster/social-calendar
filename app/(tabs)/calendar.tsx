import { CalendarRequest, TimeSlot } from "@/lib/models";
import {
  generateBoundaryBusy,
  getBusySlots,
  invertBusyToAvailability,
} from "@/lib/utils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { Animated, Button, StyleSheet, Text, View } from "react-native";
import InfiniteCalendar from "../../lib/scrollableCalendar";

export default function Explore() {
  const [availabilities, setAvailabilities] = useState<TimeSlot[]>([]);
  const now = new Date();
  const sleepingHours = [0, 24];
  useEffect(() => {
    loadAvailabilities();
  }, []);

  const loadAvailabilities = async () => {
    try {
      const stored = await AsyncStorage.getItem("personalCalendar");
      if (!stored) return;

      const parsed = JSON.parse(stored);

      const withDates = parsed.map((item: TimeSlot) => ({
        ...item,
        start: new Date(item.start),
        end: new Date(item.end),
      }));

      setAvailabilities(withDates);
    } catch (e) {
      console.log(e);
    }
  };

  const saveAvailabilities = async (newList: TimeSlot[]) => {
    try {
      const serializable = newList.map((item) => ({
        ...item,
        start: item.start.toISOString(),
        end: item.end.toISOString(),
      }));
      setAvailabilities(newList);

      await AsyncStorage.setItem(
        "personalCalendar",
        JSON.stringify(serializable),
      );
    } catch (e) {
      console.log(e);
    }
  };

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

          saveAvailabilities(intersected);
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
  request,
}: {
  availabilities: TimeSlot[];
  request?: CalendarRequest;
}): React.ReactElement {
  const grouped: Record<string, TimeSlot[]> = {};
  for (const slot of availabilities) {
    if (!(slot.start instanceof Date)) {
      console.log("Invalid slot start:", slot.start);
      continue;
    }
    const durationHours =
      (slot.end.getTime() - slot.start.getTime()) / (1000 * 60 * 60);

    if (request && durationHours < request.min_hours) {
      continue;
    }
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
