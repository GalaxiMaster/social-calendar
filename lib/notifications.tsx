import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function registerPushToken() {
  if (!Device.isDevice) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return;

  const { data: token } = await Notifications.getExpoPushTokenAsync();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Stable identifier for this physical device
  const deviceId =
    Device.osBuildFingerprint ??
    Device.modelId ??
    Device.deviceName ??
    "unknown";

  await AsyncStorage.setItem("pushToken", token);

  await supabase.from("push_tokens").upsert(
    { user_id: user.id, token, device_id: deviceId, updated_at: new Date() },
    { onConflict: "user_id,device_id" }, // overwrites stale token on same device
  );
}
