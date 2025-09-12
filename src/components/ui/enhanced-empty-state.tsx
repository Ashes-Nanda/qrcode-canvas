import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Button } from "./button"
import { QrCode, Play, ArrowRight, Sparkles, Zap, Target } from "lucide-react"
import { cn } from "@/lib/utils"

interface EnhancedEmptyStateProps {
  variant?: "qr-list" | "analytics" | "general"
  title?: string
  description?: string
  className?: string
  onAction?: () => void
  actionText?: string
  showSampleQR?: boolean
  showTutorial?: boolean
}

// Sample QR code SVG for demonstration
const SampleQR: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("relative", className)}>
    <svg 
      viewBox="0 0 200 200" 
      className="w-full h-full border border-gray-200 rounded-lg shadow-sm bg-white"
    >
      {/* QR code pattern */}
      <rect width="200" height="200" fill="white"/>
      
      {/* Corner squares */}
      <rect x="10" y="10" width="60" height="60" fill="none" stroke="#2e266d" strokeWidth="8"/>
      <rect x="25" y="25" width="30" height="30" fill="#2e266d"/>
      
      <rect x="130" y="10" width="60" height="60" fill="none" stroke="#2e266d" strokeWidth="8"/>
      <rect x="145" y="145" width="30" height="30" fill="#2e266d"/>
      
      <rect x="10" y="130" width="60" height="60" fill="none" stroke="#2e266d" strokeWidth="8"/>
      <rect x="25" y="145" width="30" height="30" fill="#2e266d"/>
      
      {/* Data modules */}
      <circle cx="100" cy="50" r="4" fill="#2e266d"/>
      <circle cx="120" cy="50" r="4" fill="#2e266d"/>
      <circle cx="140" cy="70" r="4" fill="#2e266d"/>
      <circle cx="160" cy="90" r="4" fill="#2e266d"/>
      <circle cx="50" cy="100" r="4" fill="#2e266d"/>
      <circle cx="70" cy="120" r="4" fill="#2e266d"/>
      <circle cx="90" cy="140" r="4" fill="#2e266d"/>
      <circle cx="110" cy="160" r="4" fill="#2e266d"/>
      <circle cx="130" cy="180" r="4" fill="#2e266d"/>
      <circle cx="150" cy="100" r="4" fill="#2e266d"/>
      <circle cx="170" cy="120" r="4" fill="#2e266d"/>
      <circle cx="90" cy="80" r="4" fill="#2e266d"/>
      <circle cx="110" cy="100" r="4" fill="#2e266d"/>
      
      {/* Center logo area */}
      <circle cx="100" cy="100" r="20" fill="white" stroke="#2e266d" strokeWidth="2"/>
      <path 
        d="M95 95 L105 95 L105 105 L95 105 Z" 
        fill="#2e266d"
      />
    </svg>
    
    {/* Animated scanning effect */}
    <div className="absolute inset-0 rounded-lg overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" 
           style={{ 
             animation: "scan 3s ease-in-out infinite",
             transform: "translateY(0px)"
           }} />
    </div>
  </div>
)

const EnhancedEmptyState: React.FC<EnhancedEmptyStateProps> = ({
  variant = "general",
  title,
  description,
  className,
  onAction,
  actionText,
  showSampleQR = false,
  showTutorial = false
}) => {
  const getVariantContent = () => {
    switch (variant) {
      case "qr-list":
        return {
          title: title || "No QR Codes Yet",
          description: description || "Create your first professional QR code to start tracking engagement and analytics.",
          actionText: actionText || "Create Your First QR Code",
          showSample: true,
          showVideo: true,
          tips: [
            { icon: Target, text: "Start with a simple URL QR code", color: "text-blue-500" },
            { icon: Sparkles, text: "Add your logo for brand recognition", color: "text-purple-500" },
            { icon: Zap, text: "Track every scan in real-time", color: "text-green-500" }
          ]
        }
      case "analytics":
        return {
          title: title || "No Analytics Data Available",
          description: description || "Start scanning your QR codes to see detailed analytics and insights appear here.",
          actionText: actionText || "View QR Codes",
          showSample: false,
          showVideo: false,
          tips: [
            { icon: Target, text: "Scan data updates in real-time", color: "text-blue-500" },
            { icon: Sparkles, text: "Track locations and devices", color: "text-purple-500" },
            { icon: Zap, text: "Export data for deeper analysis", color: "text-green-500" }
          ]
        }
      default:
        return {
          title: title || "Get Started",
          description: description || "Create your first item to see it appear here.",
          actionText: actionText || "Get Started",
          showSample: showSampleQR,
          showVideo: showTutorial,
          tips: []
        }
    }
  }

  const content = getVariantContent()

  return (
    <Card className={cn("rounded-2xl border-dashed border-2 border-gray-200 bg-gray-50/50", className)}>
      <CardContent className="p-8">
        <div className="text-center space-y-6">
          
          {/* Sample QR Code */}
          {(content.showSample || showSampleQR) && (
            <div className="flex justify-center">
              <div className="relative">
                <SampleQR className="w-32 h-32" />
                <div className="absolute -top-2 -right-2">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="bg-white px-2 py-1 rounded-full border border-gray-200 text-xs text-gray-600">
                    Sample QR
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <QrCode className="w-6 h-6 text-primary" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">
                {content.title}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                {content.description}
              </p>
            </div>
          </div>

          {/* Tutorial Video Embed Placeholder */}
          {(content.showVideo || showTutorial) && (
            <div className="max-w-sm mx-auto">
              <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Play className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="text-sm font-semibold text-gray-900">Quick Start Tutorial</h4>
                      <p className="text-xs text-gray-600">Learn the basics in 2 minutes</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-primary/30 hover:bg-primary/10"
                      onClick={() => {
                        // In a real app, this would open a tutorial video
                        console.log("Play tutorial video")
                      }}
                    >
                      Watch
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Tips */}
          {content.tips.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Quick Tips to Get Started</h4>
              <div className="space-y-2">
                {content.tips.map((tip, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm text-gray-600 max-w-xs mx-auto">
                    <div className={cn("w-5 h-5 flex items-center justify-center", tip.color)}>
                      <tip.icon className="w-4 h-4" />
                    </div>
                    <span className="text-left">{tip.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <Button
              onClick={onAction}
              className="bg-primary hover:bg-primary-hover text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
            >
              {content.actionText}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

        </div>
      </CardContent>
    </Card>
  )
}

export { EnhancedEmptyState }
