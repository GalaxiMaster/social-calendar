import { Ionicons } from "@expo/vector-icons";
import { Link, usePathname } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

const navItems = [
  { href: "/friends", label: "Friends", icon: "people-outline" },
  { href: "/calendar", label: "Calendar", icon: "calendar-outline" },
  { href: "/profile", label: "Profile", icon: "person-outline" },
] as const;

function SidebarLink({
  href,
  icon,
  label,
  isActive,
}: {
  href: string;
  icon: string;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link key={href} href={href as any} style={styles.link}>
      <View style={styles.linkInner}>
        <Ionicons
          name={icon as any}
          size={24}
          color={isActive ? "#007AFF" : "#888"}
        />
        <Text style={[styles.linkText, isActive && styles.linkTextActive]}>
          {label}
        </Text>
      </View>
    </Link>
  );
}

export default function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <View style={styles.sidebar}>
      <View style={{ flex: 1 }}>
        {navItems.map(({ href, label, icon }) => (
          <SidebarLink
            key={href}
            href={href}
            icon={icon}
            label={label}
            isActive={pathname.startsWith(href)}
          />
        ))}
      </View>
      <SidebarLink
        href="/settings"
        icon="settings-outline"
        label="Settings"
        isActive={pathname.startsWith("/settings")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 200,
    backgroundColor: "#121212",
    borderRightWidth: 1,
    paddingVertical: 12,
  },
  link: {
    height: 60,
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
