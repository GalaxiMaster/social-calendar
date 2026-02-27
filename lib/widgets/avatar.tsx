import { useState } from "react";
import {
    Image,
    StyleSheet,
    Text,
    View
} from "react-native";

export function Avatar({
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

// Helpers
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const styles = StyleSheet.create({
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
});
