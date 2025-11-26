import { Loader2 } from "lucide-react";

export const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="text-center space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
      <p className="text-muted-foreground">Cargando...</p>
    </div>
  </div>
);
