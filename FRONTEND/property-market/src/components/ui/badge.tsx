import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
        warning:
          "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
        info:
          "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  removable?: boolean;
  onRemove?: () => void;
}

function Badge({
  className,
  variant,
  removable,
  onRemove,
  children,
  ...props
}: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 rounded-full hover:bg-black/10 p-0.5"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export { Badge, badgeVariants };
