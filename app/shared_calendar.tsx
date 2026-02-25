import { Stack, useLocalSearchParams } from "expo-router";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { CalendarRequest, Profile } from "@/lib/models";
import InfiniteCalendar from "@/lib/scrollableCalendar";
import { supabase } from "@/lib/supabase";
import {
  generateBoundaryBusy,
  getBusySlots,
  invertBusyToAvailability,
  toLocalDateFormatted,
} from "@/lib/utils";
import { CreateGroupRequestModal } from "@/lib/widgets/createRequestModal";
import { SyncButton } from "@/lib/widgets/syncbutton";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { AvailabilitiesSection } from "./(tabs)/calendar";

export type TimeSlot = {
  id: string;
  start: Date;
  end: Date;
};

export default function SharedCalendarScreen() {
  const { groupKey } = useLocalSearchParams<{
    groupKey?: string;
  }>();

  const [busyDates, setBusyDates] = useState<Record<string, TimeSlot[]>>({});
  const [request, setRequest] = useState<CalendarRequest | null>(null);
  const [creator, setCreator] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    setLoading(true);

    let requestLoaded = false;
    let membersLoaded = false;

    const maybeStopLoading = () => {
      if (requestLoaded && membersLoaded) {
        setLoading(false);
      }
    };

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
          maybeStopLoading();
        },
      )
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const { data } = await supabase
            .from("calendar_requests")
            .select(`*, profiles(id, display_name, avatar_url)`)
            .eq("group_key", groupKey)
            .in("status", ["pending", "accepted"])
            .single();

          if (data) {
            const { profiles, ...requestData } = data;
            setRequest(requestData);
            setCreator(profiles);
          }

          requestLoaded = true;
          maybeStopLoading();
        }
      });

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
          const parsed = (newRow.synced_data || []).map((slot: any) => ({
            ...slot,
            start: new Date(slot.start),
            end: new Date(slot.end),
          }));

          setBusyDates((prev) => ({
            ...prev,
            [newRow.user_id]: parsed,
          }));
          maybeStopLoading();
        },
      )
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const { data } = await supabase
            .from("group_members")
            .select(`user_id, synced_data`)
            .eq("group_key", groupKey);

          if (data) {
            const map = Object.fromEntries(
              data.map((row) => [
                row.user_id,
                (row.synced_data || []).map((slot: any) => ({
                  ...slot,
                  start: new Date(slot.start),
                  end: new Date(slot.end),
                })),
              ]),
            );

            setBusyDates(map);
          }

          membersLoaded = true;
          maybeStopLoading();
        }
      });

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
                  true,
                );
                const { data: req, error: err } = await supabase
                  .from("group_members")
                  .update({ synced_data: busyData })
                  .eq("user_id", user!.id)
                  .eq("group_key", groupKey)
                  .select();
                console.log("Sync result:", req, err);
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
            <Text style={styles.empty}>Loading request...</Text>
          ) : (
            <Text style={styles.empty}>No request available.</Text>
          )}
          <CreateGroupRequestModal
            groupKey={groupKey!}
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            onSuccess={(request) => {
              console.log("Created!", request);
              // do whatever you want with the new request
            }}
          />
          <Pressable
            style={({ pressed }) => [
              styles.createButton,
              pressed && styles.createButtonPressed,
            ]}
            onPress={async () => {
              setModalVisible(true);
            }}
          >
            <Ionicons name="add-circle" size={20} color={BLUE} />
            <Text style={styles.createButtonText}>Create Request</Text>
          </Pressable>

          <CalendarElements busyDates={busyDates} request={request} />
        </View>
      </Animated.ScrollView>
    </>
  );
}

type CalendarElementsProps = {
  busyDates: Record<string, TimeSlot[]>;
  request: CalendarRequest | null;
};

function CalendarElements({ busyDates, request }: CalendarElementsProps) {
  const flatBusyDates = Object.values(busyDates).flat();
  const hasBusyDates = flatBusyDates.length > 0;

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

  const availabilities =
    invertBusyToAvailability(
      [
        ...flatBusyDates,
        ...generateBoundaryBusy(
          [request.lower_hour, request.upper_hour],
          start,
          end,
        ),
      ],
      start,
      end,
    ) || [];

  return (
    <>
      <InfiniteCalendar
        availabilities={[
          ...flatBusyDates,
          ...generateBoundaryBusy(
            [request.lower_hour, request.upper_hour],
            start,
            end,
          ),
        ]}
        startHour={request.lower_hour}
        endHour={request.upper_hour}
        onSlotPress={() => {}}
      />
      <AvailabilitiesSection
        availabilities={availabilities}
        request={request}
      />
    </>
  );
}

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
// Components
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

export function CalendarRequestCard({
  request,
  creator,
}: {
  request: CalendarRequest;
  creator: Profile;
}) {
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
          {/* Title + status badge */}
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

          {/* Creator name */}
          <Text style={styles.creatorName}>{creator.display_name}</Text>

          {/* Date range */}
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={11} color={BLUE} />
            <Text style={styles.metaText}>
              {toLocalDateFormatted(request.start_range)}
              <Text style={styles.metaSep}> → </Text>
              {toLocalDateFormatted(request.end_range)}
              <Text style={styles.metaMuted}> · {days}d</Text>
            </Text>
          </View>

          {/* Hour bounds + min duration */}
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={11} color={BLUE} />
            <Text style={styles.metaText}>
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

/** Safe hour formatter — h=24 is midnight end-of-day. */
function fmtHour(h: number) {
  return new Date(2000, 0, 1, h === 24 ? 0 : h).toLocaleTimeString([], {
    hour: "numeric",
    hour12: true,
  });
}

const BLUE = "#4DA8E3";
const BG_CARD = "#0D1117";
const BG_SURFACE = "#161B22";
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

  accentBar: {
    height: 3,
    backgroundColor: BLUE,
    width: "100%",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  avatarWrapper: {
    position: "relative",
  },
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
  creatorInfo: {
    flex: 1,
    gap: 2,
  },
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
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  // Meta rows (date + time)
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    color: TEXT_SECONDARY,
  },
  metaSep: {
    color: BLUE,
    fontWeight: "700",
  },
  metaMuted: {
    color: TEXT_SECONDARY,
    fontSize: 13,
  },

  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BG_SURFACE,
    borderWidth: 0.5,
    borderColor: BLUE,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 16,
    gap: 8,
  },
  createButtonPressed: {
    opacity: 0.7,
    backgroundColor: "rgba(77, 168, 227, 0.1)",
  },
  createButtonText: {
    color: BLUE,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
