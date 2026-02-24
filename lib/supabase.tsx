import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

export const supabase = createClient(
  "https://blbmnpjgpqdnlmrirrch.supabase.co",
  "sb_publishable_2LRP8rWN2yhywKQBdxHnYg_tZb0mD8Q",
  {
    auth: {
      storage: Platform.OS !== "web" ? AsyncStorage : undefined,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
