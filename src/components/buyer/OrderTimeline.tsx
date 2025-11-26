import { CheckCircle, Clock, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderTimelineProps {
  currentStatus: string;
  steps: Array<{ key: string; label: string }>;
  className?: string;
}

export const OrderTimeline = ({ currentStatus, steps, className }: OrderTimelineProps) => {
  const currentIndex = steps.findIndex((s) => s.key === currentStatus);

  return (
    <div className={cn("relative", className)}>
      {/* Progress Bar Background */}
      <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border" />
      
      {/* Progress Bar Fill */}
      <div
        className="absolute left-6 top-6 w-0.5 bg-primary transition-all duration-500"
        style={{
          height: currentIndex >= 0 ? `${(currentIndex / (steps.length - 1)) * 100}%` : "0%",
        }}
      />

      {/* Steps */}
      <div className="relative space-y-8">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={step.key} className="flex items-start gap-4">
              {/* Icon */}
              <div
                className={cn(
                  "relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-background transition-colors",
                  isCompleted && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary bg-background text-primary animate-pulse",
                  isPending && "border-muted-foreground/30 bg-background text-muted-foreground"
                )}
              >
                {isCompleted && <CheckCircle className="h-6 w-6" />}
                {isCurrent && <Clock className="h-6 w-6" />}
                {isPending && <Circle className="h-6 w-6" />}
              </div>

              {/* Label */}
              <div className="flex-1 pt-2">
                <p
                  className={cn(
                    "font-medium transition-colors",
                    isCompleted && "text-foreground",
                    isCurrent && "text-primary font-semibold",
                    isPending && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
                {isCurrent && (
                  <p className="text-sm text-muted-foreground mt-1">En progreso...</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
