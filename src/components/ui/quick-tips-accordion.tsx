import * as React from "react"
import { QrCode, ArrowRight, ChevronDown, ExternalLink, Target, Palette, BarChart3, Share2, Code, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Button } from "./button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion"

interface QuickTip {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  details: string[];
  actionText?: string;
  actionLink?: string;
  category: 'creation' | 'customization' | 'analytics' | 'advanced';
}

const quickTips: QuickTip[] = [
  {
    id: 'dynamic-qr',
    title: 'Use Dynamic QRs for A/B Testing',
    description: 'Track performance and switch destinations without reprinting',
    icon: Target,
    category: 'creation',
    details: [
      'Change destination URLs anytime without reprinting QR codes',
      'Perfect for marketing campaigns and A/B testing',
      'Track detailed analytics and user behavior',
      'Set up weighted destinations for split testing'
    ],
    actionText: 'Learn about Multi-URL QRs',
    actionLink: '/docs/multi-url-qr-codes'
  },
  {
    id: 'brand-recognition',
    title: 'Add Logos for Brand Recognition',
    description: 'Make your QR codes instantly recognizable with custom branding',
    icon: Palette,
    category: 'customization',
    details: [
      'Upload your logo directly during QR creation',
      'Adjust logo size from 5% to 30% of QR dimensions',
      'Extract colors from your brand images automatically',
      'Maintain scannability while adding visual appeal'
    ],
    actionText: 'See Customization Options',
    actionLink: '/docs/qr-customization'
  },
  {
    id: 'analytics-tracking',
    title: 'Monitor Analytics Regularly',
    description: 'Track scan patterns, locations, and user engagement',
    icon: BarChart3,
    category: 'analytics',
    details: [
      'Real-time scan tracking with location data',
      'Peak scanning times and frequency analysis',
      'Device and browser breakdown insights',
      'Export data for deeper analysis'
    ],
    actionText: 'View Analytics Dashboard',
    actionLink: '/dashboard/analytics'
  },
  {
    id: 'social-sharing',
    title: 'Optimize for Social Sharing',
    description: 'Design QR codes that work great across all platforms',
    icon: Share2,
    category: 'advanced',
    details: [
      'Use high contrast colors for better scannability',
      'Test QR codes on various devices before deploying',
      'Include clear call-to-action text near your QR code',
      'Size appropriately for intended viewing distance'
    ],
    actionText: 'Best Practices Guide',
    actionLink: '/docs/best-practices'
  },
  {
    id: 'batch-generation',
    title: 'Batch Generate for Events',
    description: 'Create multiple QR codes efficiently for large events',
    icon: Zap,
    category: 'advanced',
    details: [
      'Generate dozens of QR codes with consistent branding',
      'Use CSV imports for bulk URL processing',
      'Apply templates for consistent styling',
      'Export as high-resolution files for printing'
    ],
    actionText: 'Enterprise Features',
    actionLink: '/upgrade'
  },
  {
    id: 'api-integration',
    title: 'API Integration for Developers',
    description: 'Integrate QR generation into your applications',
    icon: Code,
    category: 'advanced',
    details: [
      'RESTful API for programmatic QR generation',
      'Webhook support for real-time scan notifications',
      'SDKs available for popular programming languages',
      'Rate limiting and authentication included'
    ],
    actionText: 'API Documentation',
    actionLink: '/docs/api'
  }
];

const QuickTipsAccordion: React.FC = () => {
  const [openItems, setOpenItems] = React.useState<string[]>(['dynamic-qr']);

  const categoryColors = {
    creation: 'text-blue-600 bg-blue-100',
    customization: 'text-purple-600 bg-purple-100',
    analytics: 'text-green-600 bg-green-100',
    advanced: 'text-orange-600 bg-orange-100',
  };

  const handleExternalLink = (link?: string) => {
    if (link) {
      // In a real app, you'd use your router here
      console.log('Navigate to:', link);
    }
  };

  return (
    <Card className="rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-gray-50 to-gray-100/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-xl">
            <QrCode className="h-5 w-5 text-primary" />
          </div>
          Quick Tips & Best Practices
        </CardTitle>
        <CardDescription>
          Maximize your QR code effectiveness with these expert recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" value={openItems} onValueChange={setOpenItems}>
          {quickTips.map((tip) => {
            const Icon = tip.icon;
            return (
              <AccordionItem key={tip.id} value={tip.id} className="border-none">
                <AccordionTrigger className="hover:no-underline hover:bg-muted/50 rounded-lg px-3 py-2 text-left">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${categoryColors[tip.category]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{tip.title}</p>
                      <p className="text-xs text-muted-foreground">{tip.description}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="pl-8 space-y-3">
                    <ul className="space-y-2 text-sm text-gray-600">
                      {tip.details.map((detail, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <ArrowRight className="h-3 w-3 text-secondary mt-0.5 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                    {tip.actionText && (
                      <Button
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleExternalLink(tip.actionLink)}
                        className="text-primary hover:bg-primary/10 px-0 h-auto font-medium"
                      >
                        {tip.actionText}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Updated with latest best practices</span>
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
              View all guides
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { QuickTipsAccordion };
