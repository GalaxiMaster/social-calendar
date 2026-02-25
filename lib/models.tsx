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

export type CalendarRequest = {
  id: string;
  group_key: string;
  creator_id: string;
  title: string | null;
  message: string | null;
  start_range: string;
  end_range: string;
  status: string;
  created_at: string;
};
