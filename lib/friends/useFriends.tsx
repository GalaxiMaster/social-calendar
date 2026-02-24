import { useState } from "react";
import { Friend, Profile } from "../models";
import { supabase } from "../supabase";

export function useFriends() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get your own profile
  const getMyProfile = async (): Promise<Profile | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) throw error;
    return data;
  };

  // Send a friend request by code
  const addFriendByCode = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // Find the user with that code
      const { data: target, error: findError } = await supabase
        .from("profiles")
        .select("id")
        .eq("friend_code", code.toUpperCase())
        .single();

      if (findError || !target) throw new Error("Friend code not found");
      if (target.id === user.id) throw new Error("That's your own code");

      // Send request
      const { error: insertError } = await supabase
        .from("friends")
        .insert({ user_id: user.id, friend_id: target.id });

      if (insertError) {
        if (insertError.code === "23505")
          throw new Error("Friend request already sent");
        throw insertError;
      }
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // Accept a pending request
  const acceptRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from("friends")
      .update({ status: "accepted" })
      .eq("id", friendshipId);
    if (error) throw error;
  };

  // Decline or remove
  const removeFriend = async (friendshipId: string) => {
    const { error } = await supabase
      .from("friends")
      .delete()
      .eq("id", friendshipId);
    if (error) throw error;
  };

  // Get all accepted friends
  const getFriends = async (): Promise<Friend[]> => {
    const { data, error } = await supabase.from("friendships").select("*");

    if (error) throw error;
    return data ?? [];
  };

  // Get pending incoming requests
  const getPendingRequests = async (): Promise<Friend[]> => {
    const { data, error } = await supabase.from("pending_requests").select("*");
    if (error) throw error;
    return data ?? [];
  };

  return {
    loading,
    error,
    getMyProfile,
    addFriendByCode,
    acceptRequest,
    removeFriend,
    getFriends,
    getPendingRequests,
  };
}
