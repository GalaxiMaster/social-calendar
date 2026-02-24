export type Profile = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  friend_code: string;
  created_at: string;
};

export type Friend = {
  id: string;
  status: "pending" | "accepted";
  created_at: string;
  friend_id: string;
  email: string;
  display_name: string;
  avatar_url: string;
  friend_code: string;
};

export type TimeSlot = {
  start: Date;
  end: Date;
};
