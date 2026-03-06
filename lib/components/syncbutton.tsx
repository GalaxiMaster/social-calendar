import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity } from "react-native";

type SyncButtonProps = {
  onPress: () => void;
  syncing: boolean;
};

export function SyncButton({ onPress, syncing }: SyncButtonProps) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (syncing) {
      loopRef.current = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      spinAnim.setValue(0);
    }
  }, [syncing]);

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <TouchableOpacity
      style={[styles.syncBtn, syncing && styles.syncBtnActive]}
      onPress={onPress}
      disabled={syncing}
      activeOpacity={0.7}
    >
      <Animated.Text style={[styles.syncIcon, { transform: [{ rotate }] }]}>
        ⟳
      </Animated.Text>
      <Text style={[styles.syncBtnText, syncing && styles.syncBtnTextMuted]}>
        {syncing ? "Syncing…" : "Sync"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  syncBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(31, 111, 235, 0.12)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(31, 111, 235, 0.35)",
    borderRadius: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  syncBtnActive: {
    backgroundColor: "rgba(31, 111, 235, 0.06)",
    borderColor: "rgba(31, 111, 235, 0.15)",
  },
  syncIcon: {
    color: "#1F6FEB",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 17,
  },
  syncBtnText: {
    color: "#1F6FEB",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  syncBtnTextMuted: {
    color: "rgba(31, 111, 235, 0.45)",
  },
});
