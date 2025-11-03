import { IProduct } from '../types';

export const initialProducts: Omit<IProduct, 'id'>[] = [
  // Shirts
  {
    name: "Algorithmic Acid T-Shirt",
    category: "shirts",
    price: 24.99,
    description: "Premium cotton tee with psychedelic algorithm design",
    icon: "👕",
    stock: 100
  },
  {
    name: "Code Warrior Hoodie",
    category: "shirts",
    price: 49.99,
    description: "Comfortable hoodie for late-night coding sessions",
    icon: "🧥",
    stock: 75
  },
  {
    name: "Neon Dreams Tank Top",
    category: "shirts",
    price: 19.99,
    description: "Lightweight tank with vibrant neon graphics",
    icon: "👔",
    stock: 120
  },

  // Music
  {
    name: "Synthwave Dreams Album",
    category: "music",
    price: 9.99,
    description: "12 tracks of pure synthwave magic",
    icon: "🎵",
    stock: 999
  },
  {
    name: "Lo-Fi Beats Collection",
    category: "music",
    price: 14.99,
    description: "Chill beats to study and relax to",
    icon: "🎧",
    stock: 999
  },
  {
    name: "Electronic Odyssey",
    category: "music",
    price: 12.99,
    description: "Journey through electronic soundscapes",
    icon: "🎼",
    stock: 999
  },

  // Anime
  {
    name: "Cyber Samurai Box Set",
    category: "anime",
    price: 39.99,
    description: "Complete series with exclusive artwork",
    icon: "📺",
    stock: 50
  },
  {
    name: "Neon Genesis Collection",
    category: "anime",
    price: 59.99,
    description: "Deluxe edition with bonus features",
    icon: "🎬",
    stock: 30
  },
  {
    name: "Anime Art Book",
    category: "anime",
    price: 29.99,
    description: "300+ pages of stunning anime artwork",
    icon: "📚",
    stock: 80
  },

  // Video Games
  {
    name: "Pixel Legends",
    category: "games",
    price: 34.99,
    description: "Retro-style platformer adventure",
    icon: "🎮",
    stock: 200
  },
  {
    name: "Neon Racer Extreme",
    category: "games",
    price: 44.99,
    description: "High-speed racing in a cyberpunk world",
    icon: "🏎️",
    stock: 150
  },
  {
    name: "Code Breaker RPG",
    category: "games",
    price: 54.99,
    description: "Hack your way through a digital realm",
    icon: "🕹️",
    stock: 100
  },

  // Software
  {
    name: "Design Studio Pro",
    category: "software",
    price: 99.99,
    description: "Professional graphic design suite",
    icon: "💻",
    stock: 999
  },
  {
    name: "Code Editor Elite",
    category: "software",
    price: 79.99,
    description: "Advanced IDE with AI assistance",
    icon: "⌨️",
    stock: 999
  },
  {
    name: "Audio Master Suite",
    category: "software",
    price: 149.99,
    description: "Complete audio production toolkit",
    icon: "🎛️",
    stock: 999
  },
  {
    name: "Video Magic Pro",
    category: "software",
    price: 129.99,
    description: "Professional video editing software",
    icon: "🎥",
    stock: 999
  }
];
