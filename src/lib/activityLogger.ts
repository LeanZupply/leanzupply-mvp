import { supabase } from "@/integrations/supabase/client";

interface ActivityLogParams {
  action: string;
  entity: string;
  entity_id?: string;
  metadata?: Record<string, any>;
}

export const logActivity = async ({
  action,
  entity,
  entity_id,
  metadata,
}: ActivityLogParams): Promise<void> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn("Cannot log activity: No authenticated user");
      return;
    }

    const { error } = await supabase.from("activity_log").insert({
      user_id: user.id,
      action,
      entity,
      entity_id: entity_id || null,
      metadata: metadata || null,
    });

    if (error) {
      console.error("Failed to log activity:", error);
    }
  } catch (err) {
    console.error("Activity logging error:", err);
  }
};
