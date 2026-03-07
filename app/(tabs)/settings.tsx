import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

const BLUE = "#4DA8E3";
const BG_CARD = "#0D1117";
const BG_SECTION = "#161B22";
const BORDER = "#21262D";
const TEXT_PRIMARY = "#C9D1D9";
const TEXT_SECONDARY = "#afb8c2";
const TEXT_MUTED = "#484F58";
const GREEN = "#3FB950";
const ORANGE = "#E3A940";

function SegmentToggle({
  options,
  value,
  onChange,
}: {
  options: [string, string];
  value: 0 | 1;
  onChange: (v: 0 | 1) => void;
}) {
  return (
    <View style={seg.track}>
      {options.map((label, i) => {
        const active = value === i;
        return (
          <Pressable
            key={label}
            style={[seg.option, active && seg.active]}
            onPress={() => onChange(i as 0 | 1)}
          >
            <Text style={[seg.label, active && seg.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const seg = StyleSheet.create({
  track: {
    flexDirection: "row",
    backgroundColor: "#0D1117",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  active: {
    backgroundColor: "#21262D",
  },
  label: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontWeight: "500",
  },
  labelActive: {
    color: TEXT_PRIMARY,
  },
});

function SettingToggleRow({
  icon,
  label,
  description,
  value,
  onChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={16} color={BLUE} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description && <Text style={styles.rowDesc}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#21262D", true: "rgba(77,168,227,0.35)" }}
        thumbColor={value ? BLUE : "#484F58"}
        ios_backgroundColor="#21262D"
      />
    </View>
  );
}

function SettingSegmentRow({
  icon,
  label,
  description,
  options,
  value,
  onChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  options: [string, string];
  value: 0 | 1;
  onChange: (v: 0 | 1) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={16} color={BLUE} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description && <Text style={styles.rowDesc}>{description}</Text>}
      </View>
      <SegmentToggle options={options} value={value} onChange={onChange} />
    </View>
  );
}

function SettingActionRow({
  icon,
  label,
  description,
  actionLabel,
  actionColor,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  actionLabel: string;
  actionColor?: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={16} color={BLUE} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description && <Text style={styles.rowDesc}>{description}</Text>}
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.actionBtn,
          { borderColor: actionColor ?? BLUE, opacity: pressed ? 0.7 : 1 },
        ]}
        onPress={onPress}
      >
        <Text style={[styles.actionBtnText, { color: actionColor ?? BLUE }]}>
          {actionLabel}
        </Text>
      </Pressable>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

export default function SettingsScreen() {
  const { width } = useWindowDimensions();
  const isWide = width > 600;

  // Calendar
  const [calendarProvider, setCalendarProvider] = useState<0 | 1>(0); // 0=Google, 1=Native
  const [showDeclined, setShowDeclined] = useState(false);
  const [showAllDay, setShowAllDay] = useState(true);
  const [use24h, setUse24h] = useState(false);
  const [birthdays, setBirthdays] = useState(true);

  // Availability
  const [bufferTime, setBufferTime] = useState(true);

  // Notifications
  const [requestAlerts, setRequestAlerts] = useState(true);

  // Privacy
  const [shareExactTimes, setShareExactTimes] = useState<0 | 1>(0); // 0=Exact, 1=Approximate
  const [showEventTitles, setShowEventTitles] = useState(true);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Settings",
          headerBackTitle: "Back",
          headerShown: true,
        }}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, isWide && styles.contentWide]}
      >
        <Section title="Calendar">
          <SettingSegmentRow
            icon="calendar-outline"
            label="Provider"
            description="Where to read your events from"
            options={["Google", "Native"]}
            value={calendarProvider}
            onChange={setCalendarProvider}
          />
          <Divider />
          <SettingToggleRow
            icon="close-circle-outline"
            label="Show Declined Events"
            description="Include events you've declined"
            value={showDeclined}
            onChange={setShowDeclined}
          />
          <Divider />
          <SettingToggleRow
            icon="sunny-outline"
            label="All-Day Events"
            description="Count all-day events as busy"
            value={showAllDay}
            onChange={setShowAllDay}
          />
          <Divider />
          <SettingToggleRow
            icon="gift"
            label="Birthdays"
            description="Count birthday events as busy (Only works with google calendar)"
            value={showAllDay}
            onChange={setShowAllDay}
          />
          <Divider />
          <SettingSegmentRow
            icon="time-outline"
            label="Time Format"
            options={["12h", "24h"]}
            value={use24h ? 1 : 0}
            onChange={(v) => setUse24h(v === 1)}
          />
        </Section>

        <Section title="Availability">
          <SettingToggleRow
            icon="shield-checkmark-outline"
            label="Buffer Time"
            description="Add 15 min padding around events"
            value={bufferTime}
            onChange={setBufferTime}
          />
        </Section>

        <Section title="Notifications">
          <SettingToggleRow
            icon="notifications-outline"
            label="Request Alerts"
            description="Notify when someone sends a request"
            value={requestAlerts}
            onChange={setRequestAlerts}
          />
        </Section>

        <Section title="Privacy">
          <SettingSegmentRow
            icon="eye-outline"
            label="Shared Times"
            description="How your availability appears to others"
            options={["Exact", "Approx"]}
            value={shareExactTimes}
            onChange={setShareExactTimes}
          />
          <Divider />
          <SettingToggleRow
            icon="pricetag-outline"
            label="Show Event Titles"
            description="Let group members see event names when the request includes them"
            value={showEventTitles}
            onChange={setShowEventTitles}
          />
        </Section>

        <Section title="Account">
          <SettingActionRow
            icon="log-out-outline"
            label="Sign Out"
            description="You'll need to sign in again"
            actionLabel="Sign Out"
            actionColor={ORANGE}
            onPress={() => {}}
          />
          <Divider />
          <SettingActionRow
            icon="trash-outline"
            label="Delete Account"
            description="Permanently remove your data"
            actionLabel="Delete"
            actionColor="#E35E5E"
            onPress={() => {}}
          />
        </Section>

        <Text style={styles.version}>v1.0.0 · Made with ♥</Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#0D1117",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  contentWide: {
    maxWidth: 560,
    alignSelf: "center",
    width: "100%",
  },

  // Profile
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BG_CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    marginBottom: 20,
    gap: 12,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(77,168,227,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(77,168,227,0.25)",
  },
  profileName: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: "600",
  },
  profileSub: {
    color: TEXT_MUTED,
    fontSize: 11,
    marginTop: 1,
  },

  // Section
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: TEXT_MUTED,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 6,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: BG_CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 12,
  },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: "rgba(77,168,227,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
    gap: 1,
  },
  rowLabel: {
    color: TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: "500",
  },
  rowDesc: {
    color: TEXT_MUTED,
    fontSize: 11,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginLeft: 54,
  },

  // Action button
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BLUE,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },

  version: {
    color: TEXT_MUTED,
    fontSize: 11,
    textAlign: "center",
    marginTop: 8,
  },
});
