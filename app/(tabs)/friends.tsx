import { useFriends } from "@/lib/friends/useFriends";
import { Friend, Profile } from "@/lib/models";
import { useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function FriendsScreen() {
  const {
    getMyProfile,
    addFriendByCode,
    getFriends,
    getPendingRequests,
    acceptRequest,
    removeFriend,
    loading,
    error,
  } = useFriends();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<Friend[]>([]);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const [p, f, r] = await Promise.all([
      getMyProfile(),
      getFriends(),
      getPendingRequests(),
    ]);
    setProfile(p);
    setFriends(f);
    setPending(r);
  };

  const handleAdd = async () => {
    try {
      await addFriendByCode(code);
      setCode("");
      setMessage("Friend request sent!");
    } catch (e: any) {
      setMessage(e.message);
    }
  };

  const handleAccept = async (id: string) => {
    await acceptRequest(id);
    loadAll();
  };

  const handleRemove = async (id: string) => {
    await removeFriend(id);
    loadAll();
  };

  return (
    <View style={styles.container}>
      {/* Your code */}
      <View style={styles.myCode}>
        <Text style={styles.label}>Your friend code</Text>
        <Text style={styles.code}>{profile?.friend_code ?? "..."}</Text>
      </View>

      {/* Add friend */}
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Enter friend code"
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          maxLength={6}
          autoCapitalize="characters"
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleAdd}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
      </View>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      {/* Pending requests */}
      {pending.length > 0 && (
        <>
          <Text style={styles.section}>Pending Requests</Text>
          <FlatList
            data={pending}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.friendName}>
                  {item.display_name ?? item?.email}
                </Text>
                <TouchableOpacity onPress={() => handleAccept(item.id)}>
                  <Text style={styles.accept}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemove(item.id)}>
                  <Text style={styles.remove}>Decline</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </>
      )}

      {/* Friends list */}
      <Text style={styles.section}>Friends</Text>
      <FlatList
        data={friends}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.friendName}>
              {item.display_name ?? item.email}
            </Text>
            <TouchableOpacity onPress={() => handleRemove(item.id)}>
              <Text style={styles.remove}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No friends yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  myCode: { alignItems: "center", marginBottom: 24 },
  label: { fontSize: 12, color: "#888" },
  code: {
    fontSize: 32,
    fontWeight: "bold",
    letterSpacing: 6,
    color: "#c5c5c5",
  },
  addRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 18,
    letterSpacing: 4,
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 10,
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  message: { color: "#888", marginBottom: 16 },
  section: { fontWeight: "bold", fontSize: 16, marginTop: 24, marginBottom: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  accept: { color: "#34C759", fontWeight: "bold" },
  remove: { color: "#FF3B30", fontWeight: "bold" },
  empty: { color: "#888", textAlign: "center", marginTop: 16 },
  friendName: { color: "#fff", fontWeight: "bold" },
});
