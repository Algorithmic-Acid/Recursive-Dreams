import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const Terms = () => {
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
            TERMS OF SERVICE
          </h1>
          <p className="text-white/70 font-mono">[ LAST_UPDATED: JANUARY_2026 ]</p>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-6 md:p-8 space-y-8">

            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-4 font-mono">// ACCEPTANCE_OF_TERMS</h2>
              <p className="text-white/80">
                By accessing and using the Void Vendor website and services, you accept and agree to be bound by
                these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-4 font-mono">// USE_OF_SERVICE</h2>
              <div className="space-y-4 text-white/80">
                <p>You agree to use our services only for lawful purposes and in accordance with these Terms. You agree not to:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe upon the rights of others</li>
                  <li>Transmit any harmful or malicious code</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with the proper functioning of the website</li>
                  <li>Use automated systems to access our services without permission</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-4 font-mono">// ACCOUNT_REGISTRATION</h2>
              <p className="text-white/80">
                To access certain features, you may need to create an account. You are responsible for maintaining
                the confidentiality of your account credentials and for all activities under your account. You must
                provide accurate and complete information during registration and keep it updated.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-4 font-mono">// PRODUCTS_AND_PRICING</h2>
              <div className="space-y-4 text-white/80">
                <p>All products are subject to availability. We reserve the right to:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Limit quantities of any products</li>
                  <li>Discontinue any product at any time</li>
                  <li>Modify prices without prior notice</li>
                  <li>Refuse or cancel any order for any reason</li>
                </ul>
                <p>Prices displayed are in USD unless otherwise indicated. Applicable taxes and shipping costs will be added at checkout.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-4 font-mono">// ORDERS_AND_PAYMENT</h2>
              <p className="text-white/80">
                By placing an order, you represent that the products ordered will be used only for lawful purposes.
                We reserve the right to refuse or cancel orders that appear fraudulent or unauthorized. Payment must
                be received before orders are processed.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-4 font-mono">// SHIPPING_AND_DELIVERY</h2>
              <p className="text-white/80">
                Shipping times are estimates only and are not guaranteed. We are not responsible for delays caused
                by carriers, customs, or circumstances beyond our control. Risk of loss and title for items pass to
                you upon delivery to the carrier.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-4 font-mono">// RETURNS_AND_REFUNDS</h2>
              <p className="text-white/80">
                Our return policy allows returns within 30 days of delivery for unused items in original packaging.
                Certain items may be excluded from returns. Refunds will be processed to the original payment method
                within 5-10 business days after we receive the returned item.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-4 font-mono">// INTELLECTUAL_PROPERTY</h2>
              <p className="text-white/80">
                All content on this website, including text, graphics, logos, images, and software, is the property
                of Void Vendor or its licensors and is protected by intellectual property laws. You may not reproduce,
                distribute, or create derivative works without our express written consent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-4 font-mono">// DISCLAIMER_OF_WARRANTIES</h2>
              <p className="text-white/80">
                Our services are provided "as is" without warranties of any kind, either express or implied. We do
                not warrant that our services will be uninterrupted, error-free, or free of harmful components.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-4 font-mono">// LIMITATION_OF_LIABILITY</h2>
              <p className="text-white/80">
                To the fullest extent permitted by law, Void Vendor shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages arising from your use of our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-4 font-mono">// INDEMNIFICATION</h2>
              <p className="text-white/80">
                You agree to indemnify and hold harmless Void Vendor and its affiliates from any claims, damages,
                or expenses arising from your violation of these Terms or your use of our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-4 font-mono">// MODIFICATIONS</h2>
              <p className="text-white/80">
                We reserve the right to modify these Terms at any time. Changes will be effective immediately upon
                posting. Your continued use of our services constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-4 font-mono">// GOVERNING_LAW</h2>
              <p className="text-white/80">
                These Terms shall be governed by and construed in accordance with applicable laws, without regard
                to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-4 font-mono">// CONTACT</h2>
              <p className="text-white/80">
                For questions about these Terms, please contact us at{' '}
                <a href="mailto:legal@voidvendor.com" className="text-cyan-400 hover:text-cyan-300">
                  legal@voidvendor.com
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
