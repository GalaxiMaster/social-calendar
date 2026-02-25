import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function HourPicker({
  value,
  onChange,
  minHour = 0,
  maxHour = 24,
  onClose,
}: {
  value: number;
  onChange: (h: number) => void;
  minHour?: number;
  maxHour?: number;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const canDec = value > minHour;
  const canInc = value < maxHour;

  function dec() {
    if (canDec) onChange(value - 1);
  }
  function inc() {
    if (canInc) onChange(value + 1);
  }

  const amHours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter(
    (h) => h >= minHour && h <= maxHour,
  );
  const pmHours = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].filter(
    (h) => h >= minHour && h <= maxHour,
  );

  return (
    <View style={styles.hourPickerContainer}>
      {/* Stepper row */}
      <View style={styles.stepperRow}>
        <Pressable
          style={({ pressed }) => [
            styles.stepBtn,
            !canDec && styles.stepBtnDisabled,
            pressed && canDec && styles.stepBtnPressed,
          ]}
          onPress={dec}
          disabled={!canDec}
        >
          <Ionicons
            name="remove"
            size={18}
            color={canDec ? TEXT_PRIMARY : TEXT_MUTED}
          />
        </Pressable>

        <Pressable
          style={styles.stepperValue}
          onPress={() => setExpanded((e) => !e)}
        >
          <Text style={styles.stepperValueText}>{fmtHour(value)}</Text>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={12}
            color={TEXT_MUTED}
            style={{ marginTop: 2 }}
          />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.stepBtn,
            !canInc && styles.stepBtnDisabled,
            pressed && canInc && styles.stepBtnPressed,
          ]}
          onPress={inc}
          disabled={!canInc}
        >
          <Ionicons
            name="add"
            size={18}
            color={canInc ? TEXT_PRIMARY : TEXT_MUTED}
          />
        </Pressable>

        <Pressable onPress={onClose} style={styles.stepperClose}>
          <Ionicons name="checkmark" size={16} color={BLUE} />
        </Pressable>
      </View>

      {/* Expandable quick-select grid: AM left, PM right */}
      {expanded && (amHours.length > 0 || pmHours.length > 0) && (
        <View style={styles.hourColumns}>
          <View style={styles.hourColumn}>
            <Text style={styles.hourColumnLabel}>AM</Text>
            {amHours.map((h) => (
              <Pressable
                key={h}
                style={({ pressed }) => [
                  styles.hourRow,
                  h === value && styles.hourRowActive,
                  pressed && h !== value && styles.hourRowPressed,
                ]}
                onPress={() => {
                  onChange(h);
                  setExpanded(false);
                }}
              >
                <Text
                  style={[
                    styles.hourRowText,
                    h === value && styles.hourRowTextActive,
                  ]}
                >
                  {fmtHour(h)}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.hourColumnDivider} />
          <View style={styles.hourColumn}>
            <Text style={styles.hourColumnLabel}>PM</Text>
            {pmHours.map((h) => (
              <Pressable
                key={h}
                style={({ pressed }) => [
                  styles.hourRow,
                  h === value && styles.hourRowActive,
                  pressed && h !== value && styles.hourRowPressed,
                ]}
                onPress={() => {
                  onChange(h);
                  setExpanded(false);
                }}
              >
                <Text
                  style={[
                    styles.hourRowText,
                    h === value && styles.hourRowTextActive,
                  ]}
                >
                  {fmtHour(h)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// Duration dialer
function digitsToHours(digits: string): number {
  const d = parseInt(digits.slice(0, 2), 10);
  const h = parseInt(digits.slice(2, 4), 10);
  const m = parseInt(digits.slice(4, 6), 10);
  return d * 24 + h + m / 60;
}

function hoursToDigits(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const m = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const h = totalHours % 24;
  const d = Math.floor(totalHours / 24);
  return (
    String(Math.min(d, 99)).padStart(2, "0") +
    String(h).padStart(2, "0") +
    String(m).padStart(2, "0")
  );
}

type DurationPreset = { label: string; hours: number };
const DURATION_PRESETS: DurationPreset[] = [
  { label: "15m", hours: 0.25 },
  { label: "30m", hours: 0.5 },
  { label: "1h", hours: 1 },
  { label: "2h", hours: 2 },
  { label: "4h", hours: 4 },
  { label: "8h", hours: 8 },
  { label: "12h", hours: 12 },
  { label: "1d", hours: 24 },
  { label: "2d", hours: 48 },
  { label: "3d", hours: 72 },
];

function DurationDialer({
  hours,
  onChange,
}: {
  hours: number;
  onChange: (h: number) => void;
}) {
  const [digits, setDigits] = useState(() => hoursToDigits(hours));
  const [focused, setFocused] = useState(false);

  function pushDigit(d: string) {
    const next = (digits + d).slice(-6);
    setDigits(next);
    onChange(digitsToHours(next));
  }

  function popDigit() {
    const next = ("0" + digits).slice(0, 6);
    setDigits(next);
    onChange(digitsToHours(next));
  }

  function applyPreset(h: number) {
    const d = hoursToDigits(h);
    setDigits(d);
    onChange(h);
  }

  const seg = {
    d: digits.slice(0, 2),
    h: digits.slice(2, 4),
    m: digits.slice(4, 6),
  };
  const isEmpty = digits === "000000";

  return (
    <View>
      <Pressable
        style={[styles.dialerDisplay, focused && styles.dialerDisplayFocused]}
        onPress={() => setFocused(true)}
      >
        {(["d", "h", "m"] as const).map((unit, i) => (
          <View
            key={unit}
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            {i > 0 && <Text style={styles.dialerSep}>:</Text>}
            <View style={styles.dialerSegment}>
              <Text
                style={[styles.dialerValue, isEmpty && styles.dialerValueMuted]}
              >
                {seg[unit]}
              </Text>
              <Text style={styles.dialerUnit}>{unit}</Text>
            </View>
          </View>
        ))}
        {focused && <View style={styles.dialerCursor} />}
        <Pressable
          style={({ pressed }) => [
            styles.backspaceBtn,
            pressed && { opacity: 0.5 },
          ]}
          onPress={popDigit}
        >
          <Ionicons name="backspace-outline" size={18} color={TEXT_MUTED} />
        </Pressable>
      </Pressable>

      {focused && (
        <View style={styles.numpad}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map(
            (key, i) => {
              if (key === "")
                return <View key={i} style={styles.numpadEmpty} />;
              const isBack = key === "⌫";
              return (
                <Pressable
                  key={i}
                  style={({ pressed }) => [
                    styles.numpadKey,
                    isBack && styles.numpadBackKey,
                    pressed && styles.numpadKeyPressed,
                  ]}
                  onPress={() => (isBack ? popDigit() : pushDigit(key))}
                >
                  {isBack ? (
                    <Ionicons
                      name="backspace-outline"
                      size={18}
                      color={TEXT_SECONDARY}
                    />
                  ) : (
                    <Text style={styles.numpadKeyText}>{key}</Text>
                  )}
                </Pressable>
              );
            },
          )}
          <Pressable
            style={styles.numpadDone}
            onPress={() => setFocused(false)}
          >
            <Text style={styles.numpadDoneText}>Done</Text>
          </Pressable>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {DURATION_PRESETS.map((preset) => {
          const active = Math.abs(hours - preset.hours) < 0.01;
          return (
            <Pressable
              key={preset.label}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && !active && styles.chipPressed,
              ]}
              onPress={() => applyPreset(preset.hours)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {preset.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// Preview card
function PreviewCard({
  title,
  startRange,
  endRange,
  lowerHour,
  upperHour,
  minHours,
}: {
  title: string;
  startRange: Date;
  endRange: Date;
  lowerHour: number;
  upperHour: number;
  minHours: number;
}) {
  const days = Math.ceil(
    (endRange.getTime() - startRange.getTime()) / (1000 * 60 * 60 * 24),
  );
  const minLabel =
    minHours < 1
      ? `${Math.round(minHours * 60)}m`
      : minHours < 24
        ? `${minHours % 1 === 0 ? minHours : minHours.toFixed(1)}h`
        : `${(minHours / 24) % 1 === 0 ? minHours / 24 : (minHours / 24).toFixed(1)}d`;

  return (
    <View style={styles.previewCard}>
      <View style={styles.previewAccent} />
      <View style={styles.previewBody}>
        <View style={styles.previewRow}>
          <Text style={styles.previewTitle} numberOfLines={1}>
            {title || <Text style={styles.previewTitleEmpty}>Untitled</Text>}
          </Text>
          <View style={styles.previewBadge}>
            <View style={styles.previewBadgeDot} />
            <Text style={styles.previewBadgeText}>Preview</Text>
          </View>
        </View>
        <View style={styles.previewMeta}>
          <View style={styles.previewMetaItem}>
            <Ionicons name="calendar-outline" size={11} color={BLUE} />
            <Text style={styles.previewMetaText}>
              {formatDate(startRange)}
              <Text style={styles.previewMetaSep}> → </Text>
              {formatDate(endRange)}
              <Text style={styles.previewMetaMuted}> · {days}d</Text>
            </Text>
          </View>
          <View style={styles.previewMetaItem}>
            <Ionicons name="time-outline" size={11} color={BLUE} />
            <Text style={styles.previewMetaText}>
              {fmtHour(lowerHour)}
              <Text style={styles.previewMetaSep}> – </Text>
              {fmtHour(upperHour)}
              <Text style={styles.previewMetaMuted}> · min {minLabel}</Text>
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// Props
export type PickerTarget = "start" | "end" | "lowerHour" | "upperHour" | null;

interface Props {
  groupKey: string;
  visible: boolean;
  onClose: () => void;
  onSuccess?: (request: unknown) => void;
  showPicker?: PickerTarget;
  onShowPicker?: (target: PickerTarget) => void;
}

export function CreateGroupRequestModal({
  groupKey,
  visible,
  onClose,
  onSuccess,
  showPicker: externalShowPicker,
  onShowPicker,
}: Props) {
  const insets = useSafeAreaInsets();
  const now = new Date();
  const weekOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [title, setTitle] = useState("Hang out");
  const [message, setMessage] = useState("");
  const [startRange, setStartRange] = useState<Date>(now);
  const [endRange, setEndRange] = useState<Date>(weekOut);
  const [lowerHour, setLowerHourRaw] = useState(9);
  const [upperHour, setUpperHourRaw] = useState(24);
  const [minHours, setMinHours] = useState(1);

  function setLowerHour(h: number) {
    setLowerHourRaw(h);
    if (h >= upperHour) setUpperHourRaw(Math.min(h + 1, 24));
  }
  function setUpperHour(h: number) {
    setUpperHourRaw(h);
    if (h <= lowerHour) setLowerHourRaw(Math.max(h - 1, 0));
  }

  function setStartRangeGuarded(d: Date) {
    setStartRange(d);
    if (d >= endRange) {
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      setEndRange(next);
    }
  }
  function setEndRangeGuarded(d: Date) {
    setEndRange(d);
    if (d <= startRange) {
      const next = new Date(d);
      next.setDate(next.getDate() - 1);
      setStartRange(next);
    }
  }

  // Which hour picker is open inline: null | "lower" | "upper"
  const [hourPickerOpen, setHourPickerOpen] = useState<
    "lower" | "upper" | null
  >(null);

  const [localShowPicker, setLocalShowPicker] = useState<PickerTarget>(null);
  const showPicker =
    externalShowPicker !== undefined ? externalShowPicker : localShowPicker;
  const setShowPicker = onShowPicker ?? setLocalShowPicker;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (lowerHour >= upperHour) {
      setError("Earliest hour must be before latest hour.");
      return;
    }
    if (startRange >= endRange) {
      setError("Start must be before end.");
      return;
    }
    if (minHours <= 0) {
      setError("Duration must be greater than 0.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: request, error: rpcError } = await supabase
        .rpc("create_group_request", {
          p_group_key: groupKey,
          p_creator_id: user!.id,
          p_title: title,
          p_message: message,
          p_start_range: startRange.toISOString(),
          p_end_range: endRange.toISOString(),
          p_lower_hour: lowerHour,
          p_upper_hour: upperHour,
          p_min_hours: minHours,
        })
        .single();

      if (rpcError) throw rpcError;
      onSuccess?.(request);
      onClose();
    } catch (e: unknown) {
      console.log(e);
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.overlay}
        >
          <Pressable style={styles.backdrop} onPress={onClose} />

          <View style={[styles.sheet, { paddingBottom: 0 }]}>
            <View style={styles.accentBar} />

            <View style={styles.sheetHeader}>
              <View style={styles.handle} />
              <View style={styles.titleRow}>
                <Ionicons name="calendar-outline" size={16} color={BLUE} />
                <Text style={styles.heading}>New Request</Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={18} color={TEXT_MUTED} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: (insets.bottom || 16) + 16 },
              ]}
              keyboardShouldPersistTaps="handled"
            >
              <PreviewCard
                title={title}
                startRange={startRange}
                endRange={endRange}
                lowerHour={lowerHour}
                upperHour={upperHour}
                minHours={minHours}
              />

              <Field label="Title">
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Hang out"
                  placeholderTextColor={TEXT_MUTED}
                  selectionColor={BLUE}
                />
              </Field>

              <Field label="Message">
                <TextInput
                  style={[styles.input, styles.multiline]}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Optional note to your group..."
                  placeholderTextColor={TEXT_MUTED}
                  multiline
                  numberOfLines={3}
                  selectionColor={BLUE}
                />
              </Field>

              <Field label="Date Range">
                <View style={styles.row}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.pill,
                      { flex: 1, marginRight: 6 },
                      pressed && styles.pillPressed,
                    ]}
                    onPress={() => setShowPicker("start")}
                  >
                    <Text style={styles.pillLabel}>From</Text>
                    <View style={styles.pillValueRow}>
                      <Ionicons name="calendar" size={11} color={BLUE} />
                      <Text style={styles.pillValue}>
                        {formatDate(startRange)}
                      </Text>
                    </View>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.pill,
                      { flex: 1, marginLeft: 6 },
                      pressed && styles.pillPressed,
                    ]}
                    onPress={() => setShowPicker("end")}
                  >
                    <Text style={styles.pillLabel}>To</Text>
                    <View style={styles.pillValueRow}>
                      <Ionicons name="calendar" size={11} color={BLUE} />
                      <Text style={styles.pillValue}>
                        {formatDate(endRange)}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              </Field>

              <Field label="Hour Bounds">
                <View style={styles.row}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.pill,
                      { flex: 1, marginRight: 6 },
                      hourPickerOpen === "lower" && styles.pillActive,
                      pressed &&
                        hourPickerOpen !== "lower" &&
                        styles.pillPressed,
                    ]}
                    onPress={() =>
                      setHourPickerOpen(
                        hourPickerOpen === "lower" ? null : "lower",
                      )
                    }
                  >
                    <Text style={styles.pillLabel}>Earliest</Text>
                    <View style={styles.pillValueRow}>
                      <Ionicons name="time-outline" size={11} color={BLUE} />
                      <Text style={styles.pillValue}>
                        {formatHour(lowerHour)}
                      </Text>
                    </View>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.pill,
                      { flex: 1, marginLeft: 6 },
                      hourPickerOpen === "upper" && styles.pillActive,
                      pressed &&
                        hourPickerOpen !== "upper" &&
                        styles.pillPressed,
                    ]}
                    onPress={() =>
                      setHourPickerOpen(
                        hourPickerOpen === "upper" ? null : "upper",
                      )
                    }
                  >
                    <Text style={styles.pillLabel}>Latest</Text>
                    <View style={styles.pillValueRow}>
                      <Ionicons name="time-outline" size={11} color={BLUE} />
                      <Text style={styles.pillValue}>
                        {formatHour(upperHour)}
                      </Text>
                    </View>
                  </Pressable>
                </View>

                {hourPickerOpen === "lower" && (
                  <HourPicker
                    value={lowerHour}
                    maxHour={upperHour - 1}
                    onChange={setLowerHour}
                    onClose={() => setHourPickerOpen(null)}
                  />
                )}
                {hourPickerOpen === "upper" && (
                  <HourPicker
                    value={upperHour}
                    minHour={lowerHour + 1}
                    maxHour={24}
                    onChange={setUpperHour}
                    onClose={() => setHourPickerOpen(null)}
                  />
                )}
              </Field>

              <Field label="Minimum Duration">
                <DurationDialer hours={minHours} onChange={setMinHours} />
              </Field>

              {error && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={13} color={RED} />
                  <Text style={styles.error}>{error}</Text>
                </View>
              )}

              <View style={styles.actions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.cancelBtn,
                    pressed && { opacity: 0.6 },
                  ]}
                  onPress={onClose}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.submitBtn,
                    (loading || pressed) && { opacity: 0.7 },
                  ]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {!loading && (
                    <Ionicons name="add-circle" size={16} color={BG_CARD} />
                  )}
                  <Text style={styles.submitText}>
                    {loading ? "Creating..." : "Create"}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {showPicker === "start" && (
        <DateTimePicker
          {...({
            value: startRange,
            mode: "date",
            display: Platform.OS === "ios" ? "inline" : "default",
            onChange: (_e: DateTimePickerEvent, date?: Date) => {
              setShowPicker(null);
              if (date) setStartRangeGuarded(date);
            },
          } as any)}
        />
      )}
      {showPicker === "end" && (
        <DateTimePicker
          {...({
            value: endRange,
            mode: "date",
            minimumDate: startRange,
            display: Platform.OS === "ios" ? "inline" : "default",
            onChange: (_e: DateTimePickerEvent, date?: Date) => {
              setShowPicker(null);
              if (date) setEndRangeGuarded(date);
            },
          } as any)}
        />
      )}
    </>
  );
}

// Field wrapper
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

// Helpers
function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
/** Safe hour formatter — uses a fixed date so timezone offsets can't bleed in.
 *  h=24 is treated as midnight end-of-day (same display as 12 AM). */
function fmtHour(h: number) {
  return new Date(2000, 0, 1, h === 24 ? 0 : h).toLocaleTimeString([], {
    hour: "numeric",
    hour12: true,
  });
}
function formatHour(h: number) {
  return fmtHour(h);
}

// Design tokens
const BLUE = "#4DA8E3";
const RED = "#E35E5E";
const BG_CARD = "#0D1117";
const BG_SURFACE = "#161B22";
const BG_INPUT = "#0D1117";
const BORDER = "#21262D";
const TEXT_PRIMARY = "#C9D1D9";
const TEXT_SECONDARY = "#afb8c2";
const TEXT_MUTED = "#484F58";

// Styles
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    backgroundColor: BG_SURFACE,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    borderBottomWidth: 0,
    maxHeight: "92%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
  },
  accentBar: { height: 3, backgroundColor: BLUE },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  handle: {
    position: "absolute",
    top: -20,
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: BORDER,
  },
  titleRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 7 },
  heading: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT_PRIMARY,
    letterSpacing: 0.2,
  },
  closeBtn: { padding: 4 },
  scrollContent: { padding: 16, paddingBottom: 16 },

  // Preview
  previewCard: {
    flexDirection: "row",
    backgroundColor: BG_CARD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    marginBottom: 20,
  },
  previewAccent: { width: 3, backgroundColor: BLUE },
  previewBody: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: TEXT_PRIMARY,
    flex: 1,
    marginRight: 8,
  },
  previewTitleEmpty: {
    color: TEXT_MUTED,
    fontStyle: "italic",
    fontWeight: "400",
  },
  previewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(77,168,227,0.1)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  previewBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: BLUE,
  },
  previewBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: BLUE,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  previewMeta: { gap: 3 },
  previewMetaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  previewMetaText: { fontSize: 11, color: TEXT_SECONDARY },
  previewMetaSep: { color: BLUE, fontWeight: "700" },
  previewMetaMuted: { color: TEXT_MUTED },

  field: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: TEXT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: BG_INPUT,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: TEXT_PRIMARY,
  },
  multiline: { height: 72, textAlignVertical: "top", paddingTop: 9 },
  row: { flexDirection: "row" },
  pill: {
    backgroundColor: BG_INPUT,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  pillActive: { borderColor: BLUE, backgroundColor: "rgba(77,168,227,0.08)" },
  pillPressed: { borderColor: BLUE, backgroundColor: "rgba(77,168,227,0.06)" },
  pillLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: TEXT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  pillValueRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  pillValue: { fontSize: 13, color: TEXT_SECONDARY, fontWeight: "500" },

  // Hour picker — stepper
  hourPickerContainer: {
    marginTop: 8,
    backgroundColor: BG_CARD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BG_INPUT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  stepBtnDisabled: { opacity: 0.3 },
  stepBtnPressed: {
    borderColor: BLUE,
    backgroundColor: "rgba(77,168,227,0.1)",
  },
  stepperValue: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
  },
  stepperValueText: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT_PRIMARY,
    letterSpacing: 0.3,
  },
  stepperClose: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(77,168,227,0.1)",
    borderWidth: 1,
    borderColor: BLUE,
  },
  hourColumns: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  hourColumn: { flex: 1, gap: 2 },
  hourColumnDivider: { width: 1, backgroundColor: BORDER, marginHorizontal: 6 },
  hourColumnLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: TEXT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
    paddingVertical: 4,
  },
  hourRow: {
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignItems: "center",
  },
  hourRowActive: { backgroundColor: "rgba(77,168,227,0.15)" },
  hourRowPressed: { backgroundColor: "rgba(77,168,227,0.07)" },
  hourRowText: { fontSize: 13, fontWeight: "500", color: TEXT_SECONDARY },
  hourRowTextActive: { color: BLUE, fontWeight: "700" },

  // Dialer
  dialerDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BG_INPUT,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    gap: 4,
  },
  dialerDisplayFocused: {
    borderColor: BLUE,
    backgroundColor: "rgba(77,168,227,0.04)",
  },
  dialerSegment: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  dialerValue: {
    fontSize: 28,
    fontWeight: "700",
    color: TEXT_PRIMARY,
    fontVariant: ["tabular-nums"],
    letterSpacing: 1,
    minWidth: 36,
    textAlign: "center",
  },
  dialerValueMuted: { color: TEXT_MUTED },
  dialerUnit: {
    fontSize: 12,
    fontWeight: "600",
    color: TEXT_MUTED,
    marginBottom: 2,
  },
  dialerSep: {
    fontSize: 22,
    color: BORDER,
    fontWeight: "300",
    marginHorizontal: 2,
    marginBottom: 2,
  },
  dialerCursor: {
    width: 2,
    height: 28,
    backgroundColor: BLUE,
    borderRadius: 1,
    marginLeft: 2,
  },
  backspaceBtn: { marginLeft: "auto", padding: 6 },

  numpad: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  numpadKey: {
    width: "30%",
    flexGrow: 1,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: BG_INPUT,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
  },
  numpadBackKey: { backgroundColor: "transparent", borderColor: "transparent" },
  numpadKeyPressed: {
    backgroundColor: "rgba(77,168,227,0.1)",
    borderColor: BLUE,
  },
  numpadKeyText: { fontSize: 20, fontWeight: "600", color: TEXT_PRIMARY },
  numpadEmpty: { width: "30%", flexGrow: 1 },
  numpadDone: {
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "rgba(77,168,227,0.1)",
    borderWidth: 1,
    borderColor: BLUE,
    borderRadius: 10,
  },
  numpadDoneText: {
    fontSize: 14,
    fontWeight: "700",
    color: BLUE,
    letterSpacing: 0.3,
  },

  chipsRow: { gap: 6, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: BG_INPUT,
  },
  chipActive: { borderColor: BLUE, backgroundColor: "rgba(77,168,227,0.12)" },
  chipPressed: {
    backgroundColor: "rgba(77,168,227,0.06)",
    borderColor: "#2d4a5e",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: TEXT_MUTED,
    letterSpacing: 0.2,
  },
  chipTextActive: { color: BLUE },

  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 10,
  },
  error: { color: RED, fontSize: 12 },
  actions: { flexDirection: "row", gap: 10, marginTop: 6 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    backgroundColor: BG_INPUT,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT_SECONDARY,
    letterSpacing: 0.2,
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: BLUE,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  submitText: {
    fontSize: 13,
    fontWeight: "700",
    color: BG_CARD,
    letterSpacing: 0.3,
  },
});
