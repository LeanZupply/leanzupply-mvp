import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Box } from "lucide-react";
import { getCategoryIcon } from "@/lib/categories";

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryFilter = ({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategoryFilterProps) => {
  return (
    <div className="w-full">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-4">
          {/* Botón "Todos" */}
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange("all")}
            className={cn(
              "shrink-0 gap-2 transition-all",
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground shadow-md"
                : "hover:bg-muted"
            )}
          >
            <Box className="h-4 w-4" />
            Todos
          </Button>

          {/* Botones de categorías */}
          {categories.map((category) => {
            const Icon = getCategoryIcon(category);
            return (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => onCategoryChange(category)}
                className={cn(
                  "shrink-0 gap-2 transition-all",
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="max-w-[150px] truncate">{category}</span>
              </Button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
