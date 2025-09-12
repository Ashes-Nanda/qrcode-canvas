import * as React from "react"
import { CheckCircle, AlertCircle, XCircle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface EnhancedToastProps {
  id?: string
  title?: string
  description?: string
  variant?: "default" | "success" | "warning" | "error" | "info"
  duration?: number
  onClose?: () => void
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

const EnhancedToast: React.FC<EnhancedToastProps> = ({
  id,
  title,
  description,
  variant = "default",
  duration = 5000,
  onClose,
  action,
  className
}) => {
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.()
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const variantStyles = {
    default: "border-gray-200 bg-white text-gray-900",
    success: "border-green-200 bg-green-50 text-green-900",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-900", 
    error: "border-red-200 bg-red-50 text-red-900",
    info: "border-blue-200 bg-blue-50 text-blue-900"
  }

  const iconStyles = {
    default: "text-gray-400",
    success: "text-green-500",
    warning: "text-yellow-500",
    error: "text-red-500", 
    info: "text-blue-500"
  }

  const getIcon = () => {
    switch (variant) {
      case "success":
        return <CheckCircle className="h-5 w-5" />
      case "warning":
        return <AlertCircle className="h-5 w-5" />
      case "error":
        return <XCircle className="h-5 w-5" />
      case "info":
        return <Info className="h-5 w-5" />
      default:
        return <Info className="h-5 w-5" />
    }
  }

  return (
    <div
      className={cn(
        "pointer-events-auto relative flex w-full max-w-sm items-start space-x-3 rounded-xl border p-4 shadow-lg backdrop-blur-sm animate-in slide-in-from-top-5 fade-in-0 duration-300",
        variantStyles[variant],
        className
      )}
    >
      {/* Icon */}
      <div className={cn("flex-shrink-0", iconStyles[variant])}>
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1">
        {title && (
          <h4 className="text-sm font-semibold leading-none">{title}</h4>
        )}
        {description && (
          <p className="text-sm opacity-90 leading-relaxed">{description}</p>
        )}
        {action && (
          <div className="pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={action.onClick}
              className="h-8 px-3 text-xs font-medium"
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className={cn(
            "flex-shrink-0 rounded-md p-1 transition-colors hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-2",
            variant === "success" && "hover:bg-green-600/10 focus:ring-green-500",
            variant === "warning" && "hover:bg-yellow-600/10 focus:ring-yellow-500",
            variant === "error" && "hover:bg-red-600/10 focus:ring-red-500",
            variant === "info" && "hover:bg-blue-600/10 focus:ring-blue-500"
          )}
        >
          <X className="h-4 w-4 opacity-60" />
        </button>
      )}

      {/* Progress Bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-xl">
          <div
            className={cn(
              "h-full animate-shrink-width origin-left",
              variant === "success" && "bg-green-500",
              variant === "warning" && "bg-yellow-500",
              variant === "error" && "bg-red-500",
              variant === "info" && "bg-blue-500",
              variant === "default" && "bg-gray-400"
            )}
            style={{
              animationDuration: `${duration}ms`,
              animationTimingFunction: "linear"
            }}
          />
        </div>
      )}
    </div>
  )
}

// Toast Manager Component
interface ToastManagerProps {
  toasts: Array<EnhancedToastProps & { id: string }>
  onRemoveToast: (id: string) => void
}

const ToastManager: React.FC<ToastManagerProps> = ({ toasts, onRemoveToast }) => {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2">
      {toasts.map((toast) => (
        <EnhancedToast
          key={toast.id}
          {...toast}
          onClose={() => onRemoveToast(toast.id)}
        />
      ))}
    </div>
  )
}

export { EnhancedToast, ToastManager }
