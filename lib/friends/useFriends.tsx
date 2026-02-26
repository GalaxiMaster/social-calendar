// hooks/useFriends.ts
import { supabase } from "@/lib/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useMyProfile(userId: string) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId, // don't run if no userId yet
  });
}

export function useFriends(userId: string) {
  return useQuery({
    queryKey: ["friends", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("friendships").select("*");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });
}

export function usePendingRequests(userId: string) {
  return useQuery({
    queryKey: ["pendingRequests", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_requests")
        .select("*");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });
}

// ---- Mutations ----

export function useAddFriendByCode(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const { data: target, error: findError } = await supabase
        .from("profiles")
        .select("id")
        .eq("friend_code", code.toUpperCase())
        .single();

      if (findError || !target) throw new Error("Friend code not found");
      if (target.id === userId) throw new Error("That's your own code");

      const { error: insertError } = await supabase
        .from("friends")
        .insert({ user_id: userId, friend_id: target.id });

      if (insertError) {
        if (insertError.code === "23505")
          throw new Error("Friend request already sent");
        throw insertError;
      }
    },
    onSuccess: () => {
      // refetch pending requests after sending one
      queryClient.invalidateQueries({ queryKey: ["pendingRequests", userId] });
    },
  });
}

export function useAcceptRequest(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from("friends")
        .update({ status: "accepted" })
        .eq("id", friendshipId);
      if (error) throw error;
    },
    onSuccess: () => {
      // update both lists after accepting
      queryClient.invalidateQueries({ queryKey: ["friends", userId] });
      queryClient.invalidateQueries({ queryKey: ["pendingRequests", userId] });
    },
  });
}

export function useRemoveFriend(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from("friends")
        .delete()
        .eq("id", friendshipId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends", userId] });
      queryClient.invalidateQueries({ queryKey: ["pendingRequests", userId] });
    },
  });
}
