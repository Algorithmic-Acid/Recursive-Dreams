import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: 'Orders',
    question: 'How do I track my order?',
    answer: 'Once your order ships, you\'ll receive an email with a tracking number. You can use this number to track your package on the carrier\'s website. You can also view your order status by logging into your account.'
  },
  {
    category: 'Orders',
    question: 'Can I modify or cancel my order?',
    answer: 'You can modify or cancel your order within 1 hour of placing it. After that, orders enter our processing queue and cannot be changed. Contact our support team immediately if you need to make changes.'
  },
  {
    category: 'Shipping',
    question: 'What are the shipping options?',
    answer: 'We offer Standard Shipping (5-7 business days), Express Shipping (2-3 business days), and Overnight Shipping (next business day). Shipping costs are calculated at checkout based on your location and order weight.'
  },
  {
    category: 'Shipping',
    question: 'Do you ship internationally?',
    answer: 'Yes! We ship to most countries worldwide. International shipping times vary by destination, typically ranging from 7-21 business days. Import duties and taxes may apply and are the responsibility of the buyer.'
  },
  {
    category: 'Returns',
    question: 'What is your return policy?',
    answer: 'We offer a 30-day return policy for unused items in their original packaging. Items must be in resalable condition. Some products like opened headphones or personalized items may have restrictions.'
  },
  {
    category: 'Returns',
    question: 'How do I initiate a return?',
    answer: 'Log into your account and go to Order History. Select the item you want to return and click "Request Return". You\'ll receive a prepaid shipping label via email. Pack the item securely and drop it off at the specified carrier.'
  },
  {
    category: 'Products',
    question: 'Are all products authentic?',
    answer: 'Absolutely. We only sell 100% authentic products sourced directly from manufacturers or authorized distributors. Every item comes with a manufacturer warranty where applicable.'
  },
  {
    category: 'Products',
    question: 'Do you offer product warranties?',
    answer: 'All products come with their standard manufacturer warranty. Additionally, we offer an optional Void Vendor Extended Protection Plan that covers accidental damage and extends coverage up to 3 years.'
  },
  {
    category: 'Account',
    question: 'How do I create an account?',
    answer: 'Click the "Sign Up" button in the header and enter your email address and create a password. You can also sign up during checkout. Having an account lets you track orders, save favorites, and checkout faster.'
  },
  {
    category: 'Account',
    question: 'I forgot my password. What do I do?',
    answer: 'Click "Login" then "Forgot Password". Enter your email address and we\'ll send you a password reset link. The link expires after 24 hours for security purposes.'
  },
  {
    category: 'Payment',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover), PayPal, Apple Pay, Google Pay, and cryptocurrency (Bitcoin, Ethereum). All transactions are encrypted and secure.'
  },
  {
    category: 'Payment',
    question: 'Is my payment information secure?',
    answer: 'Yes. We use industry-standard SSL encryption and never store your full credit card details. Our payment processing is PCI DSS compliant, ensuring your financial data is protected.'
  }
];

const categories = [...new Set(faqs.map(faq => faq.category))];

export const FAQ = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const toggleItem = (index: number) => {
    setOpenItems(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const filteredFaqs = activeCategory === 'all'
    ? faqs
    : faqs.filter(faq => faq.category === activeCategory);

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
            FAQ
          </h1>
          <p className="text-white/70 font-mono">[ FREQUENTLY_ASKED_QUESTIONS ]</p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-full font-mono text-sm transition-all ${
              activeCategory === 'all'
                ? 'bg-cyan-500 text-white'
                : 'bg-dark-card border border-cyan-500/20 text-white/70 hover:border-cyan-500/50'
            }`}
          >
            ALL
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full font-mono text-sm transition-all ${
                activeCategory === category
                  ? 'bg-cyan-500 text-white'
                  : 'bg-dark-card border border-cyan-500/20 text-white/70 hover:border-cyan-500/50'
              }`}
            >
              {category.toUpperCase()}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="max-w-3xl mx-auto space-y-4">
          {filteredFaqs.map((faq, index) => (
            <div
              key={index}
              className="bg-dark-card border border-cyan-500/20 rounded-lg overflow-hidden hover:border-cyan-500/40 transition-colors"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left"
              >
                <div>
                  <span className="text-cyan-400 text-xs font-mono mb-1 block">[{faq.category.toUpperCase()}]</span>
                  <span className="text-white font-medium">{faq.question}</span>
                </div>
                {openItems.includes(index) ? (
                  <ChevronUp className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                )}
              </button>
              {openItems.includes(index) && (
                <div className="px-6 pb-5 pt-0">
                  <div className="border-t border-cyan-500/10 pt-4">
                    <p className="text-white/70">{faq.answer}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still Have Questions */}
        <div className="max-w-3xl mx-auto mt-12 text-center">
          <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Still have questions?</h2>
            <p className="text-white/70 mb-6">Can't find the answer you're looking for? Our support team is here to help.</p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
            >
              CONTACT SUPPORT
            </Link>
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
