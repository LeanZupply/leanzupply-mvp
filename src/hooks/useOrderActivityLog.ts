import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ActivityLogEntry {
  id: string;
  order_id: string;
  action: string;
  old_state: string | null;
  new_state: string | null;
  user_id: string | null;
  message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export function useOrderActivityLog(orderId: string | null) {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEntries = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("order_activity_log")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries((data as ActivityLogEntry[]) || []);
    } catch (error) {
      console.error("[useOrderActivityLog] fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return { entries, loading, refetch: fetchEntries };
}
