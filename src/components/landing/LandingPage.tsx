import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedInput } from '@/components/ui/enhanced-input';
import { ProgressCountdown } from '@/components/ui/progress-countdown';
import { AuthModal } from '@/components/auth/AuthModal';
import { EnhancedFooter } from '@/components/layout/EnhancedFooter';
import { QrCode, BarChart3, Smartphone, Globe, Zap, Shield } from 'lucide-react';
import QRCode from 'qrcode';

export const LandingPage = () => {
  const [demoUrl, setDemoUrl] = useState('');
  const [demoQR, setDemoQR] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [isFirstGeneration, setIsFirstGeneration] = useState(true);

  const generateDemoQR = async () => {
    if (isGenerating || !demoUrl.trim()) return;
    
    setIsGenerating(true);
    setShowProgress(true);
    setDemoQR(''); // Clear previous QR
  };

  const handleProgressComplete = async () => {
    try {
      const urlToEncode = demoUrl.startsWith('http') ? demoUrl : `https://${demoUrl}`;
      const dataUrl = await QRCode.toDataURL(urlToEncode, {
        width: 200,
        margin: 2,
        color: {
          dark: '#2e266d', // Using new purple primary
          light: '#FFFFFF'
        }
      });
      setDemoQR(dataUrl);
      setShowProgress(false);
      setIsGenerating(false);
      setIsFirstGeneration(false);
      
      // Success message as requested by AK
      setTimeout(() => {
        // This creates the "magic of creation" feeling
      }, 500);
    } catch (error) {
      console.error('Failed to generate demo QR:', error);
      setShowProgress(false);
      setIsGenerating(false);
    }
  };

  const features = [
    {
      icon: QrCode,
      title: '8 QR Code Types',
      description: 'Static, Dynamic, Multi-URL, Actions, Geo-tagged, vCard, Text, and Event QR codes'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Real-time tracking, device analytics, geographic insights, and performance metrics'
    },
    {
      icon: Smartphone,
      title: 'Mobile Optimized',
      description: 'Perfect experience across all devices with responsive design and native sharing'
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Track scans worldwide with geographic distribution and country-level insights'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Sub-500ms redirects with optimized performance and real-time latency monitoring'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Row-level security, data isolation, and comprehensive input validation'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-card border-b border-border elevation-1">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">QRCode Canvas Pro</span>
            </div>
            <Button 
              onClick={() => {
                setAuthMode('signup');
                setAuthModalOpen(true);
              }}
              className="bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl font-bold text-foreground leading-tight">
                  Stop Losing Leads to Bad QR Codes. 
                  <span className="text-primary"> Make Every Scan Count.</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  QRCode Canvas Pro empowers professionals and businesses to create, manage, and track QR codes with unbeatable analytics and security. Serve every customer—no matter where or how they scan.
                </p>
              </div>


              
              <div className="flex gap-4">
                <Button 
                  size="lg" 
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthModalOpen(true);
                  }}
                  className="group bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl elevation-2 px-8 hover:elevation-4 hover:scale-110 smooth-transition focus-visible:elevation-4 hover:shadow-primary/30"
                >
                  Start Your Free Trial →
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => {
                    setAuthMode('login');
                    setAuthModalOpen(true);
                  }}
                  className="rounded-xl border-gray-200"
                >
                  See Analytics Dashboard
                </Button>
              </div>

              <div className="flex items-center gap-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  No Credit Card Needed
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  Join 5,000+ businesses
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  Global Reach, Zero Hassle
                </div>
              </div>
            </div>

            {/* Demo QR Generator */}
            <Card className="rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">
                  {isFirstGeneration ? "Try it now" : "Your first QR is a free gift from us!"}
                </CardTitle>
                <CardDescription>
                  {isFirstGeneration 
                    ? "Generate a QR code instantly" 
                    : "You can track every scan on this QR for richer insights!"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <EnhancedInput
                    placeholder="Enter any URL"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    className="text-lg h-14"
                  />
                  
                  {!isFirstGeneration ? (
                    <div className="grid grid-cols-1 gap-3">
                      <Button 
                        onClick={() => {
                          setAuthMode('signup');
                          setAuthModalOpen(true);
                        }}
                        className="w-full bg-secondary hover:bg-secondary-hover text-secondary-foreground rounded-xl h-12 text-lg font-medium elevation-2 hover:elevation-3 smooth-transition hover:scale-[1.02]"
                      >
                        Track scanning data
                      </Button>
                      <Button 
                        onClick={() => {
                          setDemoUrl('');
                          setDemoQR('');
                          setIsFirstGeneration(true);
                        }}
                        variant="outline"
                        className="w-full rounded-xl h-12 border-gray-200 hover:bg-gray-50"
                      >
                        Create a new QR code
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={generateDemoQR}
                      disabled={isGenerating || !demoUrl.trim()}
                      className="w-full bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl h-12 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? 'Generating...' : 'Generate QR Code'}
                    </Button>
                  )}
                </div>
                
                <ProgressCountdown 
                  isActive={showProgress}
                  onComplete={handleProgressComplete}
                  duration={3000}
                  message="Serving your custom, forever-QR Code in"
                />
                
                {demoQR && !showProgress && (
                  <div className="flex justify-center p-6 bg-gray-50 rounded-2xl animate-fade-in">
                    <img src={demoQR} alt="Demo QR Code" className="rounded-xl" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Features Highlight */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="rounded-2xl shadow-sm border-primary/10 hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-xl">
                    <QrCode className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">8 Powerful QR Types</h3>
                </div>
                <p className="text-gray-600 text-sm">Static, Dynamic, Multi-URL, and more—support for every use case</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm border-primary/10 hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-xl">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Real-Time Analytics</h3>
                </div>
                <p className="text-gray-600 text-sm">Instantly see who scans, where, when, and on what device</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm border-primary/10 hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-xl">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Lightning-Fast</h3>
                </div>
                <p className="text-gray-600 text-sm">Sub-500ms redirects, flawless on any device</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm border-primary/10 hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-xl">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Enterprise Security</h3>
                </div>
                <p className="text-gray-600 text-sm">Advanced row-level security and data isolation</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-foreground">
              Everything you need for professional QR codes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Support for every use case with enterprise-grade security and data isolation to protect your campaigns.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-xl">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="rounded-2xl shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="p-12">
              <blockquote className="text-2xl font-medium text-foreground mb-6 leading-relaxed">
                "QRCode Canvas Pro helped us increase in-store engagement by 43% while keeping data rock-solid secure."
              </blockquote>
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold text-lg">P</span>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-foreground">Priya S.</div>
                  <div className="text-gray-600">Retail Marketer</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold text-foreground">
            Try It Now—No Credit Card Needed
          </h2>
          <p className="text-xl text-gray-600">
            Generate your first professional QR code in seconds and join over 5,000 businesses achieving smarter, safer, and more effective engagement!
          </p>
          <p className="text-lg text-gray-700 font-medium">
            Experience the difference with QRCode Canvas Pro and never settle for ordinary QR codes again
          </p>
          <Button 
            size="lg" 
            onClick={() => {
              setAuthMode('signup');
              setAuthModalOpen(true);
            }}
            className="group bg-primary hover:bg-primary-hover text-white rounded-xl shadow-md px-8 hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            Start Your Free Trial →
          </Button>
        </div>
      </section>

      <EnhancedFooter />

      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authMode}
      />
    </div>
  );
};