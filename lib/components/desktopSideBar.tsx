import { Ionicons } from "@expo/vector-icons";
import { Link, usePathname } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

const navItems = [
  { href: "/friends", label: "Friends", icon: "people-outline" },
  { href: "/calendar", label: "Calendar", icon: "calendar-outline" },
  { href: "/profile", label: "Profile", icon: "person-outline" },
] as const;

export default function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <View style={styles.sidebar}>
      {navItems.map(({ href, label, icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link key={href} href={href} style={styles.link}>
            <View style={styles.linkInner}>
              <Ionicons
                name={icon}
                size={24}
                color={isActive ? "#007AFF" : "#888"}
              />
              <Text
                style={[styles.linkText, isActive && styles.linkTextActive]}
              >
                {label}
              </Text>
            </View>
          </Link>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 200,
    backgroundColor: "#121212", // matches mobile tab bar
    borderRightWidth: 1,
    // borderRightColor: "#e0e0e0", // mirrors borderTopColor on mobile
    paddingVertical: 12,
  },
  link: {
    height: 60, // matches mobile tab bar height per item
    justifyContent: "center",
  },
  linkInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
  },
  linkText: {
    fontSize: 16,
    color: "#888",
  },
  linkTextActive: {
    color: "#007AFF",
    fontWeight: "bold",
  },
});
