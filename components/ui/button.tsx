import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-all duration-[400ms] ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
  {
    variants: {
      variant: {
        primary:
          "bg-blue-500 text-white shadow-[0_0_30px_rgba(27,110,200,0.45)] hover:bg-blue-400",
        ghost:
          "border border-white/35 bg-white/10 text-white backdrop-blur-md hover:bg-white/20",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}
