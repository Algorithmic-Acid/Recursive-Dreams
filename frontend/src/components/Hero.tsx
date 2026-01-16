export const Hero = () => {
  const scrollToProducts = () => {
    const productsSection = document.getElementById('products');
    productsSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative bg-gradient-to-br from-black via-purple-900/20 to-black py-12 sm:py-16 md:py-20 lg:py-24 px-3 sm:px-4 text-center overflow-hidden">
      {/* Cyberpunk Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:30px_30px] sm:bg-[size:40px_40px] md:bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

      <div className="container mx-auto max-w-5xl relative z-10">
        <div className="mb-3 sm:mb-4 text-cyan-400 font-mono text-xs sm:text-sm tracking-widest">
          {'>'} SYSTEM_ONLINE {'<'}
        </div>

        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-4 sm:mb-6 animate-fade-in">
          <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,255,255,0.5)]">
            VOID VENDOR
          </span>
        </h2>

        <div className="text-cyan-400/80 font-mono text-[10px] sm:text-xs md:text-sm mb-4 sm:mb-6 tracking-wider">
          [ NEURAL MARKETPLACE :: v2.0.26 ]
        </div>

        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 sm:mb-8 animate-slide-up max-w-3xl mx-auto font-light px-2">
          Premium <span className="text-cyan-400 font-semibold">audio</span> • cutting-edge <span className="text-purple-400 font-semibold">hardware</span> • exclusive <span className="text-pink-400 font-semibold">apparel</span>
        </p>

        <button
          onClick={scrollToProducts}
          className="group relative px-6 sm:px-8 md:px-10 py-3 sm:py-4 bg-gradient-to-r from-cyan-500 to-purple-600 font-bold rounded text-sm sm:text-base md:text-lg overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(0,255,255,0.5)] animate-scale-in active:scale-95"
        >
          <span className="relative z-10 text-white tracking-wider">ENTER THE VOID</span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>

        <div className="mt-6 sm:mt-8 text-[10px] sm:text-xs text-gray-500 font-mono">
          &lt;CONNECTION_SECURED /&gt;
        </div>
      </div>
    </section>
  );
};
