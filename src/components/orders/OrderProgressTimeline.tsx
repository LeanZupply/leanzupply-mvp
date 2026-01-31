import { CheckCircle2, Circle } from "lucide-react";
import { ORDER_TIMELINE_STEPS, getStatusConfig } from "@/lib/orderConstants";
import { cn } from "@/lib/utils";

interface OrderProgressTimelineProps {
  currentStatus: string;
  className?: string;
}

export const OrderProgressTimeline = ({ currentStatus, className }: OrderProgressTimelineProps) => {
  const currentIndex = ORDER_TIMELINE_STEPS.findIndex((s) => s.key === currentStatus);
  const isCancelled = currentStatus === "cancelled";

  if (isCancelled) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-red-600 dark:text-red-400", className)}>
        <Circle className="h-4 w-4" />
        <span className="font-medium">Orden cancelada</span>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Horizontal progress for compact view */}
      <div className="flex items-center justify-between gap-1">
        {ORDER_TIMELINE_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;
          const config = getStatusConfig(step.key);
          const Icon = config.icon;

          return (
            <div key={step.key} className="flex-1 flex flex-col items-center gap-1.5">
              {/* Step indicator */}
              <div className="flex items-center w-full">
                {index > 0 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 transition-colors",
                      isCompleted || isCurrent ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border-2 shrink-0 transition-colors",
                    isCompleted && "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary bg-background text-primary",
                    isPending && "border-muted-foreground/30 bg-background text-muted-foreground/40"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isCurrent ? (
                    <Icon className="h-3.5 w-3.5" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                </div>
                {index < ORDER_TIMELINE_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 transition-colors",
                      isCompleted ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-[10px] sm:text-xs text-center leading-tight",
                  isCompleted && "text-foreground font-medium",
                  isCurrent && "text-primary font-semibold",
                  isPending && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
