import { useFriends } from "@/lib/friends/useFriends";
import { Friend, TimeSlot } from "@/lib/models";
import { SyncButton } from "@/lib/widgets/syncbutton";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View
} from "react-native";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({
  url,
  name,
  size = 46,
}: {
  url?: string;
  name: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  if (url && !failed) {
    return (
      <Image
        source={{ uri: url }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#21262D",
        }}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatarFallback,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.avatarInitials, { fontSize: size * 0.34 }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

function OverlapPreview({ slots }: { slots: TimeSlot[] }) {
  const formatSlot = (slot: TimeSlot) => {
    const day = slot.start.toLocaleDateString("en", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const startT = slot.start.toLocaleTimeString("en", {
      hour: "numeric",
      minute: "2-digit",
    });
    const endT = slot.end.toLocaleTimeString("en", {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${day} · ${startT} – ${endT}`;
  };

  const fmtDuration = (slot: TimeSlot) => {
    const m = Math.round((slot.end.getTime() - slot.start.getTime()) / 60000);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
  };

  return (
    <View style={styles.overlapContainer}>
      <View style={styles.overlapHeader}>
        <View style={styles.overlapAccent} />
        <Text style={styles.overlapTitle}>FREE TOGETHER</Text>
        <View style={styles.overlapCountPill}>
          <Text style={styles.overlapCountText}>{slots.length}</Text>
        </View>
      </View>

      {slots.slice(0, 3).map((slot, i) => (
        <View key={i} style={styles.overlapSlot}>
          <View style={styles.overlapSlotBar} />
          <Text style={styles.overlapSlotTime} numberOfLines={1}>
            {formatSlot(slot)}
          </Text>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{fmtDuration(slot)}</Text>
          </View>
        </View>
      ))}

      {slots.length > 3 && (
        <Text style={styles.overlapMore}>+{slots.length - 3} more slots</Text>
      )}
    </View>
  );
}

function FriendCard({
  item,
  onSync,
}: {
  item: Friend;
  onSync: (friend: Friend) => Promise<TimeSlot[]>;
}) {
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [overlaps, setOverlaps] = useState<TimeSlot[]>([]);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const expandedRef = useRef(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const slots = await onSync(item);
      setOverlaps(slots);
      setLastSynced("Just now");
      // Auto-expand overlap panel on sync
      if (!expandedRef.current && slots.length > 0) expand(true);
    } catch (e: any) {
      Alert.alert("Sync failed", e.message ?? "Something went wrong");
    } finally {
      setSyncing(false);
    }
  };

  const expand = (open: boolean) => {
    expandedRef.current = open;
    Animated.spring(expandAnim, {
      toValue: open ? 1 : 0,
      useNativeDriver: false,
      speed: 18,
      bounciness: 2,
    }).start();
  };

  const overlapOpacity = expandAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 0, 1],
  });
  const overlapHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120],
  });

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        {/* Pressable content area (avatar + text) */}
        <Pressable
          style={({ pressed }) => [
            styles.cardMainPressable,
            pressed && { opacity: 0.6 },
          ]}
          onPress={() => {
            router.push({
              pathname: "/shared_calendar",
              params: { groupKey: item.id },
            });
          }}
        >
          <Avatar url={item.avatar_url} name={item.display_name} />

          <View style={styles.cardMeta}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.display_name}
            </Text>

            <Text style={styles.cardSub}>
              {lastSynced
                ? overlaps.length > 0
                  ? `${overlaps.length} overlap${
                      overlaps.length !== 1 ? "s" : ""
                    } · ${lastSynced}`
                  : `No free slots · ${lastSynced}`
                : "Never synced"}
            </Text>
          </View>
        </Pressable>

        {/* Keep sync button OUTSIDE so it has its own tap target */}
        <SyncButton syncing={syncing} onPress={handleSync} />
      </View>

      {/* Expandable overlap panel */}
      {overlaps.length > 0 && (
        <Animated.View
          style={{
            height: overlapHeight,
            opacity: overlapOpacity,
            overflow: "hidden",
          }}
        >
          <OverlapPreview slots={overlaps} />
        </Animated.View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function FriendsScreen() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { loading, error, getFriends } = useFriends();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setFriends(await getFriends());
    } catch (e) {
      console.log(e);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // ↓ Replace this stub with real calendar intersection logic
  const handleSync = async (_friend: Friend): Promise<TimeSlot[]> => {
    await new Promise((r) => setTimeout(r, 1400));
    return []; // return computed overlapping TimeSlots here
  };

  return (
    <View style={styles.root}>
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyDot} />
            <Text style={styles.emptyText}>No friends yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <FriendCard item={item} onSync={handleSync} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0D1117",
  },

  // Error
  errorBanner: {
    backgroundColor: "rgba(218, 54, 51, 0.12)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(218, 54, 51, 0.35)",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    padding: 10,
  },
  errorText: { color: "#F85149", fontSize: 13 },

  // List
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    flexGrow: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#21262D",
    marginLeft: 58,
  },

  // Card
  card: {
    paddingVertical: 10,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardMainPressable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardMeta: {
    flex: 1,
    gap: 3,
  },
  cardName: {
    color: "#E6EDF3",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  cardSub: {
    color: "#8B949E",
    fontSize: 12,
  },

  // Avatar fallback
  avatarFallback: {
    backgroundColor: "#1F3A5C",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(31, 111, 235, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: "#1F6FEB",
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Overlap panel
  overlapContainer: {
    marginTop: 10,
    marginLeft: 58,
    gap: 5,
  },
  overlapHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 3,
  },
  overlapAccent: {
    width: 3,
    height: 13,
    borderRadius: 2,
    backgroundColor: "#3FB950",
  },
  overlapTitle: {
    color: "#8B949E",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  overlapCountPill: {
    backgroundColor: "rgba(63, 185, 80, 0.12)",
    borderRadius: 8,
    minWidth: 18,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(63, 185, 80, 0.3)",
  },
  overlapCountText: {
    color: "#3FB950",
    fontSize: 10,
    fontWeight: "700",
  },
  overlapSlot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  overlapSlotBar: {
    width: 2,
    height: 20,
    borderRadius: 1,
    backgroundColor: "rgba(63, 185, 80, 0.4)",
  },
  overlapSlotTime: {
    flex: 1,
    color: "#E6EDF3",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  durationBadge: {
    backgroundColor: "#21262D",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#30363D",
  },
  durationText: {
    color: "#8B949E",
    fontSize: 11,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
  overlapMore: {
    color: "#484F58",
    fontSize: 11,
    marginLeft: 10,
    marginTop: 2,
  },

  // Add friend bar
  addBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#161B22",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#21262D",
    flexDirection: "row",
    gap: 8,
    padding: 12,
    paddingBottom: 36,
  },
  addInput: {
    flex: 1,
    backgroundColor: "#21262D",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#30363D",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#E6EDF3",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 1,
  },
  addButton: {
    backgroundColor: "#1F6FEB",
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonDisabled: {
    backgroundColor: "#21262D",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#30363D",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Empty
  emptyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 32,
    justifyContent: "center",
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
});
