// lib/stores/settingsStore.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { create } from "zustand";
import { useMyProfile } from "./friends/useFriends";
import { supabase } from "./supabase";

export function useMySettings(userId: string) {
  const { setSettings } = useSettingsStore();
  const queryClient = useQueryClient();

  const profile = useMyProfile(userId);

  useEffect(() => {
    setSettings({ ...defaultSettings, ...(profile.data?.settings ?? {}) });
  }, [profile.data?.settings]);

  const mutation = useMutation({
    mutationFn: async (patch: Partial<Settings>) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          settings: { ...defaultSettings, ...profile.data?.settings, ...patch },
        })
        .eq("id", userId);
      if (error) throw error;
    },
    onMutate: (patch: Partial<Settings>) => {
      Object.entries(patch).forEach(([key, value]) => {
        useSettingsStore
          .getState()
          .updateSetting(
            key as keyof Settings,
            value as Settings[keyof Settings],
          );
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["profile", userId] }),
  });

  return { ...profile, updateSettings: mutation.mutate };
}

export type Settings = {
  calendarProvider: "google" | "native";
  showDeclinedEvents: boolean;
  alldayEvents: boolean;
  birthdays: boolean;
  useColor: boolean;
  use24h: boolean;
  bufferTime: boolean;
  requestNotifications: boolean;
  sharedTimes: "Exact" | "Approx";
  showEventTitles: boolean;
};

export const defaultSettings: Settings = {
  calendarProvider: "google",
  showDeclinedEvents: false,
  alldayEvents: true,
  birthdays: true,
  useColor: true,
  use24h: false,
  bufferTime: false,
  requestNotifications: true,
  sharedTimes: "Exact",
  showEventTitles: true,
};

type SettingsStore = {
  settings: Settings | null;
  setSettings: (s: Settings) => void;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  setSettings: (s) => set({ settings: s }),
  updateSetting: (key, value) =>
    set((state) => ({
      settings: state.settings ? { ...state.settings, [key]: value } : null,
    })),
}));
