import { supabase } from "@/integrations/supabase/client";
import { logInfo } from "./errorHandler";

export const trackEvent = async (eventType: string, metadata: Record<string, any> = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from("analytics" as any).insert({
      event_type: eventType,
      metadata,
      user_id: user?.id || null,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    // Silently fail analytics - don't disrupt user experience
    logInfo("Analytics tracking failed", { eventType, error });
  }
};
