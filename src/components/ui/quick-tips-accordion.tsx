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
    title: 'Use Dynamic QRs',
    description: 'Track performance and switch destinations without reprinting',
    icon: Target,
    category: 'creation',
    details: [
      'Change destination URLs anytime',
      'Perfect for A/B testing',
      'Track detailed analytics'
    ],
    actionText: 'Learn More',
    actionLink: '/docs/multi-url-qr-codes'
  },
  {
    id: 'brand-recognition',
    title: 'Add Custom Branding',
    description: 'Make QR codes recognizable with logos and colors',
    icon: Palette,
    category: 'customization',
    details: [
      'Upload your logo during creation',
      'Extract colors from brand images',
      'Maintain scannability'
    ],
    actionText: 'Customize',
    actionLink: '/docs/qr-customization'
  },
  {
    id: 'analytics-tracking',
    title: 'Monitor Analytics',
    description: 'Track scan patterns and user engagement',
    icon: BarChart3,
    category: 'analytics',
    details: [
      'Real-time scan tracking',
      'Location and device insights',
      'Export data for analysis'
    ],
    actionText: 'View Dashboard',
    actionLink: '/dashboard/analytics'
  }
];

const QuickTipsAccordion: React.FC = () => {
  const [openItems, setOpenItems] = React.useState<string[]>([]);

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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <QrCode className="h-4 w-4 text-primary" />
          </div>
          Quick Tips
        </CardTitle>
        <CardDescription className="text-sm">
          Essential best practices for better QR performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" value={openItems} onValueChange={setOpenItems}>
          {quickTips.map((tip) => {
            const Icon = tip.icon;
            return (
              <AccordionItem key={tip.id} value={tip.id} className="border-none">
                <AccordionTrigger className="hover:no-underline hover:bg-muted/50 rounded-lg px-2 py-1.5 text-left">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${categoryColors[tip.category]}`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-xs">{tip.title}</p>
                      <p className="text-xs text-muted-foreground">{tip.description}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-2 pb-2">
                  <div className="pl-6 space-y-2">
                    <ul className="space-y-1 text-xs text-gray-600">
                      {tip.details.map((detail, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <ArrowRight className="h-2.5 w-2.5 text-secondary mt-0.5 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                    {tip.actionText && (
                      <Button
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleExternalLink(tip.actionLink)}
                        className="text-primary hover:bg-primary/10 px-0 h-auto font-medium text-xs"
                      >
                        {tip.actionText}
                        <ExternalLink className="h-2.5 w-2.5 ml-1" />
                      </Button>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        
        <div className="mt-3 pt-2 border-t">
          <Button variant="ghost" size="sm" className="w-full h-auto p-1 text-xs text-muted-foreground hover:text-primary">
            View all guides
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export { QuickTipsAccordion };
