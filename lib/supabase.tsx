import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

export const supabase = createClient(
  "https://kcjpxxtlbqopyccgsfxi.supabase.co",
  "sb_publishable_PgecI0IuTE-VbdLLgFr8JQ_6AfHAXc1",
  {
    auth: {
      storage: Platform.OS !== "web" ? AsyncStorage : undefined,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  },
);
