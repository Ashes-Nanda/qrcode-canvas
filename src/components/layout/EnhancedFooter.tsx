import { QrCode, Mail, Instagram, Linkedin, ShieldCheck } from 'lucide-react';

export const EnhancedFooter = () => {
  const linksA = [{ name: 'MBTI Assessment', href: '#' }];
  const linksCompany = [
    { name: 'Blog', href: '#' },
    { name: 'Contact', href: '#' },
    { name: 'Newsletter', href: '#' },
    { name: 'Team', href: '#' },
  ];

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid md:grid-cols-4 gap-10">
          {/* Brand and blurb */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 bg-primary rounded-full">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-semibold">CerebralQuotient.com</div>
                <div className="text-xs text-muted-foreground">Professional QR Solutions</div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Discover yourself through scientifically validated personality tests and assessments.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" aria-label="Instagram" className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 smooth-transition">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" aria-label="LinkedIn" className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 smooth-transition">
                <Linkedin className="w-4 h-4" />
              </a>
              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Tests */}
          <div>
            <div className="font-semibold mb-4">Tests</div>
            <ul className="space-y-3 text-sm">
              {linksA.map((l, i) => (
                <li key={i}><a href={l.href} className="text-gray-600 hover:text-primary smooth-transition">{l.name}</a></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <div className="font-semibold mb-4">Company</div>
            <ul className="space-y-3 text-sm">
              {linksCompany.map((l, i) => (
                <li key={i}><a href={l.href} className="text-gray-600 hover:text-primary smooth-transition">{l.name}</a></li>
              ))}
            </ul>
          </div>

          {/* Supported By */}
          <div>
            <div className="font-semibold mb-4">Supported by</div>
            <div className="flex items-center gap-3">
              <img src="/assets/C4E%20LOGO.png" alt="C4E" className="w-12 h-12 object-contain rounded-md" />
              <div className="text-sm text-gray-600">C4E is a collective of dreamers and doers.</div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          © 2025 Cerebral Quotient. All rights reserved.
        </div>
      </div>
    </footer>
  );
};