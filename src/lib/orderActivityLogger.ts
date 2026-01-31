import { supabase } from "@/integrations/supabase/client";

interface LogActivityParams {
  orderId: string;
  action: string;
  oldState?: string;
  newState?: string;
  userId?: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

export async function logOrderActivity({
  orderId,
  action,
  oldState,
  newState,
  userId,
  message,
  metadata,
}: LogActivityParams): Promise<void> {
  const currentUser = userId ?? (await supabase.auth.getUser()).data.user?.id;

  const { error } = await supabase.from("order_activity_log").insert({
    order_id: orderId,
    action,
    old_state: oldState ?? null,
    new_state: newState ?? null,
    user_id: currentUser ?? null,
    message: message ?? null,
    metadata: metadata ?? {},
  });

  if (error) {
    console.error("[orderActivityLogger] Error logging activity:", error);
  }
}
