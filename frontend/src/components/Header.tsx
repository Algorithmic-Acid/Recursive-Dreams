import { ShoppingCart, Search, Atom } from 'lucide-react';
import { useState } from 'react';
import { ProductCategory } from '../types';
import { useCartStore } from '../store/cartStore';

interface HeaderProps {
  onCategoryChange: (category: ProductCategory | 'all') => void;
  onSearch: (query: string) => void;
  onCartClick: () => void;
}

export const Header = ({ onCategoryChange, onSearch, onCartClick }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const itemCount = useCartStore((state) => state.getItemCount());

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const categories: { value: ProductCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'shirts', label: 'Shirts' },
    { value: 'music', label: 'Music' },
    { value: 'anime', label: 'Anime' },
    { value: 'games', label: 'Video Games' },
    { value: 'software', label: 'Software' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-dark-card/95 backdrop-blur-md shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Atom className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-white">Algorithmic Acid</h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex gap-6">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => onCategoryChange(cat.value)}
                className="text-white hover:text-secondary transition-colors font-medium"
              >
                {cat.label}
              </button>
            ))}
          </nav>

          {/* Cart Icon */}
          <button
            onClick={onCartClick}
            className="relative p-2 hover:scale-110 transition-transform"
          >
            <ShoppingCart className="w-6 h-6 text-white" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="pb-4">
          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="flex-1 px-4 py-2 rounded-full bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-primary hover:bg-primary-dark rounded-full text-white font-medium transition-colors flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              Search
            </button>
          </form>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4 overflow-x-auto">
          <div className="flex gap-4 min-w-max">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => onCategoryChange(cat.value)}
                className="px-4 py-2 bg-white/10 rounded-full text-white hover:bg-primary transition-colors whitespace-nowrap"
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
