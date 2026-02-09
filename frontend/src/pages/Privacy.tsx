import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg to-dark-light">
      {/* Header */}
      <div className="bg-dark-card border-b border-cyan-500/20">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-mono text-sm">BACK_TO_STORE</span>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-20">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
            PRIVACY POLICY
          </h1>
          <p className="text-white/70 font-mono">[ LAST_UPDATED: JANUARY_2026 ]</p>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-6 md:p-8 space-y-8">

            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-4 font-mono">// INTRODUCTION</h2>
              <p className="text-white/80">
                Void Vendor ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your information when you visit our website
                or make a purchase. Please read this policy carefully.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-4 font-mono">// INFORMATION_WE_COLLECT</h2>
              <div className="space-y-4 text-white/80">
                <p><strong className="text-white">Personal Information:</strong> When you create an account or make a purchase, we collect your name, email address, shipping address, billing address, and payment information.</p>
                <p><strong className="text-white">Automatically Collected Information:</strong> We automatically collect certain information when you visit our site, including your IP address, browser type, operating system, referring URLs, and information about how you interact with our site.</p>
                <p><strong className="text-white">Cookies:</strong> We use cookies and similar tracking technologies to enhance your browsing experience, analyze site traffic, and personalize content.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-4 font-mono">// HOW_WE_USE_YOUR_INFORMATION</h2>
              <ul className="list-disc list-inside space-y-2 text-white/80">
                <li>Process and fulfill your orders</li>
                <li>Send order confirmations and shipping updates</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Send promotional emails (with your consent)</li>
                <li>Improve our website and services</li>
                <li>Detect and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-4 font-mono">// INFORMATION_SHARING</h2>
              <p className="text-white/80 mb-4">We do not sell your personal information. We may share your information with:</p>
              <ul className="list-disc list-inside space-y-2 text-white/80">
                <li><strong className="text-white">Service Providers:</strong> Payment processors, shipping carriers, and other vendors who help us operate our business</li>
                <li><strong className="text-white">Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong className="text-white">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-4 font-mono">// DATA_SECURITY</h2>
              <p className="text-white/80">
                We implement appropriate technical and organizational measures to protect your personal information
                against unauthorized access, alteration, disclosure, or destruction. All payment transactions are
                encrypted using SSL technology.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-4 font-mono">// YOUR_RIGHTS</h2>
              <p className="text-white/80 mb-4">Depending on your location, you may have the right to:</p>
              <ul className="list-disc list-inside space-y-2 text-white/80">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Opt-out of marketing communications</li>
                <li>Data portability</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-4 font-mono">// THIRD_PARTY_LINKS</h2>
              <p className="text-white/80">
                Our website may contain links to third-party websites. We are not responsible for the privacy
                practices of these external sites. We encourage you to review their privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-4 font-mono">// CHILDREN'S_PRIVACY</h2>
              <p className="text-white/80">
                Our services are not intended for individuals under 18 years of age. We do not knowingly collect
                personal information from children.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-4 font-mono">// UPDATES_TO_THIS_POLICY</h2>
              <p className="text-white/80">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting
                the new policy on this page and updating the "Last Updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-4 font-mono">// CONTACT_US</h2>
              <p className="text-white/80">
                If you have questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:privacy@voidvendor.com" className="text-cyan-400 hover:text-cyan-300">
                  privacy@voidvendor.com
                </a>
              </p>
            </section>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-dark-card border-t border-cyan-500/20 py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-white/40 text-xs font-mono">&lt; VOID_VENDOR :: 2026 :: ALL_RIGHTS_RESERVED /&gt;</p>
        </div>
      </footer>
    </div>
  );
};
