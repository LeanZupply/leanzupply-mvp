import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
import { Cookie } from "lucide-react";

export const CookieBanner = () => {
  const { consent, acceptAnalytics, rejectAnalytics } = useCookieConsent();

  // Don't show banner if user has already responded
  if (consent.hasResponded) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="container mx-auto max-w-4xl">
        <Card className="p-4 shadow-lg border-border bg-background">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm text-foreground font-medium">
                  Utilizamos cookies
                </p>
                <p className="text-sm text-muted-foreground">
                  Usamos cookies propias y de terceros para analizar el uso del sitio y mejorar tu experiencia.{" "}
                  <Link
                    to="/legal/cookies"
                    className="text-primary hover:underline"
                  >
                    Leer mas
                  </Link>
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={rejectAnalytics}
                className="flex-1 sm:flex-none"
              >
                Rechazar
              </Button>
              <Button
                size="sm"
                onClick={acceptAnalytics}
                className="flex-1 sm:flex-none"
              >
                Aceptar
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
