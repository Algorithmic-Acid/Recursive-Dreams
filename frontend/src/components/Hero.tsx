export const Hero = () => {
  const scrollToProducts = () => {
    const productsSection = document.getElementById('products');
    productsSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="bg-gradient-to-br from-primary via-secondary to-primary py-20 px-4 text-center">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
          Welcome to Algorithmic Acid
        </h2>
        <p className="text-xl md:text-2xl text-white/90 mb-8 animate-slide-up">
          Your ultimate destination for shirts, music, anime, games & software
        </p>
        <button
          onClick={scrollToProducts}
          className="px-8 py-4 bg-white text-primary font-bold rounded-full text-lg hover:transform hover:scale-105 hover:shadow-2xl transition-all animate-scale-in"
        >
          Shop Now
        </button>
      </div>
    </section>
  );
};
