import { TimeSlot } from "@/lib/models";
import * as Calendar from "expo-calendar";
import { Alert, Platform } from "react-native";
import { getGoogleToken } from "./auth/authContext";
import { Settings } from "./settingsState";

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
const GOOGLE_COLORS: Record<string, string> = {
  "1": "#7986cb", // Lavender
  "2": "#33b679", // Sage
  "3": "#8e24aa", // Grape
  "4": "#e67c73", // Flamingo
  "5": "#f6c026", // Banana
  "6": "#f5511d", // Tangerine
  "7": "#039be5", // Peacock
  "8": "#616161", // Graphite
  "9": "#3f51b5", // Blueberry
  "10": "#0b8043", // Basil
  "11": "#d60000", // Tomato
};

async function getAvailabilities(
  start: Date,
  end: Date,
  provider: string,
): Promise<any[]> {
  if (provider == "native") {
    const calendars = await Calendar.getCalendarsAsync(
      Calendar.EntityTypes.EVENT,
    );
    const filtered = calendars.filter(
      (cal) =>
        cal.allowsModifications !== false &&
        !cal.title?.toLowerCase().includes("holiday"),
    );
    return await Calendar.getEventsAsync(
      filtered.map((cal) => cal.id),
      start,
      end,
    );
  } else {
    const accessToken = await getGoogleToken();

    if (!accessToken) {
      return [];
    }
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&timeMin=${start.toISOString()}&timeMax=${end.toISOString()}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    return data.items || [];
  }
}

export async function getBusySlots(
  start: Date,
  end: Date,
  settings: Settings,
  titles: boolean = false,
): Promise<TimeSlot[]> {
  if (Platform.OS !== "web") {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Calendar access is required.");
      return [];
    }
  }

  const rangeStart = new Date(start);
  const rangeEnd = new Date(end);
  rangeStart.setHours(0, 0, 0, 0);
  rangeEnd.setHours(23, 59, 59, 999);

  const events = await getAvailabilities(
    rangeStart,
    rangeEnd,
    settings.calendarProvider,
  );

  const outputs = events.flatMap((event) => {
    // normalise native and google calendar events

    // filter events
    if (event.eventType === "birthday" && !settings.birthdays) return;
    if (event.status === "declined" && !settings.showDeclinedEvents) return;

    const rawStart =
      event.startDate || event.start?.dateTime || event.start?.date;
    const rawEnd = event.endDate || event.end?.dateTime || event.end?.date;

    const s = new Date(rawStart);
    const e = new Date(rawEnd);

    var eventDetails: TimeSlot = {
      start: s,
      end: e,
      title:
        titles && settings?.showEventTitles
          ? event.summary || event.title
          : undefined,
    };

    const isAllDay = event.allDay || (event.start && !event.start.dateTime);
    console.log(event);
    if (isAllDay && settings.alldayEvents) {
      eventDetails = {
        ...eventDetails,
        start: new Date(s.getFullYear(), s.getMonth(), s.getDate()),
        end: new Date(e.getFullYear(), e.getMonth(), e.getDate()),
      };
    }
    if (settings.calendarProvider === "google") {
      eventDetails.type = event.eventType;

      if (settings.useColor) {
        eventDetails.color = event.colorId
          ? GOOGLE_COLORS[event.colorId]
          : undefined;
      }
    }
    return eventDetails;
  });
  return outputs.filter((v) => v !== undefined);
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

export function removeFullyCoveredTimeslots(timeslots: TimeSlot[]): TimeSlot[] {
  const sorted = [...timeslots].sort((a, b) => {
    const startDiff = a.start.getTime() - b.start.getTime();
    if (startDiff !== 0) return startDiff;
    return b.end.getTime() - a.end.getTime();
  });

  const result: TimeSlot[] = [];

  for (const current of sorted) {
    const isCovered = result.some(
      (slot) => slot.start <= current.start && slot.end >= current.end,
    );
    if (!isCovered) result.push(current);
  }

  return result;
}

export function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}
