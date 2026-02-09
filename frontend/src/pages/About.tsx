import { Link } from 'react-router-dom';
import { Zap, Shield, Truck, Headphones, ArrowLeft } from 'lucide-react';

export const About = () => {
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

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="w-10 h-10 text-cyan-400" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              VOID VENDOR
            </h1>
          </div>
          <p className="text-xl text-white/70 font-mono">[ ABOUT_US ]</p>
        </div>

        {/* Story Section */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4 font-mono">// OUR_STORY</h2>
            <div className="space-y-4 text-white/80">
              <p>
                Born from the neon-lit depths of the digital underground, Void Vendor emerged as a sanctuary
                for those who refuse to conform. We curate premium audio gear, cutting-edge hardware, and
                exclusive cyberpunk apparel for the tech-savvy rebels of tomorrow.
              </p>
              <p>
                Our mission is simple: deliver exceptional products that embody the spirit of innovation
                and individuality. Every item in our catalog is carefully selected to meet our exacting
                standards for quality, design, and performance.
              </p>
              <p>
                Whether you're a music producer seeking pristine audio fidelity, a gamer demanding peak
                performance, or a style-conscious individual looking to stand out, Void Vendor has you covered.
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-6 text-center hover:border-cyan-500/50 transition-colors">
            <div className="w-16 h-16 mx-auto mb-4 bg-cyan-500/10 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Secure Payments</h3>
            <p className="text-white/60 text-sm">End-to-end encrypted transactions protect your data</p>
          </div>

          <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-6 text-center hover:border-cyan-500/50 transition-colors">
            <div className="w-16 h-16 mx-auto mb-4 bg-purple-500/10 rounded-full flex items-center justify-center">
              <Truck className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Fast Shipping</h3>
            <p className="text-white/60 text-sm">Express delivery options to get your gear quickly</p>
          </div>

          <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-6 text-center hover:border-cyan-500/50 transition-colors">
            <div className="w-16 h-16 mx-auto mb-4 bg-pink-500/10 rounded-full flex items-center justify-center">
              <Headphones className="w-8 h-8 text-pink-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">24/7 Support</h3>
            <p className="text-white/60 text-sm">Our team is always ready to assist you</p>
          </div>

          <div className="bg-dark-card border border-cyan-500/20 rounded-lg p-6 text-center hover:border-cyan-500/50 transition-colors">
            <div className="w-16 h-16 mx-auto mb-4 bg-cyan-500/10 rounded-full flex items-center justify-center">
              <Zap className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Quality Guaranteed</h3>
            <p className="text-white/60 text-sm">Every product meets our strict quality standards</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
          >
            <Zap className="w-5 h-5" />
            START SHOPPING
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-card border-t border-cyan-500/20 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-white/40 text-xs font-mono">&lt; VOID_VENDOR :: 2026 :: ALL_RIGHTS_RESERVED /&gt;</p>
        </div>
      </footer>
    </div>
  );
};
