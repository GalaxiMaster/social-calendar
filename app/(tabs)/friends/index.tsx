import { useUserId } from "@/lib/databaseQueries";
import { useFriends } from "@/lib/friends/useFriends";
import { Friend } from "@/lib/models";
import { Avatar } from "@/lib/widgets/avatar";
import { router } from "expo-router";
import React, { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

function FriendCard({ item }: { item: Friend }) {
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Pressable
          style={({ pressed }) => [
            styles.cardMainPressable,
            pressed && { opacity: 0.6 },
          ]}
          onPress={() => {
            router.push({
              pathname: "/friends/shared_calendar",
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
              {lastSynced ? `Last synced: ${lastSynced}` : "Never synced"}
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

export default function FriendsScreen() {
  const userId = useUserId();

  const {
    data: friends,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useFriends(userId);

  return (
    <View style={styles.root}>
      {isError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>
            {(error as Error)?.message ?? "Something went wrong"}
          </Text>
        </View>
      ) : null}

      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          isLoading ? null : ( // don't show "No friends" while loading
            <View style={styles.emptyContainer}>
              <View style={styles.emptyDot} />
              <Text style={styles.emptyText}>No friends yet</Text>
            </View>
          )
        }
        renderItem={({ item }) => <FriendCard item={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

// Styles
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
