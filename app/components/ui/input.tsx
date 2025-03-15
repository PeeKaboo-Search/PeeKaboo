import React, { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input",
        outline: "border-input",
        ghost: "border-none bg-transparent shadow-none",
        underline: "border-b border-t-0 border-l-0 border-r-0 rounded-none px-0 shadow-none focus-visible:ring-0"
      },
      inputSize: {
        default: "h-10 px-3 py-2",
        sm: "h-8 px-2 py-1 text-xs",
        lg: "h-12 px-4 py-3 text-lg"
      },
      status: {
        default: "",
        error: "border-destructive focus-visible:ring-destructive"
      }
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
      status: "default"
    }
  }
);

type InputVariantsProps = VariantProps<typeof inputVariants>;

// Omit the conflicting 'size' property from HTML input attributes
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>, 
  Omit<InputVariantsProps, 'status'> {
  label?: string;
  helperText?: string;
  error?: boolean | string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  helperClassName?: string;
  // Re-add size but as an optional HTML attribute
  htmlSize?: number;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    containerClassName,
    labelClassName,
    helperClassName,
    variant,
    inputSize,
    label,
    helperText,
    error,
    leftIcon,
    rightIcon,
    htmlSize,
    type = "text",
    ...props
  }, ref) => {
    // Determine if we should show error state
    const isError = Boolean(error);
    const errorStatus = isError ? "error" : "default";
    const errorMessage = typeof error === 'string' ? error : helperText;

    return (
      <div className={cn("space-y-1.5", containerClassName)}>
        {label && (
          <label 
            htmlFor={props.id}
            className={cn(
              "text-sm font-medium",
              isError ? "text-destructive" : "text-foreground",
              labelClassName
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              inputVariants({ variant, inputSize, status: errorStatus }),
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            size={htmlSize}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        {(errorMessage || helperText) && (
          <p 
            className={cn(
              "text-xs",
              isError ? "text-destructive" : "text-muted-foreground",
              helperClassName
            )}
          >
            {errorMessage || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input, inputVariants };