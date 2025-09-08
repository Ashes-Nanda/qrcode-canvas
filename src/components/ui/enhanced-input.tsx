import * as React from "react"
import { cn } from "@/lib/utils"

export interface EnhancedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onFocus?: () => void;
  onBlur?: () => void;
}

const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ className, type, placeholder, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState<boolean>(
      typeof props.value === 'string' ? props.value.length > 0 : false
    );

    React.useEffect(() => {
      if (typeof props.value === 'string') {
        setHasValue(props.value.length > 0);
      }
    }, [props.value]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.();
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(e.target.value.length > 0);
      onBlur?.();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0);
      props.onChange?.(e);
    };

    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-xl border border-input bg-background px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
            "placeholder-transparent peer",
            className
          )}
          placeholder={placeholder}
          ref={ref}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        />
        {placeholder && (
          <label className={cn(
            "absolute left-4 transition-all duration-200 pointer-events-none text-muted-foreground",
            (isFocused || hasValue) 
              ? "-top-4 left-3 text-xs bg-background px-1 text-primary font-medium" 
              : "top-3.5 text-base"
          )}>
            {placeholder}
          </label>
        )}
      </div>
    )
  }
)
EnhancedInput.displayName = "EnhancedInput"

export { EnhancedInput }