import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const SkeletonCard = () => (
  <Card className="overflow-hidden">
    <Skeleton className="h-48 w-full" />
    <CardContent className="p-4 space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex justify-between pt-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-16" />
      </div>
    </CardContent>
  </Card>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex gap-4 items-center">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <Skeleton className="h-6 flex-1" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-20" />
      </div>
    ))}
  </div>
);

export const SkeletonStats = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    {[...Array(4)].map((_, i) => (
      <Card key={i}>
        <CardContent className="p-6 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    ))}
  </div>
);
