import * as React from "react";
import { cn } from "@/shared/utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          {
            "bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm": variant === 'primary',
            "bg-neutral-800 text-neutral-100 hover:bg-neutral-700 shadow-sm": variant === 'secondary',
            "border border-neutral-700 bg-transparent hover:bg-neutral-800 text-neutral-200": variant === 'outline',
            "bg-transparent hover:bg-neutral-800 text-neutral-200": variant === 'ghost',
            "bg-red-600 text-white hover:bg-red-500 shadow-sm": variant === 'danger',
            
            "h-8 px-3 text-xs": size === 'sm',
            "h-9 px-4 py-2": size === 'md',
            "h-10 px-6": size === 'lg',
            "h-9 w-9": size === 'icon',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
