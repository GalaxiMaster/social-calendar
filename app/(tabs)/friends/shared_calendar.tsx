import { Stack, useLocalSearchParams } from "expo-router";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { BLUE, globalStyles } from "@/lib/globalStyles";
import { CalendarRequest, Profile, TimeSlot } from "@/lib/models";
import InfiniteCalendar from "@/lib/scrollableCalendar";
import { supabase } from "@/lib/supabase";
import {
  generateBoundaryBusy,
  getBusySlots,
  invertBusyToAvailability,
  removeFullyCoveredTimeslots,
  toLocalDateFormatted,
} from "@/lib/utils";
import { CreateGroupRequestModal } from "@/lib/widgets/createRequestModal";
import { SyncButton } from "@/lib/widgets/syncbutton";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { AvailabilitiesSection } from "../calendar";

async function fetchRequest(groupKey: string) {
  const { data } = await supabase
    .from("calendar_requests")
    .select(`*, profiles(id, display_name, avatar_url)`)
    .eq("group_key", groupKey)
    .in("status", ["pending", "accepted"])
    .single();
  return data ?? null;
}

async function fetchMembers(groupKey: string) {
  const { data } = await supabase
    .from("group_members")
    .select(`user_id, synced_data`)
    .eq("group_key", groupKey);
  return data ?? [];
}

function parseSlots(slots: any[]): TimeSlot[] {
  return (slots || []).map((slot: any) => ({
    ...slot,
    start: new Date(slot.start),
    end: new Date(slot.end),
  }));
}

// Main Screen

export default function SharedCalendarScreen() {
  const { groupKey } = useLocalSearchParams<{ groupKey?: string }>();

  const [busyDates, setBusyDates] = useState<Record<string, TimeSlot[]>>({});
  const [request, setRequest] = useState<CalendarRequest | null>(null);
  const [creator, setCreator] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!groupKey) return;

    Promise.all([fetchRequest(groupKey), fetchMembers(groupKey)]).then(
      ([requestData, membersData]) => {
        if (requestData) {
          const { profiles, ...req } = requestData;
          setRequest(req);
          setCreator(profiles);
        }

        if (membersData.length > 0) {
          const map = Object.fromEntries(
            membersData.map((row) => [
              row.user_id,
              parseSlots(row.synced_data),
            ]),
          );
          setBusyDates(map);
        }

        setLoading(false);
        initialLoadDone.current = true;
      },
    );

    const requestChannel = supabase
      .channel(`group_request_${groupKey}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "calendar_requests",
          filter: `group_key=eq.${groupKey}`,
        },
        async ({ new: newRow }) => {
          const row = newRow as CalendarRequest;
          if (["pending", "accepted"].includes(row.status)) {
            const { data } = await supabase
              .from("calendar_requests")
              .select(`*, profiles(id, display_name, avatar_url)`)
              .eq("id", row.id)
              .single();
            if (!data) return;
            const { profiles, ...requestData } = data;
            setRequest(requestData);
            setCreator(profiles);
          } else {
            setRequest(null);
            setCreator(null);
          }
        },
      )
      .subscribe();

    const dataChannel = supabase
      .channel(`group_members_${groupKey}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "group_members",
          filter: `group_key=eq.${groupKey}`,
        },
        ({ new: newRow }) => {
          setBusyDates((prev) => ({
            ...prev,
            [newRow.user_id]: parseSlots(newRow.synced_data),
          }));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(requestChannel);
      supabase.removeChannel(dataChannel);
    };
  }, [groupKey]);
  return (
    <>
      <Stack.Screen
        options={{
          title: "Shared Availability",
          headerBackTitle: "Friends",
          gestureEnabled: true,
          headerShown: true,
          headerRight: () => (
            <SyncButton
              syncing={loading}
              onPress={async () => {
                if (!request) return;
                setLoading(true);
                const user = (await supabase.auth.getUser()).data.user;
                const busyData = await getBusySlots(
                  new Date(request.start_range),
                  new Date(request.end_range),
                  request.event_titles,
                );
                const { data: req, error: err } = await supabase
                  .from("group_members")
                  .update({ last_synced: new Date(), synced_data: busyData })
                  .eq("user_id", user!.id)
                  .eq("group_key", groupKey)
                  .select();
                console.log("Sync result:", req, err);
                setLoading(false);
              }}
            />
          ),
        }}
      />
      <Animated.ScrollView>
        <View style={styles.container}>
          {request && creator ? (
            <CalendarRequestCard request={request} creator={creator} />
          ) : loading ? (
            <View style={styles.skeletonCard} />
          ) : (
            <Text style={styles.empty}>No request available.</Text>
          )}

          <CreateGroupRequestModal
            groupKey={groupKey!}
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            onSuccess={async (request) => {
              console.log("Created!", request);
              if (request.notifications) {
                const {
                  data: { session },
                } = await supabase.auth.getSession();
                const user = session?.user;
                const user_display_name = user?.user_metadata?.full_name;

                await supabase.functions.invoke("notify-group", {
                  body: {
                    groupId: groupKey,
                    title: request.title,
                    body: user_display_name
                      ? `${user_display_name} sent a sync request${request.message ? `: ${request.message}` : ""}`
                      : request.message,
                    data: {
                      screen: "/friends/shared_calendar",
                      params: { groupKey: groupKey },
                    },
                  },
                  headers: {
                    Authorization: `Bearer ${session?.access_token}`,
                  },
                });
              }
            }}
          />

          <Pressable
            style={({ pressed }) => [
              globalStyles.createButton,
              pressed && globalStyles.createButtonPressed,
            ]}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add-circle" size={20} color={BLUE} />
            <Text style={globalStyles.createButtonText}>Create Request</Text>
          </Pressable>

          <CalendarElements
            busyDates={busyDates}
            request={request}
            loading={loading}
          />
        </View>
      </Animated.ScrollView>
    </>
  );
}

