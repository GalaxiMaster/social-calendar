import * as Calendar from "expo-calendar";
import { Alert } from "react-native";
import { TimeSlot } from "./models";

export function formatHour(h: number) {
  const normalized = h % 24;
  const display = normalized % 12 || 12;
  const period = normalized < 12 ? "am" : "pm";
  return `${display} ${period}`;
}

export function toLocalDateFormatted(dateTimeStr: string) {
  return new Date(dateTimeStr).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

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

export function splitByDaySafe(slots: TimeSlot[]): TimeSlot[] {
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
export function generateBoundaryBusy(
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
