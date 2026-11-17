import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold tracking-[0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary-strong hover:shadow-md hover:shadow-primary/25",
        secondary:
          "bg-[#A8B58A] text-[#30352B] shadow-sm hover:bg-[#98A679] hover:shadow-md",
        accent:
          "bg-accent text-accent-foreground shadow-sm shadow-accent/30 hover:bg-[#dedd9a] hover:shadow-md",
        peach:
          "bg-[#F2B9A5] text-[#30352B] shadow-sm hover:bg-[#e8aa94] hover:shadow-md",
        outline:
          "border border-primary/30 bg-transparent text-primary hover:border-primary hover:bg-primary-soft/60",
        ghost: "text-dark hover:bg-primary-soft hover:text-primary",
        whatsapp:
          "bg-[#25D366] text-white shadow-sm hover:bg-[#1ebe57] hover:shadow-md",
        destructive:
          "bg-destructive text-white shadow-sm hover:bg-destructive/90",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 text-[13px]",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
