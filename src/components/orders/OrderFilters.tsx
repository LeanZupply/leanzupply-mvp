import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ORDER_STATUS_CONFIG, type OrderStatus } from "@/lib/orderConstants";

interface OrderFiltersProps {
  statusFilter: string;
  onStatusChange: (value: string) => void;
  monthFilter: string;
  onMonthChange: (value: string) => void;
  availableMonths: { value: string; label: string }[];
}

export const OrderFilters = ({
  statusFilter,
  onStatusChange,
  monthFilter,
  onMonthChange,
  availableMonths,
}: OrderFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Filtrar por estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los Estados</SelectItem>
          {(Object.keys(ORDER_STATUS_CONFIG) as OrderStatus[]).map((status) => (
            <SelectItem key={status} value={status}>
              {ORDER_STATUS_CONFIG[status].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {availableMonths.length > 0 && (
        <Select value={monthFilter} onValueChange={onMonthChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por fecha" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las Fechas</SelectItem>
            {availableMonths.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

/**
 * Extract unique month/year combos from order dates, formatted for Spanish display.
 */
export function extractAvailableMonths(
  dates: string[]
): { value: string; label: string }[] {
  const map = new Map<string, string>();
  for (const dateStr of dates) {
    const d = new Date(dateStr);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!map.has(key)) {
      map.set(
        key,
        d.toLocaleDateString("es-ES", { month: "long", year: "numeric" })
      );
    }
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([value, label]) => ({
      value,
      label: label.charAt(0).toUpperCase() + label.slice(1),
    }));
}

export function filterByMonth<T extends { created_at: string }>(
  items: T[],
  monthFilter: string
): T[] {
  if (monthFilter === "all") return items;
  return items.filter((item) => {
    const d = new Date(item.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return key === monthFilter;
  });
}