// Calendar Elements

type CalendarElementsProps = {
  busyDates: Record<string, TimeSlot[]>;
  request: CalendarRequest | null;
  loading: boolean;
};

function CalendarElements({
  busyDates,
  request,
  loading,
}: CalendarElementsProps) {
  const flatBusyDates = removeFullyCoveredTimeslots(
    Object.values(busyDates).flat(),
  );
  const hasBusyDates = flatBusyDates.length > 0;

  if (loading) {
    return (
      <>
        <View style={styles.skeletonCalendar} />
        <View style={styles.skeletonRow} />
        <View style={[styles.skeletonRow, { width: "70%" }]} />
      </>
    );
  }

  if (!hasBusyDates) {
    return <Text style={styles.empty}>No shared availability yet.</Text>;
  }

  if (!request) {
    return (
      <Text style={styles.empty}>No request data to show availability.</Text>
    );
  }

  const start = new Date(request.start_range);
  const end = new Date(request.end_range);
  const boundaryBusy = generateBoundaryBusy(
    [request.lower_hour, request.upper_hour],
    start,
    end,
  );
  const allBusy = [...flatBusyDates, ...boundaryBusy];
  const availabilities = invertBusyToAvailability(allBusy, start, end) || [];

  return (
    <>
      <InfiniteCalendar
        availabilities={allBusy}
        startHour={request.lower_hour}
        endHour={request.upper_hour}
        showTitles={request.event_titles}
        onSlotPress={() => {}}
      />
      <AvailabilitiesSection
        availabilities={availabilities}
        request={request}
      />
    </>
  );
}

// Supporting Components

function getStatusMeta(status: string): {
  label: string;
  color: string;
  bg: string;
} {
  switch (status.toLowerCase()) {
    case "pending":
      return {
        label: "Pending",
        color: "#E3A940",
        bg: "rgba(227,169,64,0.12)",
      };
    case "accepted":
      return {
        label: "Accepted",
        color: "#4DA8E3",
        bg: "rgba(77,168,227,0.12)",
      };
    case "declined":
      return {
        label: "Declined",
        color: "#E35E5E",
        bg: "rgba(227,94,94,0.12)",
      };
    default:
      return { label: status, color: "#8B949E", bg: "rgba(139,148,158,0.12)" };
  }
}

function getDaysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

function Avatar({ profile }: { profile: Profile }) {
  const initials = profile.display_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.avatarWrapper}>
      {profile.avatar_url ? (
        <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
      )}
    </View>
  );
}

const BASE_WIDTH = 390;

