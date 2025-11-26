import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Save } from "lucide-react";
import { toast } from "sonner";
import { handleError } from "@/lib/errorHandler";
import { logActivity } from "@/lib/activityLogger";

interface Setting {
  id: string;
  key: string;
  value: string;
  type: string;
  description: string | null;
}

const SuperadminSettings = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .order("key", { ascending: true });

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      const message = handleError("Settings fetch", error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, newValue: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("settings")
        .update({ value: newValue })
        .eq("key", key);

      if (error) throw error;

      setSettings((prev) =>
        prev.map((s) => (s.key === key ? { ...s, value: newValue } : s))
      );

      // Log activity
      await logActivity({
        action: "Updated setting",
        entity: "setting",
        metadata: { key, value: newValue },
      });

      toast.success("Configuración actualizada");
    } catch (error) {
      const message = handleError("Setting update", error);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value } : s))
    );
  };

  const renderSettingInput = (setting: Setting) => {
    switch (setting.type) {
      case "boolean":
        return (
          <Switch
            checked={setting.value === "true"}
            onCheckedChange={(checked) =>
              updateSetting(setting.key, checked.toString())
            }
          />
        );
      case "number":
        return (
          <div className="flex gap-2">
            <Input
              type="number"
              value={setting.value}
              onChange={(e) => handleInputChange(setting.key, e.target.value)}
              className="max-w-xs"
            />
            <Button
              size="sm"
              onClick={() => updateSetting(setting.key, setting.value)}
              disabled={saving}
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        );
      case "text":
      default:
        return (
          <div className="flex gap-2">
            <Input
              type="text"
              value={setting.value}
              onChange={(e) => handleInputChange(setting.key, e.target.value)}
              className="max-w-xl"
            />
            <Button
              size="sm"
              onClick={() => updateSetting(setting.key, setting.value)}
              disabled={saving}
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        );
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Configuración del Sistema</h1>
        <p className="text-muted-foreground mt-1">
          Administra parámetros de la plataforma
        </p>
      </div>

      {/* Agrupar settings por categoría */}
      {/* Parámetros Logísticos España */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Settings className="h-5 w-5" />
            🌍 Parámetros Logísticos - España
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {settings
            .filter((s) => s.key.startsWith("spain_"))
            .map((setting) => (
              <div key={setting.id} className="space-y-2 pb-4 border-b last:border-0">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <Label htmlFor={setting.key} className="text-base font-medium">
                      {setting.key
                        .replace("spain_", "")
                        .split("_")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ")}
                    </Label>
                    {setting.description && (
                      <p className="text-sm text-muted-foreground">
                        {setting.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-2">{renderSettingInput(setting)}</div>
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Otras configuraciones */}
      {settings.filter((s) => !s.key.startsWith("spain_")).length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Settings className="h-5 w-5" />
              Configuraciones Generales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {settings
              .filter((s) => !s.key.startsWith("spain_"))
              .map((setting) => (
                <div key={setting.id} className="space-y-2 pb-4 border-b last:border-0">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <Label htmlFor={setting.key} className="text-base font-medium">
                        {setting.key
                          .split("_")
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(" ")}
                      </Label>
                      {setting.description && (
                        <p className="text-sm text-muted-foreground">
                          {setting.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-2">{renderSettingInput(setting)}</div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {settings.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No hay configuraciones disponibles
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SuperadminSettings;
