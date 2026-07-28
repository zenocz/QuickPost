import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm focus-visible:ring-emerald-500",
        secondary:
          "bg-neutral-800 text-neutral-100 hover:bg-neutral-700 shadow-sm focus-visible:ring-neutral-400",
        outline:
          "border border-neutral-700 bg-transparent hover:bg-neutral-800 text-neutral-200 focus-visible:ring-neutral-400",
        ghost:
          "bg-transparent hover:bg-neutral-800 text-neutral-200 focus-visible:ring-neutral-400",
        danger:
          "bg-red-600 text-white hover:bg-red-500 shadow-sm focus-visible:ring-red-500",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 py-2",
        lg: "h-10 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> { }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };