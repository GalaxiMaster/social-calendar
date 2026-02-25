import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TimeSlot } from "./models";
import { formatHour } from "./utils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CONFIG = {
  visibleDays: 7,
  // Height of each hour row in pixels.

  hourHeight: 30,

  timeGutterWidth: 52,

  dayHeaderHeight: 64,

  pastDays: 0,

  futureDays: 300,

  decelerationRate: "normal" as "normal" | "fast",

  snapToDays: true,

  colors: {
    background: "transparent",
    border: "#30363D",
    hourLabel: "#8B949E",
    dayName: "#8B949E",
    dayNum: "#E6EDF3",
    todayAccent: "#1F6FEB",
    slotBackground: "rgba(74, 149, 202, 0.9)",
    slotBorder: "#7CC9FF",
    slotText: "#ffffff",
    nowIndicator: "#1F6FEB",
  },
};

// Derived constants (do not edit)
const DAY_WIDTH = Math.floor(
  (SCREEN_WIDTH - CONFIG.timeGutterWidth) / CONFIG.visibleDays,
);
const TOTAL_DAYS = CONFIG.pastDays + CONFIG.futureDays + 1;
const CENTER_INDEX = CONFIG.pastDays;
const DAY_OFFSETS = Array.from(
  { length: TOTAL_DAYS },
  (_, i) => i - CENTER_INDEX,
);

// Helpers
function dayFromOffset(offset: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isToday(d: Date) {
  return d.toDateString() === new Date().toDateString();
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
}

function nowTopOffset(startHour: number) {
  const n = new Date();
  return (n.getHours() + n.getMinutes() / 60 - startHour) * CONFIG.hourHeight;
}

function clipToDay(
  slot: TimeSlot,
  dayStart: Date,
  startHour: number,
  endHour: number,
): { top: number; height: number } | null {
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const windowStart = new Date(dayStart);
  windowStart.setHours(startHour, 0, 0, 0);
  const windowEnd = new Date(dayStart);
  windowEnd.setHours(endHour, 0, 0, 0);

  const from = new Date(
    Math.max(slot.start.getTime(), windowStart.getTime(), dayStart.getTime()),
  );
  const to = new Date(
    Math.min(slot.end.getTime(), windowEnd.getTime(), dayEnd.getTime()),
  );

  if (from >= to) return null;

  const top =
    (from.getHours() + from.getMinutes() / 60 - startHour) * CONFIG.hourHeight;
  const height =
    ((to.getTime() - from.getTime()) / 3_600_000) * CONFIG.hourHeight;

  return { top, height: Math.max(height, 20) };
}

function TimeGutter({
  startHour,
  endHour,
}: {
  startHour: number;
  endHour: number;
}) {
  // +1 so the endHour label is rendered at the bottom
  const rows = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => startHour + i,
  );

  return (
    <View
      style={{
        width: CONFIG.timeGutterWidth,
        backgroundColor: CONFIG.colors.background,
        marginTop: -8,
      }}
    >
      <View style={{ height: CONFIG.dayHeaderHeight }} />
      {rows.map((h) => (
        <View
          key={h}
          style={{
            height: CONFIG.hourHeight,
            justifyContent: "flex-start",
          }}
        >
          <Text style={styles.hourLabel}>{formatHour(h)}</Text>
        </View>
      ))}
    </View>
  );
}

