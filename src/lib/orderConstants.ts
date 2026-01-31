import {
  Clock,
  CreditCard,
  Truck,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from "lucide-react";

export type OrderStatus =
  | "awaiting_payment"
  | "payment_confirmed"
  | "in_transit"
  | "delivered"
  | "cancelled";

export const ORDER_STATUSES: OrderStatus[] = [
  "awaiting_payment",
  "payment_confirmed",
  "in_transit",
  "delivered",
  "cancelled",
];

export interface OrderStatusConfig {
  label: string;
  shortLabel: string;
  colorClasses: string;
  bgClasses: string;
  icon: LucideIcon;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, OrderStatusConfig> = {
  awaiting_payment: {
    label: "Esperando el Pago",
    shortLabel: "Esp. Pago",
    colorClasses: "text-amber-700 dark:text-amber-400",
    bgClasses: "bg-amber-100/80 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    icon: Clock,
  },
  payment_confirmed: {
    label: "Pago Acreditado",
    shortLabel: "Pagado",
    colorClasses: "text-blue-700 dark:text-blue-400",
    bgClasses: "bg-blue-100/80 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    icon: CreditCard,
  },
  in_transit: {
    label: "En Tránsito",
    shortLabel: "Tránsito",
    colorClasses: "text-indigo-700 dark:text-indigo-400",
    bgClasses: "bg-indigo-100/80 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
    icon: Truck,
  },
  delivered: {
    label: "Entregado",
    shortLabel: "Entregado",
    colorClasses: "text-green-700 dark:text-green-400",
    bgClasses: "bg-green-100/80 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelado",
    shortLabel: "Cancelado",
    colorClasses: "text-red-700 dark:text-red-400",
    bgClasses: "bg-red-100/80 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    icon: XCircle,
  },
};

export const ORDER_TIMELINE_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "awaiting_payment", label: "Esperando el Pago" },
  { key: "payment_confirmed", label: "Pago Acreditado" },
  { key: "in_transit", label: "En Tránsito" },
  { key: "delivered", label: "Entregado" },
];

export type OrderDocumentType = "payment_receipt" | "invoice" | "transport_doc" | "other";

export const DOCUMENT_TYPE_LABELS: Record<OrderDocumentType, string> = {
  payment_receipt: "Comprobante de Pago",
  invoice: "Factura",
  transport_doc: "Documento de Transporte",
  other: "Otro",
};

export function getStatusConfig(status: string): OrderStatusConfig {
  return ORDER_STATUS_CONFIG[status as OrderStatus] ?? ORDER_STATUS_CONFIG.awaiting_payment;
}
