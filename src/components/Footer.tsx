import { Link, useNavigate } from "react-router-dom";
import { Package, Globe, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FooterProps {
  onCTAClick?: (type: "join" | "explore") => void;
}

export const Footer = ({ onCTAClick }: FooterProps) => {
  const navigate = useNavigate();

  const handleCTAClick = (type: "join" | "explore") => {
    if (onCTAClick) {
      onCTAClick(type);
    }
  };

  return (
    <footer className="border-t border-border bg-muted/50 px-4 py-12">
      <div className="container mx-auto">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Brand column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">LeanZupply</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              La plataforma D2B que conecta fabricantes certificados con empresas de todo el mundo.
            </p>
          </div>

          {/* Platform column */}
          <div className="space-y-4">
            <h5 className="font-semibold">Plataforma</h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button
                  onClick={() => handleCTAClick("join")}
                  className="hover:text-foreground transition-colors"
                >
                  Para Fabricantes
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCTAClick("explore")}
                  className="hover:text-foreground transition-colors"
                >
                  Para Compradores
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/auth/signup")}
                  className="hover:text-foreground transition-colors"
                >
                  Comenzar sin Costes
                </button>
              </li>
            </ul>
          </div>

          {/* Features column */}
          <div className="space-y-4">
            <h5 className="font-semibold">Caracteristicas</h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Verificacion de Proveedores</li>
              <li>Gestion de Pedidos</li>
              <li>Logistica Integrada</li>
              <li>Pagos Seguros</li>
            </ul>
          </div>

          {/* Legal column */}
          <div className="space-y-4">
            <h5 className="font-semibold">Legal</h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  to="/legal/terminos"
                  className="hover:text-foreground transition-colors"
                >
                  Terminos y Condiciones
                </Link>
              </li>
              <li>
                <Link
                  to="/legal/privacidad"
                  className="hover:text-foreground transition-colors"
                >
                  Politica de Privacidad
                </Link>
              </li>
              <li>
                <Link
                  to="/legal/cookies"
                  className="hover:text-foreground transition-colors"
                >
                  Politica de Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              &copy; 2025 LeanZupply. Plataforma D2B para equipamiento industrial.
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Globe className="h-3 w-3 mr-1" />
                Operamos globalmente
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Seguro y confiable
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
