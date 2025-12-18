import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { PalletSidebar } from "@/components/buyer/PalletSidebar";

export const DashboardHeader = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  if (!profile) return null;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-md px-4 md:px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <h1 className="text-lg font-medium text-foreground">LeanZupply</h1>
      </div>
      
      <div className="flex items-center gap-2">
        {profile?.role === "buyer" && <PalletSidebar />}
        <NotificationsDropdown />
      </div>
    </header>
  );
};
