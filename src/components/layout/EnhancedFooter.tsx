import { QrCode, Mail, Shield, BarChart3, Globe, Zap } from 'lucide-react';

export const EnhancedFooter = () => {
  const footerLinks = {
    product: [
      { name: 'QR Generator', href: '#' },
      { name: 'Analytics Dashboard', href: '#' },
      { name: 'Multi-URL QR', href: '#' },
      { name: 'Enterprise Features', href: '#' },
    ],
    support: [
      { name: 'Help Center', href: '#' },
      { name: 'Documentation', href: '#' },
      { name: 'API Reference', href: '#' },
      { name: 'Contact Support', href: '#' },
    ],
    company: [
      { name: 'About Us', href: '#' },
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Security', href: '#' },
    ],
    resources: [
      { name: 'Blog', href: '#' },
      { name: 'Case Studies', href: '#' },
      { name: 'QR Code Guide', href: '#' },
      { name: 'Best Practices', href: '#' },
    ],
  };

  const features = [
    { icon: QrCode, text: '8+ QR Code Types' },
    { icon: BarChart3, text: 'Real-time Analytics' },
    { icon: Shield, text: 'Enterprise Security' },
    { icon: Zap, text: 'Lightning Fast' },
    { icon: Globe, text: 'Global Reach' },
  ];

  return (
    <footer className="bg-gradient-to-br from-primary/5 to-accent/5 border-t border-primary/10">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-xl">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground">QRCode Canvas Pro</h3>
                <p className="text-sm text-muted-foreground">Professional QR Solutions</p>
              </div>
            </div>
            
            <p className="text-gray-600 leading-relaxed max-w-md">
              Empowering businesses with professional QR code solutions, advanced analytics, 
              and enterprise-grade security. Transform every scan into actionable insights.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                  <feature.icon className="w-4 h-4 text-primary" />
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Contact */}
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4 text-primary" />
              <span className="text-sm">hello@qrcodecanvaspro.com</span>
            </div>
          </div>

          {/* Links Sections */}
          <div className="grid grid-cols-2 lg:grid-cols-3 lg:col-span-3 gap-8">
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-3">
                {footerLinks.product.map((link, index) => (
                  <li key={index}>
                    <a href={link.href} className="text-gray-600 hover:text-primary transition-colors text-sm">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-3">
                {footerLinks.support.map((link, index) => (
                  <li key={index}>
                    <a href={link.href} className="text-gray-600 hover:text-primary transition-colors text-sm">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link, index) => (
                  <li key={index}>
                    <a href={link.href} className="text-gray-600 hover:text-primary transition-colors text-sm">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-12 pt-8 border-t border-primary/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-secondary" />
                <span>Enterprise-grade security</span>
              </div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Zap className="w-4 h-4 text-secondary" />
                <span>99.9% uptime</span>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              © 2025 QRCode Canvas Pro. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};