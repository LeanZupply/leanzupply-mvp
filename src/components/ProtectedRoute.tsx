import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("superadmin" | "manufacturer" | "buyer")[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth/login");
      } else if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
        // Redirect to appropriate dashboard based on role
        const dashboardMap = {
          superadmin: "/superadmin",
          manufacturer: "/manufacturer",
          buyer: "/buyer",
        };
        navigate(dashboardMap[profile.role]);
      }
    }
  }, [user, profile, loading, allowedRoles, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (allowedRoles && profile && !allowedRoles.includes(profile.role))) {
    return null;
  }

  return <>{children}</>;
};
