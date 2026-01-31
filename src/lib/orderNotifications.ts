import { supabase } from "@/integrations/supabase/client";

interface NotifyOrderEventParams {
  orderId: string;
  targetUserId: string;
  title: string;
  message: string;
}

export async function notifyOrderEvent({
  targetUserId,
  title,
  message,
}: NotifyOrderEventParams): Promise<void> {
  const { error } = await supabase.from("notifications").insert({
    user_id: targetUserId,
    type: "order",
    title,
    message,
    read: false,
  });

  if (error) {
    console.error("[orderNotifications] Error creating notification:", error);
  }
}
