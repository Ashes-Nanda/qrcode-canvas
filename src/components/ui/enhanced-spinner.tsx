import * as React from "react"
import { cn } from "@/lib/utils"

interface EnhancedSpinnerProps {
  size?: "sm" | "default" | "lg" | "xl"
  variant?: "default" | "dots" | "pulse" | "bounce" | "ripple"
  className?: string
  color?: "primary" | "secondary" | "accent" | "muted"
}

const EnhancedSpinner: React.FC<EnhancedSpinnerProps> = ({
  size = "default",
  variant = "default",
  className,
  color = "primary"
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    default: "w-6 h-6", 
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  }

  const colorClasses = {
    primary: "text-primary",
    secondary: "text-secondary", 
    accent: "text-accent",
    muted: "text-muted-foreground"
  }

  if (variant === "default") {
    return (
      <svg
        className={cn(
          "animate-spin",
          sizeClasses[size],
          colorClasses[color],
          className
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    )
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex items-center space-x-1", className)}>
        <div
          className={cn(
            "rounded-full bg-current animate-pulse",
            size === "sm" && "w-1 h-1",
            size === "default" && "w-1.5 h-1.5", 
            size === "lg" && "w-2 h-2",
            size === "xl" && "w-3 h-3",
            colorClasses[color]
          )}
          style={{ animationDelay: "0ms", animationDuration: "1000ms" }}
        />
        <div
          className={cn(
            "rounded-full bg-current animate-pulse",
            size === "sm" && "w-1 h-1",
            size === "default" && "w-1.5 h-1.5",
            size === "lg" && "w-2 h-2", 
            size === "xl" && "w-3 h-3",
            colorClasses[color]
          )}
          style={{ animationDelay: "200ms", animationDuration: "1000ms" }}
        />
        <div
          className={cn(
            "rounded-full bg-current animate-pulse",
            size === "sm" && "w-1 h-1",
            size === "default" && "w-1.5 h-1.5",
            size === "lg" && "w-2 h-2",
            size === "xl" && "w-3 h-3", 
            colorClasses[color]
          )}
          style={{ animationDelay: "400ms", animationDuration: "1000ms" }}
        />
      </div>
    )
  }

  if (variant === "pulse") {
    return (
      <div
        className={cn(
          "rounded-full bg-current animate-pulse opacity-75",
          sizeClasses[size],
          colorClasses[color],
          className
        )}
        style={{ animationDuration: "1500ms" }}
      />
    )
  }

  if (variant === "bounce") {
    return (
      <div className={cn("flex items-center space-x-1", className)}>
        <div
          className={cn(
            "rounded-full bg-current animate-bounce",
            size === "sm" && "w-1 h-1",
            size === "default" && "w-1.5 h-1.5",
            size === "lg" && "w-2 h-2",
            size === "xl" && "w-3 h-3",
            colorClasses[color]
          )}
          style={{ animationDelay: "0ms" }}
        />
        <div
          className={cn(
            "rounded-full bg-current animate-bounce",
            size === "sm" && "w-1 h-1",
            size === "default" && "w-1.5 h-1.5",
            size === "lg" && "w-2 h-2",
            size === "xl" && "w-3 h-3",
            colorClasses[color]
          )}
          style={{ animationDelay: "100ms" }}
        />
        <div
          className={cn(
            "rounded-full bg-current animate-bounce",
            size === "sm" && "w-1 h-1",
            size === "default" && "w-1.5 h-1.5",
            size === "lg" && "w-2 h-2",
            size === "xl" && "w-3 h-3",
            colorClasses[color]
          )}
          style={{ animationDelay: "200ms" }}
        />
      </div>
    )
  }

  if (variant === "ripple") {
    return (
      <div className={cn("relative", sizeClasses[size], className)}>
        <div
          className={cn(
            "absolute inset-0 rounded-full border-2 border-current opacity-75 animate-ping",
            colorClasses[color]
          )}
          style={{ animationDuration: "1500ms" }}
        />
        <div
          className={cn(
            "absolute inset-1 rounded-full border border-current opacity-50 animate-ping",
            colorClasses[color]
          )}
          style={{ animationDuration: "1500ms", animationDelay: "150ms" }}
        />
      </div>
    )
  }

  return null
}

export { EnhancedSpinner }
