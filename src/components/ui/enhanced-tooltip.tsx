import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { HelpCircle, Info, Lightbulb, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface EnhancedTooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  variant?: "default" | "help" | "tip" | "warning" | "feature"
  showIcon?: boolean
  delayDuration?: number
  className?: string
  contentClassName?: string
}

const variantStyles = {
  default: {
    background: "bg-gray-900 text-white",
    icon: Info,
    iconColor: "text-blue-400"
  },
  help: {
    background: "bg-blue-900 text-blue-50",
    icon: HelpCircle,
    iconColor: "text-blue-300"
  },
  tip: {
    background: "bg-yellow-900 text-yellow-50",
    icon: Lightbulb,
    iconColor: "text-yellow-300"
  },
  warning: {
    background: "bg-red-900 text-red-50",
    icon: Info,
    iconColor: "text-red-300"
  },
  feature: {
    background: "bg-green-900 text-green-50",
    icon: Zap,
    iconColor: "text-green-300"
  }
}

const EnhancedTooltip: React.FC<EnhancedTooltipProps> = ({
  children,
  content,
  side = "top",
  align = "center",
  variant = "default",
  showIcon = false,
  delayDuration = 400,
  className,
  contentClassName
}) => {
  const styles = variantStyles[variant]
  const Icon = styles.icon

  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <div className={cn("relative", className)}>
            {children}
          </div>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          className={cn(
            "z-50 max-w-xs rounded-lg px-3 py-2 text-sm shadow-lg animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            styles.background,
            contentClassName
          )}
          sideOffset={5}
        >
          <div className="flex items-start gap-2">
            {showIcon && (
              <div className={cn("flex-shrink-0 mt-0.5", styles.iconColor)}>
                <Icon className="h-3.5 w-3.5" />
              </div>
            )}
            <div className="flex-1 leading-relaxed">
              {content}
            </div>
          </div>
          <TooltipPrimitive.Arrow className="fill-current" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

// Convenience components for specific use cases
interface HelpTooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  className?: string
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({ children, content, className }) => (
  <EnhancedTooltip
    content={content}
    variant="help"
    showIcon
    className={cn("inline-flex items-center cursor-help", className)}
  >
    {children}
  </EnhancedTooltip>
)

const TipTooltip: React.FC<HelpTooltipProps> = ({ children, content, className }) => (
  <EnhancedTooltip
    content={content}
    variant="tip"
    showIcon
    side="bottom"
    className={cn("inline-flex items-center", className)}
  >
    {children}
  </EnhancedTooltip>
)

const FeatureTooltip: React.FC<HelpTooltipProps> = ({ children, content, className }) => (
  <EnhancedTooltip
    content={content}
    variant="feature"
    showIcon
    side="bottom"
    className={cn("inline-flex items-center", className)}
  >
    {children}
  </EnhancedTooltip>
)

// Quick Help Icon Component
interface QuickHelpProps {
  content: React.ReactNode
  variant?: "help" | "tip" | "feature"
  className?: string
}

const QuickHelp: React.FC<QuickHelpProps> = ({ 
  content, 
  variant = "help", 
  className 
}) => {
  const styles = variantStyles[variant]
  const Icon = styles.icon
  
  return (
    <EnhancedTooltip
      content={content}
      variant={variant}
      showIcon
      className={cn("inline-flex", className)}
    >
      <button
        type="button"
        className={cn(
          "flex items-center justify-center w-4 h-4 rounded-full transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
          variant === "help" && "text-blue-500 hover:bg-blue-50",
          variant === "tip" && "text-yellow-500 hover:bg-yellow-50",
          variant === "feature" && "text-green-500 hover:bg-green-50"
        )}
      >
        <Icon className="h-3 w-3" />
      </button>
    </EnhancedTooltip>
  )
}

export { 
  EnhancedTooltip, 
  HelpTooltip, 
  TipTooltip, 
  FeatureTooltip, 
  QuickHelp 
}
