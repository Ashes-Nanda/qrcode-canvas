import { QrCode, Mail, Instagram, Linkedin, ShieldCheck } from 'lucide-react';

export const EnhancedFooter = () => {
  const linksProduct = [
    { name: 'QR Generator', href: '#' },
    { name: 'Analytics', href: '#' },
    { name: 'API', href: '#' },
    { name: 'Integrations', href: '#' },
  ];
  const linksCompany = [
    { name: 'About', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Contact', href: '#' },
    { name: 'Careers', href: '#' },
  ];
  const linksSupport = [
    { name: 'Help Center', href: '#' },
    { name: 'Documentation', href: '#' },
    { name: 'Status', href: '#' },
    { name: 'Community', href: '#' },
  ];
  const linksLegal = [
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
    { name: 'Cookie Policy', href: '#' },
    { name: 'GDPR', href: '#' },
  ];

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-6 gap-10">
          {/* Brand and blurb */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-lg">QRCode Canvas Pro</div>
                <div className="text-sm text-muted-foreground">Professional QR Solutions</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 max-w-sm">
              Create, manage, and track QR codes with unbeatable analytics and security. Serve every customer—no matter where or how they scan.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-200">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" aria-label="LinkedIn" className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-200">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" aria-label="Email" className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-200">
                <Mail className="w-4 h-4" />
              </a>
              <span className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Product */}
          <div>
            <div className="font-semibold mb-4 text-gray-900">Product</div>
            <ul className="space-y-3 text-sm">
              {linksProduct.map((l, i) => (
                <li key={i}><a href={l.href} className="text-gray-600 hover:text-primary transition-colors duration-200">{l.name}</a></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <div className="font-semibold mb-4 text-gray-900">Company</div>
            <ul className="space-y-3 text-sm">
              {linksCompany.map((l, i) => (
                <li key={i}><a href={l.href} className="text-gray-600 hover:text-primary transition-colors duration-200">{l.name}</a></li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <div className="font-semibold mb-4 text-gray-900">Support</div>
            <ul className="space-y-3 text-sm">
              {linksSupport.map((l, i) => (
                <li key={i}><a href={l.href} className="text-gray-600 hover:text-primary transition-colors duration-200">{l.name}</a></li>
              ))}
            </ul>
          </div>

          {/* Supported by */}
          <div>
            <div className="font-semibold mb-4 text-gray-900">Supported by</div>
            <div className="space-y-4">
              <img 
                src="/assets/C4E LOGO.png" 
                alt="C4E Logo" 
                className="h-8 w-auto object-contain"
              />
              <p className="text-xs text-gray-500">
                Powered by innovation and expertise
              </p>
            </div>
          </div>
        </div>

        {/* Bottom section with legal links */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="text-sm text-gray-500">
              © 2025 QRCode Canvas Pro. All rights reserved.
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              {linksLegal.map((link, i) => (
                <a key={i} href={link.href} className="text-gray-500 hover:text-primary transition-colors duration-200">
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};