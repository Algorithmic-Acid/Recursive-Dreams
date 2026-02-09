import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MapPin, Phone, Send, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast.success('Message sent successfully! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

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
            CONTACT US
          </h1>
          <p className="text-white/70 font-mono">[ GET_IN_TOUCH ]</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Info */}
          <div>
            <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-6 md:p-8 mb-6">
              <h2 className="text-2xl font-bold text-cyan-400 mb-6 font-mono">// REACH_US</h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-cyan-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Email</h3>
                    <a href="mailto:support@voidvendor.com" className="text-white/70 hover:text-cyan-400 transition-colors">
                      support@voidvendor.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Phone</h3>
                    <p className="text-white/70">+1 (555) VOID-VND</p>
                    <p className="text-white/50 text-sm">Mon-Fri 9AM-6PM EST</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Location</h3>
                    <p className="text-white/70">The Digital Underground</p>
                    <p className="text-white/50 text-sm">Cyberspace, Sector 7</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Time */}
            <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-6 h-6 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Quick Response</h3>
              </div>
              <p className="text-white/70 text-sm">
                We typically respond to all inquiries within 24 hours. For urgent matters,
                please include "URGENT" in your subject line.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-bold text-cyan-400 mb-6 font-mono">// SEND_MESSAGE</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-white/70 text-sm mb-2 font-mono">NAME</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-dark-bg border border-cyan-500/20 rounded-lg text-white focus:border-cyan-500 focus:outline-none transition-colors"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2 font-mono">EMAIL</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-dark-bg border border-cyan-500/20 rounded-lg text-white focus:border-cyan-500 focus:outline-none transition-colors"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2 font-mono">SUBJECT</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-dark-bg border border-cyan-500/20 rounded-lg text-white focus:border-cyan-500 focus:outline-none transition-colors"
                >
                  <option value="">Select a topic</option>
                  <option value="order">Order Inquiry</option>
                  <option value="product">Product Question</option>
                  <option value="shipping">Shipping & Delivery</option>
                  <option value="returns">Returns & Refunds</option>
                  <option value="technical">Technical Support</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2 font-mono">MESSAGE</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 bg-dark-bg border border-cyan-500/20 rounded-lg text-white focus:border-cyan-500 focus:outline-none transition-colors resize-none"
                  placeholder="How can we help you?"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    SENDING...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    SEND MESSAGE
                  </>
                )}
              </button>
            </form>
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
