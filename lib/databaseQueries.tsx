import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export function useUserId() {
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id!);
    });
  }, []);

  return userId;
}