function DayColumn({
  dayOffset,
  availabilities,
  startHour,
  endHour,
  onSlotPress,
}: {
  dayOffset: number;
  availabilities: TimeSlot[];
  startHour: number;
  endHour: number;
  onSlotPress: (s: TimeSlot) => void;
}) {
  const day = useMemo(() => dayFromOffset(dayOffset), [dayOffset]);
  const totalHeight = (endHour - startHour) * CONFIG.hourHeight;
  const today = isToday(day);

  const nextDay = useMemo(() => {
    const d = new Date(day);
    d.setDate(d.getDate() + 1);
    return d;
  }, [day]);

  const slots = useMemo(
    () => availabilities.filter((s) => s.start < nextDay && s.end > day),
    [availabilities, day.toDateString()],
  );

  // +1 so the bottom border line of the last hour renders
  const hourLines = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => i,
  );

  return (
    <View style={{ width: DAY_WIDTH }}>
      {/* Day header */}
      <View
        style={[
          styles.dayHeader,
          today && { borderBottomColor: CONFIG.colors.todayAccent },
        ]}
      >
        <Text
          style={[
            styles.dayName,
            today && { color: CONFIG.colors.todayAccent },
          ]}
        >
          {day.toLocaleDateString("en", { weekday: "short" })}
        </Text>
        <View style={[styles.dayNumBadge, today && styles.dayNumBadgeToday]}>
          <Text style={[styles.dayNum, today && styles.dayNumToday]}>
            {day.getDate()}
          </Text>
        </View>
      </View>

      {/* Grid */}
      <View style={{ height: totalHeight, position: "relative" }}>
        {hourLines.map((i) => (
          <View
            key={i}
            style={[styles.hourLine, { top: i * CONFIG.hourHeight }]}
          />
        ))}

        {slots.map((slot, i) => {
          const pos = clipToDay(slot, day, startHour, endHour);
          if (!pos) return null;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => onSlotPress(slot)}
              activeOpacity={0.8}
              style={[styles.slot, { top: pos.top, height: pos.height }]}
            >
              {pos.height > 32 && (
                <Text style={styles.slotText} numberOfLines={8}>
                  {slot.title ? `${slot.title}\n` : ""}
                  {formatTime(slot.start)}
                  {"-\n"}
                  {formatTime(slot.end)}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}

        {today && (
          <>
            <View
              style={[styles.nowDot, { top: nowTopOffset(startHour) - 5 }]}
            />
            <View style={[styles.nowLine, { top: nowTopOffset(startHour) }]} />
          </>
        )}
      </View>
    </View>
  );
}

export default function InfiniteCalendar({
  availabilities,
  startHour = 7,
  endHour = 21,
  onSlotPress,
}: {
  availabilities: TimeSlot[];
  startHour?: number;
  endHour?: number;
  onSlotPress: (s: TimeSlot) => void;
}) {
  const listRef = useRef<FlatList>(null);
  const totalHeight = (endHour - startHour) * CONFIG.hourHeight;
  const fullHeight = CONFIG.dayHeaderHeight + totalHeight + 20;
  useEffect(() => {
    const timer = setTimeout(() => {
      listRef.current?.scrollToIndex({ index: CENTER_INDEX, animated: false });
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const renderDay = useCallback(
    ({ item }: { item: number }) => (
      <DayColumn
        dayOffset={item}
        availabilities={availabilities}
        startHour={startHour}
        endHour={endHour}
        onSlotPress={onSlotPress}
      />
    ),
    [availabilities, startHour, endHour, onSlotPress],
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: DAY_WIDTH,
      offset: DAY_WIDTH * index,
      index,
    }),
    [],
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: CONFIG.colors.background }}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View style={{ flexDirection: "row", height: fullHeight }}>
        <TimeGutter startHour={startHour} endHour={endHour} />

        <FlatList
          ref={listRef}
          data={DAY_OFFSETS}
          renderItem={renderDay}
          keyExtractor={(item) => item.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={CENTER_INDEX}
          getItemLayout={getItemLayout}
          snapToInterval={CONFIG.snapToDays ? DAY_WIDTH : undefined}
          snapToAlignment="start"
          decelerationRate={CONFIG.decelerationRate}
          windowSize={9}
          maxToRenderPerBatch={6}
          updateCellsBatchingPeriod={20}
          removeClippedSubviews
          onScrollToIndexFailed={({ index }) => {
            listRef.current?.scrollToOffset({
              offset: index * DAY_WIDTH,
              animated: false,
            });
          }}
          style={{ flex: 1 }}
        />
      </View>
    </ScrollView>
  );
}

// Styles
const styles = StyleSheet.create({
  dayHeader: {
    height: CONFIG.dayHeaderHeight,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CONFIG.colors.border,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: CONFIG.colors.border,
  },
  dayName: {
    color: CONFIG.colors.dayName,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dayNumBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  dayNumBadgeToday: {
    backgroundColor: CONFIG.colors.todayAccent,
  },
  dayNum: {
    color: CONFIG.colors.dayNum,
    fontSize: 16,
    fontWeight: "500",
  },
  dayNumToday: {
    color: "#fff",
  },
  hourLabel: {
    color: CONFIG.colors.hourLabel,
    fontSize: 11,
    textAlign: "right",
    paddingRight: 8,
  },
  hourLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: CONFIG.colors.border,
  },
  slot: {
    position: "absolute",
    left: 3,
    right: 3,
    backgroundColor: CONFIG.colors.slotBackground,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: CONFIG.colors.slotBorder,
    paddingHorizontal: 4,
    paddingVertical: 3,
    overflow: "hidden",
  },
  slotText: {
    color: CONFIG.colors.slotText,
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 14,
  },
  nowLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: CONFIG.colors.nowIndicator,
    zIndex: 10,
  },
  nowDot: {
    position: "absolute",
    left: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: CONFIG.colors.nowIndicator,
    zIndex: 10,
  },
});
