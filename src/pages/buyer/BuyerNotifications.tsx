import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { handleError } from "@/lib/errorHandler";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

const BuyerNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      const message = handleError("Notifications fetch", error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRead = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: !currentStatus } : n))
      );
    } catch (error) {
      const message = handleError("Notification update", error);
      toast.error(message);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user!.id)
        .eq("read", false);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      const message = handleError("Bulk notification update", error);
      toast.error(message);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "order":
        return <Badge variant="default">Order</Badge>;
      case "system":
        return <Badge variant="secondary">System</Badge>;
      case "product":
        return <Badge variant="outline">Product</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-text">Notifications</h1>
          <p className="text-muted mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-text">Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 rounded-lg border p-4 ${
                  notification.read ? "bg-background" : "bg-surface"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-text">{notification.title}</h3>
                    {getTypeBadge(notification.type)}
                  </div>
                  <p className="text-sm text-muted mb-2">{notification.message}</p>
                  <p className="text-xs text-muted">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">
                    {notification.read ? "Read" : "Unread"}
                  </span>
                  <Switch
                    checked={notification.read}
                    onCheckedChange={() => toggleRead(notification.id, notification.read)}
                  />
                </div>
              </div>
            ))}
          </div>

          {notifications.length === 0 && (
            <div className="py-8 text-center text-muted">
              No notifications yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BuyerNotifications;
