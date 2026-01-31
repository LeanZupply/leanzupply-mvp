import { Badge } from "@/components/ui/badge";
import { getStatusConfig } from "@/lib/orderConstants";

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
}

export const OrderStatusBadge = ({ status, className }: OrderStatusBadgeProps) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge className={`${config.bgClasses} border ${className ?? ""}`}>
      <Icon className="h-3 w-3 mr-1" />
      <span className="text-xs">{config.label}</span>
    </Badge>
  );
};
