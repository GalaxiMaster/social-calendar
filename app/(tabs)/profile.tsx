import { useUserId } from "@/lib/databaseQueries";
import {
  useAcceptRequest,
  useAddFriendByCode,
  useFriends,
  useMyProfile,
  usePendingRequests,
  useRemoveFriend,
} from "@/lib/friends/useFriends";
import { Friend } from "@/lib/models";
import { Avatar } from "@/lib/widgets/avatar";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

function Toast({
  message,
  type = "info",
}: {
  message: string;
  type?: "info" | "success" | "error";
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(1800),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [message]);

  const bg =
    type === "success" ? "#22c55e" : type === "error" ? "#ef4444" : "#3b82f6";

  return (
    <Animated.View style={[styles.toast, { backgroundColor: bg, opacity }]}>
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

// FriendRow
function FriendRow({
  item,
  onRemove,
  removeLabel = "Remove",
  onAccept,
}: {
  item: Friend;
  onRemove: (id: string) => void;
  removeLabel?: string;
  onAccept?: (id: string) => void;
}) {
  const name = item.display_name ?? item.email ?? "Unknown";
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [removing, setRemoving] = useState(false);

  const handleRemove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRemoving(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onRemove(item.id));
  };

  return (
    <Animated.View
      style={[
        styles.friendRow,
        {
          opacity: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
          }),
          transform: [
            {
              translateX: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -30],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.friendLeft}>
        <Avatar url={item.avatar_url} name={name} />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.friendName}>{name}</Text>
          {item.email && item.display_name && (
            <Text style={styles.friendEmail}>{item.email}</Text>
          )}
        </View>
      </View>
      <View style={styles.friendActions}>
        {onAccept && (
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              onAccept(item.id);
            }}
          >
            <Text style={styles.acceptBtnText}>Accept</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.removeBtn, removing && { opacity: 0.4 }]}
          onPress={handleRemove}
          disabled={removing}
        >
          <Text style={styles.removeBtnText}>{removeLabel}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// Main Screen

export default function FriendsScreen() {
  const userId = useUserId();

  const { data: profile } = useMyProfile(userId);
  const {
    data: friends = [],
    isLoading: friendsLoading,
    refetch: refetchFriends,
  } = useFriends(userId);
  const { data: pending = [], refetch: refetchPending } =
    usePendingRequests(userId);

  const addFriend = useAddFriendByCode(userId);
  const acceptRequest = useAcceptRequest(userId);
  const removeFriend = useRemoveFriend(userId);

  const [code, setCode] = useState("");
  const [toast, setToast] = useState<{
    msg: string;
    type: "info" | "success" | "error";
    key: number;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const toastKey = useRef(0);

  const showToast = (
    msg: string,
    type: "info" | "success" | "error" = "info",
  ) => {
    toastKey.current += 1;
    setToast({ msg, type, key: toastKey.current });
    setTimeout(() => setToast(null), 2400);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchFriends(), refetchPending()]);
    setRefreshing(false);
  };

  const handleCopyCode = async () => {
    if (!profile?.friend_code) return;
    await Clipboard.setStringAsync(profile.friend_code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCodeCopied(true);
    showToast("Friend code copied!", "success");
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleShareCode = async () => {
    if (!profile?.friend_code) return;
    await Share.share({
      message: `Add me on the app! My friend code is: ${profile.friend_code}`,
    });
  };

  const handleAdd = async () => {
    if (code.trim().length < 4) {
      showToast("Enter a valid friend code", "error");
      return;
    }
    Keyboard.dismiss();
    try {
      await addFriend.mutateAsync(code.trim());
      setCode("");
      showToast("Friend request sent!", "success");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      showToast(e.message ?? "Something went wrong", "error");
    }
  };

  const handleAccept = async (id: string) => {
    await acceptRequest.mutateAsync(id);
    showToast("Friend added!", "success");
  };

  const handleRemove = async (id: string) => {
    await removeFriend.mutateAsync(id);
  };

  const displayName = profile?.display_name ?? profile?.email ?? "You";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        enableOnAndroid={true}
        extraScrollHeight={20}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#94a3b8"
          />
        }
      >
        {/* ── Profile Header ── */}
        <View style={styles.profileCard}>
          <View style={styles.profileBadge}>
            {pending.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pending.length}</Text>
              </View>
            )}
            {profile ? (
              <Avatar url={profile.avatar_url} name={displayName} />
            ) : (
              <></>
            )}
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          {profile?.email && profile?.display_name && (
            <Text style={styles.profileEmail}>{profile.email}</Text>
          )}

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{friends.length}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{pending.length}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>

          {/* Friend Code */}
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>YOUR FRIEND CODE</Text>
            <Pressable onPress={handleCopyCode} style={styles.codeRow}>
              <Text style={styles.codeText}>
                {profile?.friend_code ?? "···"}
              </Text>
              <View
                style={[styles.copyPill, codeCopied && styles.copyPillDone]}
              >
                <Text style={styles.copyPillText}>
                  {codeCopied ? "Copied!" : "Copy"}
                </Text>
              </View>
            </Pressable>
            <TouchableOpacity onPress={handleShareCode} style={styles.shareBtn}>
              <Text style={styles.shareBtnText}>↑ Share your code</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Add Friend ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add a Friend</Text>
          <View style={styles.addRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="ABC123"
              placeholderTextColor="#475569"
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="send"
              onSubmitEditing={handleAdd}
              textAlign="center"
            />
            <TouchableOpacity
              style={[
                styles.addBtn,
                (addFriend.isPending || code.length < 4) &&
                  styles.addBtnDisabled,
              ]}
              onPress={handleAdd}
              disabled={addFriend.isPending || code.length < 4}
            >
              {addFriend.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.addBtnText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Pending Requests ── */}
        {pending.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Requests</Text>
              <View style={styles.pill}>
                <Text style={styles.pillText}>{pending.length}</Text>
              </View>
            </View>
            {pending.map((item) => (
              <FriendRow
                key={item.id}
                item={item}
                onRemove={handleRemove}
                removeLabel="Decline"
                onAccept={handleAccept}
              />
            ))}
          </View>
        )}

        {/* ── Friends List ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Friends
            {friends.length > 0 && (
              <Text style={styles.sectionCount}> · {friends.length}</Text>
            )}
          </Text>
          {friendsLoading && friends.length === 0 ? (
            <ActivityIndicator color="#94a3b8" style={{ marginTop: 24 }} />
          ) : friends.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.emptyTitle}>No friends yet</Text>
              <Text style={styles.emptySubtitle}>
                Share your code or enter a friend's code above to get started.
              </Text>
            </View>
          ) : (
            friends.map((item) => (
              <FriendRow
                key={item.id}
                item={item}
                onRemove={handleRemove}
                removeLabel="Remove"
              />
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </KeyboardAwareScrollView>

      {toast && <Toast key={toast.key} message={toast.msg} type={toast.type} />}
    </KeyboardAvoidingView>
  );
}

// Styles
const containerColor = "#0a0d14";
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },

  profileCard: {
    backgroundColor: containerColor,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  profileBadge: { position: "relative", marginBottom: 12 },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  profileName: {
    color: "#f1f5f9",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  profileEmail: { color: "#64748b", fontSize: 13, marginBottom: 16 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 24,
  },
  stat: { alignItems: "center" },
  statNumber: { color: "#f1f5f9", fontSize: 22, fontWeight: "700" },
  statLabel: { color: "#64748b", fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: "#1e293b" },

  codeCard: {
    backgroundColor: containerColor,
    borderRadius: 14,
    padding: 16,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  codeLabel: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  codeText: {
    color: "#7dd3fc",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 8,
    fontVariant: ["tabular-nums"],
  },
  copyPill: {
    backgroundColor: "#1e3a5f",
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  copyPillDone: { backgroundColor: "#14532d" },
  copyPillText: { color: "#7dd3fc", fontSize: 12, fontWeight: "600" },
  shareBtn: { paddingVertical: 4 },
  shareBtnText: { color: "#64748b", fontSize: 13 },

  section: { marginBottom: 8 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  sectionCount: { color: "#475569", fontWeight: "400" },
  pill: {
    backgroundColor: "#1e3a5f",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 12,
  },
  pillText: { color: "#7dd3fc", fontSize: 12, fontWeight: "700" },

  addRow: { flexDirection: "row", gap: 10 },
  input: {
    flex: 1,
    backgroundColor: containerColor,
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 8,
    color: "#f1f5f9",
  },
  addBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 72,
  },
  addBtnDisabled: { backgroundColor: "#1e2d4a", opacity: 0.6 },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  friendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: containerColor,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  friendLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  friendName: { color: "#e2e8f0", fontWeight: "600", fontSize: 15 },
  friendEmail: { color: "#475569", fontSize: 12, marginTop: 1 },
  friendActions: { flexDirection: "row", gap: 8 },
  acceptBtn: {
    backgroundColor: "#14532d",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  acceptBtnText: { color: "#4ade80", fontWeight: "700", fontSize: 13 },
  removeBtn: {
    backgroundColor: "#2d1515",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  removeBtnText: { color: "#f87171", fontWeight: "700", fontSize: 13 },

  avatar: { alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "800" },

  emptyState: {
    alignItems: "center",
    paddingVertical: 36,
    backgroundColor: "#111827",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  emptyEmoji: { fontSize: 36, marginBottom: 10 },
  emptyTitle: {
    color: "#94a3b8",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  emptySubtitle: {
    color: "#475569",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 18,
  },

  toast: {
    position: "absolute",
    bottom: 40,
    left: 24,
    right: 24,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  toastText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