export function CalendarRequestCard({
  request,
  creator,
}: {
  request: CalendarRequest;
  creator: Profile;
}) {
  const { width } = useWindowDimensions();
  const scale = Math.max(320, Math.min(430, width)) / BASE_WIDTH;
  const status = getStatusMeta(request.status);
  const days = getDaysBetween(request.start_range, request.end_range);
  const minHours = request.min_hours ?? 0;
  const minLabel =
    minHours < 1
      ? `${Math.round(minHours * 60)}m`
      : minHours < 24
        ? `${minHours % 1 === 0 ? minHours : minHours.toFixed(1)}h`
        : `${(minHours / 24) % 1 === 0 ? minHours / 24 : (minHours / 24).toFixed(1)}d`;

  return (
    <View style={styles.card}>
      <View style={styles.accentBar} />
      <View style={styles.header}>
        <Avatar profile={creator} />
        <View style={styles.creatorInfo}>
          <View style={styles.titleRow}>
            {request.title ? (
              <Text style={styles.title} numberOfLines={1}>
                {request.title}
              </Text>
            ) : (
              <Text style={styles.titleEmpty}>Untitled Request</Text>
            )}
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <View
                style={[styles.statusDot, { backgroundColor: status.color }]}
              />
              <Text style={[styles.statusText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
          </View>
          <Text style={styles.creatorName}>{creator.display_name}</Text>
          <View style={styles.metaRow}>
            <Ionicons
              name="calendar-outline"
              size={Math.round(11 * scale)}
              color={BLUE}
            />
            <Text
              style={[styles.metaText, { fontSize: Math.round(11 * scale) }]}
              numberOfLines={1}
            >
              {toLocalDateFormatted(request.start_range)}
              <Text style={styles.metaSep}> → </Text>
              {toLocalDateFormatted(request.end_range)}
              <Text style={styles.metaMuted}> · {days}d</Text>
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons
              name="time-outline"
              size={Math.round(11 * scale)}
              color={BLUE}
            />
            <Text
              style={[styles.metaText, { fontSize: Math.round(11 * scale) }]}
              numberOfLines={1}
            >
              {fmtHour(request.lower_hour)}
              <Text style={styles.metaSep}> – </Text>
              {fmtHour(request.upper_hour)}
              <Text style={styles.metaMuted}> · min {minLabel}</Text>
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function fmtHour(h: number) {
  return new Date(2000, 0, 1, h === 24 ? 0 : h).toLocaleTimeString([], {
    hour: "numeric",
    hour12: true,
  });
}

const BG_CARD = "#0D1117";
const BORDER = "#21262D";
const TEXT_PRIMARY = "#C9D1D9";
const TEXT_SECONDARY = "#afb8c2";
const TEXT_MUTED = "#484F58";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D1117",
    padding: 16,
  },
  empty: {
    color: TEXT_SECONDARY,
    textAlign: "center",
    margin: 4,
    marginBottom: 8,
  },

  // Skeletons
  skeletonCard: {
    height: 90,
    borderRadius: 12,
    backgroundColor: "#161B22",
    borderWidth: 1,
    borderColor: BORDER,
    marginVertical: 8,
  },
  skeletonCalendar: {
    height: 320,
    borderRadius: 12,
    backgroundColor: "#161B22",
    borderWidth: 1,
    borderColor: BORDER,
    marginVertical: 8,
  },
  skeletonRow: {
    height: 16,
    borderRadius: 8,
    backgroundColor: "#161B22",
    marginVertical: 6,
    width: "90%",
  },

  card: {
    backgroundColor: BG_CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  accentBar: { height: 3, backgroundColor: BLUE, width: "100%" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  avatarWrapper: { position: "relative" },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: BLUE,
  },
  avatarFallback: {
    backgroundColor: "#1C2B3A",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: BLUE,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  creatorInfo: { flex: 1, gap: 2 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.1,
    flex: 1,
    marginRight: 8,
  },
  titleEmpty: {
    color: TEXT_MUTED,
    fontSize: 13,
    fontStyle: "italic",
    flex: 1,
    marginRight: 8,
  },
  creatorName: {
    color: "#9aa6b4",
    fontSize: 11,
    fontStyle: "italic",
    marginBottom: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { color: TEXT_SECONDARY, flexShrink: 1 },
  metaSep: { color: BLUE, fontWeight: "700" },
  metaMuted: { color: TEXT_MUTED },
});
