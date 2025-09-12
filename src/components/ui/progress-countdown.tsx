import * as React from "react"
import { Progress } from "./progress"
import { cn } from "@/lib/utils"

interface ProgressCountdownProps {
  duration?: number;
  onComplete?: () => void;
  message?: string;
  isActive?: boolean;
}

export const ProgressCountdown: React.FC<ProgressCountdownProps> = ({
  duration = 3000,
  onComplete,
  message = "Serving your custom, forever-QR Code in",
  isActive = false
}) => {
  const [progress, setProgress] = React.useState(0);
  const [countdown, setCountdown] = React.useState(3);
  const [isRunning, setIsRunning] = React.useState(false);

  React.useEffect(() => {
    if (isActive && !isRunning) {
      setIsRunning(true);
      setProgress(0);
      setCountdown(3);

      const totalSteps = duration / 100;
      const progressStep = 100 / totalSteps;
      
      let currentProgress = 0;
      let currentCountdown = 3;

      const interval = setInterval(() => {
        currentProgress += progressStep;
        
        if (currentProgress >= 33 && currentCountdown === 3) {
          setCountdown(2);
          currentCountdown = 2;
        } else if (currentProgress >= 66 && currentCountdown === 2) {
          setCountdown(1);
          currentCountdown = 1;
        }

        setProgress(currentProgress);

        if (currentProgress >= 100) {
          clearInterval(interval);
          setCountdown(0);
          setTimeout(() => {
            onComplete?.();
            setIsRunning(false);
          }, 200);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isActive, duration, onComplete, isRunning]);

  if (!isActive) return null;

  return (
    <div className="space-y-4 p-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl border border-primary/20">
      <div className="text-center space-y-3">
        <p className="text-foreground font-medium text-lg">
          {message} <span className="text-3xl font-bold text-primary animate-pulse">{countdown}</span>
        </p>
        <Progress value={progress} className="h-4" />
        <p className="text-sm text-muted-foreground">Creating your forever-QR code...</p>
      </div>
    </div>
  );
};