/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { 
  ShoppingBag, 
  X, 
  Plus, 
  Minus, 
  ChevronRight,
  Instagram,
  Twitter,
  Facebook,
  ArrowRight,
  CheckCircle2,
  Check,
  Moon,
  Sun,
  Upload,
  Shirt,
  Coffee,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import OrderForm from './components/OrderForm';
import whitePlainTshirt from './assets/images/white_plain_tshirt_1779533354809.png';
import whiteCeramicMug from './assets/images/white_ceramic_mug_1779533374051.png';

// --- Error Boundary ---

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-brand-cream p-4">
          <div className="bg-surface p-8 rounded-2xl shadow-xl max-w-md w-full border border-border">
            <h1 className="text-2xl font-bold text-red-600 mb-4 font-serif">Something went wrong</h1>
            <p className="text-brand-ink/70 mb-4">The application encountered an unexpected error.</p>
            <pre className="bg-red-500/10 p-4 rounded-lg text-xs text-red-600 overflow-auto max-h-40 mb-6 font-mono">
              {this.state.error?.message}
            </pre>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-brand-ink text-brand-cream py-3 rounded-xl font-bold hover:opacity-90 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Types & Constants ---

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: 'tshirt' | 'mug';
  description: string;
}

interface CartItem extends Product {
  quantity: number;
  customDesign?: string;
  isCustom?: boolean;
}

const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Minimalist Line Art Tee',
    price: 28,
    image: whitePlainTshirt,
    category: 'tshirt',
    description: '100% organic cotton with a subtle hand-drawn design.'
  },
  {
    id: '2',
    name: 'Morning Mist Mug',
    price: 18,
    image: whiteCeramicMug,
    category: 'mug',
    description: 'Ceramic mug with a matte finish and ergonomic handle.'
  },
  {
    id: '3',
    name: 'Abstract Geometry Tee',
    price: 32,
    image: whitePlainTshirt,
    category: 'tshirt',
    description: 'Bold geometric shapes printed on premium heavy cotton.'
  },
  {
    id: '4',
    name: 'Terra Cotta Mug',
    price: 22,
    image: whiteCeramicMug,
    category: 'mug',
    description: 'Hand-glazed ceramic mug in earthy tones.'
  },
  {
    id: '5',
    name: 'Vintage Botanical Tee',
    price: 30,
    image: whitePlainTshirt,
    category: 'tshirt',
    description: 'Soft-wash tee featuring a vintage botanical illustration.'
  },
  {
    id: '6',
    name: 'Midnight Speckle Mug',
    price: 20,
    image: whiteCeramicMug,
    category: 'mug',
    description: 'Dark ceramic with white speckle detail.'
  }
];

// --- Main Application ---

export default function App() {
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [isOrderFormOpen, setIsOrderFormOpen] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);
  const [isBagAnimating, setIsBagAnimating] = React.useState(false);
  
  // Customizer State
  const [customType, setCustomType] = React.useState<'tshirt' | 'mug'>('tshirt');
  const [productColor, setProductColor] = React.useState('White');
  const [customImage, setCustomImage] = React.useState<string | null>(null);
  const [selectedMainCategory, setSelectedMainCategory] = React.useState<'Preset Design' | 'Your Design'>('Preset Design');
  const [mainUploadedFile, setMainUploadedFile] = React.useState<File | null>(null);

  React.useEffect(() => {
    console.log("Aura Print App Mounted");
    
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const addToCart = (product: Product, customDesign?: string) => {
    setCart(prev => {
      const existing = prev.find(item => 
        item.id === product.id && item.customDesign === customDesign
      );
      if (existing) {
        return prev.map(item => 
          (item.id === product.id && item.customDesign === customDesign)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, customDesign, isCustom: !!customDesign }];
    });
    
    // Trigger animations and toast
    setShowToast(true);
    setIsBagAnimating(true);
    setTimeout(() => setShowToast(false), 3000);
    setTimeout(() => setIsBagAnimating(false), 500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImage(event.target?.result as string);
        setSelectedMainCategory('Your Design');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCustomToCart = () => {
    if (!customImage) return;
    
    const customProduct: Product = {
      id: `custom-${customType}-${Date.now()}`,
      name: `Custom ${customType.charAt(0).toUpperCase() + customType.slice(1)}`,
      price: customType === 'tshirt' ? 35 : 25,
      image: customType === 'tshirt' ? whitePlainTshirt : whiteCeramicMug,
      category: customType,
      description: `Your unique custom design on a premium ${customType}.`
    };
    
    addToCart(customProduct, customImage);
  };

  const removeFromCart = (id: string, customDesign?: string) => {
    setCart(prev => prev.filter(item => !(item.id === id && item.customDesign === customDesign)));
  };

  const updateQuantity = (id: string, delta: number, customDesign?: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === id && item.customDesign === customDesign) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-brand-cream text-brand-ink">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-brand-cream/80 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <a href="#" className="text-2xl font-serif font-bold tracking-tighter leading-none">AURA</a>
            <span className="text-[8.5px] font-serif tracking-[0.45em] uppercase opacity-60 ml-0.5 mt-1 block" style={{ fontWeight: 300 }}>PROFESSIONAL</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium uppercase tracking-widest opacity-70">
            <a href="#shop" className="hover:opacity-100 transition-opacity">Shop</a>
            <a href="#customize" className="hover:opacity-100 transition-opacity">Customize</a>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="relative w-16 h-8 rounded-full p-1 transition-all duration-500 flex items-center cursor-pointer bg-brand-ink/10 border border-border overflow-hidden"
            aria-label="Toggle Dark Mode"
          >
            {/* Background Icons */}
            <div className="absolute inset-0 flex items-center justify-between px-2.5 opacity-20">
              <Sun size={12} strokeWidth={2.5} />
              <Moon size={12} strokeWidth={2.5} />
            </div>

            <motion.div
              className="w-6 h-6 bg-brand-ink rounded-full flex items-center justify-center shadow-lg z-10"
              animate={{ x: isDarkMode ? 32 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <motion.div
                key={isDarkMode ? 'moon' : 'sun'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {isDarkMode ? (
                  <Moon size={14} strokeWidth={2.5} className="text-brand-cream" />
                ) : (
                  <Sun size={14} strokeWidth={2.5} className="text-brand-cream" />
                )}
              </motion.div>
            </motion.div>
          </button>
          
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 hover:bg-brand-ink/5 rounded-full transition-colors"
          >
            <motion.div
              animate={isBagAnimating ? {
                scale: [1, 1.2, 1],
                rotate: [0, -10, 10, -10, 0],
              } : {}}
              transition={{ duration: 0.4 }}
            >
              <ShoppingBag size={24} strokeWidth={1.5} />
            </motion.div>
            {cartCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-brand-ink text-brand-cream text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full"
              >
                {cartCount}
              </motion.span>
            )}
          </button>
        </div>
      </nav>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-6 pt-4">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2000" 
              alt="Hero Background" 
              className="w-full h-full object-cover opacity-20"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-brand-cream/0 via-brand-cream/5 to-brand-cream" />
          </div>
          
          <div className="relative z-10 text-center max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <span className="text-xs font-bold tracking-[0.3em] uppercase opacity-50 mb-6 block">Wear Your Story</span>
              <h1 className="text-6xl md:text-8xl font-serif mb-10 leading-[0.9]">
                Artistry in <br />
                <span className="italic">Every Thread.</span>
              </h1>
              <p className="text-lg opacity-70 mb-12 max-w-xl mx-auto leading-relaxed">
                Premium custom apparel and ceramics designed for the modern minimalist. 
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <a href="#shop" className="btn-primary">Browse Collection</a>
                <a 
                  href="#customize" 
                  className="relative group px-10 py-5 border border-brand-ink/20 rounded-full font-bold hover:bg-brand-ink/5 transition-all overflow-hidden"
                >
                  {/* Liquid Orbiting Highlight */}
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      padding: '1.5px',
                      maskImage: 'linear-gradient(black, black), linear-gradient(black, black)',
                      maskClip: 'content-box, border-box',
                      maskComposite: 'exclude',
                      WebkitMaskComposite: 'destination-out'
                    }}
                  >
                    {/* Primary Beam (Body) */}
                    <div className="absolute inset-[-200%] animate-liquid-orbit bg-[conic-gradient(from_0deg,transparent_0%,transparent_92%,white_100%)] blur-[1.5px]" />
                    {/* Secondary Glow (Tail) */}
                    <div 
                      className="absolute inset-[-200%] animate-liquid-orbit bg-[conic-gradient(from_0deg,transparent_0%,transparent_85%,rgba(255,255,255,0.4)_100%)] blur-[5px]" 
                      style={{ animationDelay: '-0.15s' }}
                    />
                    {/* Bright Head (Drop) */}
                    <div 
                      className="absolute inset-[-200%] animate-liquid-orbit bg-[conic-gradient(from_0deg,transparent_0%,transparent_98%,white_100%)] blur-[1px]" 
                      style={{ animationDelay: '0.02s' }}
                    />
                    {/* Second Orbiting Beam (Opposite Side) */}
                    <div 
                      className="absolute inset-[-200%] animate-liquid-orbit bg-[conic-gradient(from_0deg,transparent_0%,transparent_94%,rgba(255,255,255,0.7)_100%)] blur-[2px]" 
                      style={{ animationDelay: '-2s' }}
                    />
                    {/* Second Beam Tail */}
                    <div 
                      className="absolute inset-[-200%] animate-liquid-orbit bg-[conic-gradient(from_0deg,transparent_0%,transparent_88%,rgba(255,255,255,0.3)_100%)] blur-[4px]" 
                      style={{ animationDelay: '-2.15s' }}
                    />
                  </div>
                  <span className="relative z-10">Create Custom</span>
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Featured Products */}
        <section id="shop" className="pt-16 pb-24 px-6 max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold tracking-[0.2em] uppercase opacity-50 mb-2 block">The Collection</span>
              <h2 className="text-4xl font-serif">Curated Essentials</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {PRODUCTS.map((product) => (
              <div 
                key={product.id}
                className="aesthetic-card group"
              >
                <div className="aspect-[4/5] overflow-hidden relative">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={() => addToCart(product)}
                    className="absolute bottom-4 right-4 bg-surface p-3 rounded-full shadow-lg opacity-100 transition-all duration-300 hover:bg-brand-ink hover:text-brand-cream"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-medium">{product.name}</h3>
                    <span className="font-medium">${product.price}</span>
                  </div>
                  <p className="text-sm opacity-60 line-clamp-2">{product.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Customizer Section */}
        <section id="customize" className="pt-20 pb-32 px-6 bg-brand-cream transition-colors duration-500">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between mb-20 gap-8">
              <div className="max-w-xl">
                <span className="text-xs font-bold tracking-[0.3em] uppercase text-brand-accent mb-4 block">Bespoke Studio</span>
                <h2 className="text-5xl md:text-6xl font-serif mb-6 leading-tight text-brand-ink">Personalize <br/><span className="italic">Your Aura</span></h2>
                <p className="text-brand-ink/60 leading-relaxed text-lg">
                  Upload your unique artwork and transform our premium essentials into your personal canvas. 
                </p>
              </div>
              <div className="flex items-center gap-4 bg-brand-ink/5 p-2 rounded-full border border-brand-ink/10">
                <button 
                  onClick={() => setCustomType('tshirt')}
                  className={`flex items-center gap-2 px-8 py-4 rounded-full font-bold transition-all duration-300 ${customType === 'tshirt' ? 'bg-brand-ink text-brand-cream shadow-xl scale-105' : 'hover:bg-brand-ink/10 text-brand-ink/60'}`}
                >
                  <Shirt size={20} /> T-Shirt
                </button>
                <button 
                  onClick={() => setCustomType('mug')}
                  className={`flex items-center gap-2 px-8 py-4 rounded-full font-bold transition-all duration-300 ${customType === 'mug' ? 'bg-brand-ink text-brand-cream shadow-xl scale-105' : 'hover:bg-brand-ink/10 text-brand-ink/60'}`}
                >
                  <Coffee size={20} /> Mug
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-stretch">
              {/* Controls */}
              <div className="space-y-8">
                <div className="bg-surface border border-brand-ink/20 rounded-[2rem] p-10 shadow-xl shadow-brand-ink/5">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-accent mb-10">01. Design Integration</h3>
                  <div className="relative group">
                    <input 
                      type="file" 
                      id="design-upload" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                    <label 
                      htmlFor="design-upload"
                      className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-brand-ink/20 rounded-3xl cursor-pointer hover:border-brand-accent hover:bg-brand-ink/[0.02] transition-all duration-500 group overflow-hidden"
                    >
                      {customImage ? (
                        <div className="relative w-full h-full p-6">
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setCustomImage(null);
                              setMainUploadedFile(null);
                            }}
                            className="absolute top-4 right-4 z-20 p-2 bg-brand-ink/80 text-brand-cream rounded-full hover:bg-brand-accent transition-all duration-300 backdrop-blur-md border border-brand-cream/10 shadow-xl"
                            title="Remove Artwork"
                          >
                            <X size={16} />
                          </button>
                          <img 
                            src={customImage} 
                            alt="Preview" 
                            className="w-full h-full object-contain drop-shadow-2xl"
                          />
                          <div className="absolute inset-0 bg-brand-ink/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <div className="bg-brand-cream text-brand-ink px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                              <Upload size={14} /> Replace Artwork
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="p-6 bg-brand-ink/5 rounded-full mb-6 group-hover:scale-110 group-hover:bg-brand-accent/20 transition-all duration-500">
                            <Upload size={32} className="text-brand-ink/40 group-hover:text-brand-accent" />
                          </div>
                          <span className="text-sm font-bold uppercase tracking-[0.2em] text-brand-ink/60 group-hover:text-brand-ink">Select Artwork</span>
                          <span className="text-[10px] text-brand-ink/30 mt-3 uppercase tracking-widest">High-resolution PNG preferred</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <div className="bg-surface border border-brand-ink/20 rounded-[2rem] p-10 shadow-xl shadow-brand-ink/5">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-accent mb-10">02. Specification</h3>
                  <div className="space-y-10">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/60 block mb-6">Base Colorway</label>
                      <div className="flex items-center gap-8">
                        {['White', 'Black'].map((color) => (
                          <button
                            key={color}
                            onClick={() => setProductColor(color)}
                            className={`group relative flex flex-col items-center gap-4`}
                          >
                            <div 
                              className={`w-14 h-14 rounded-full border-2 transition-all duration-500 flex items-center justify-center relative ${
                                productColor === color 
                                  ? 'border-brand-accent scale-110 ring-4 ring-brand-accent/30 shadow-[0_0_20px_rgba(142,141,122,0.3)]' 
                                  : 'border-brand-ink/10 hover:border-brand-ink/30'
                              }`}
                              style={{ 
                                backgroundColor: color === 'White' ? '#FFFFFF' : '#141414',
                              }}
                            >
                              <AnimatePresence>
                                {productColor === color && (
                                  <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className={`absolute inset-0 flex items-center justify-center rounded-full ${color === 'White' ? 'bg-brand-accent/10' : 'bg-white/10'}`}
                                  >
                                    <Check 
                                      size={24} 
                                      className={color === 'White' ? 'text-brand-accent' : 'text-white'} 
                                      strokeWidth={3}
                                    />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            <span className={`text-[10px] uppercase tracking-[0.2em] font-bold transition-all duration-300 ${
                              productColor === color 
                                ? 'opacity-100 text-brand-accent translate-y-0' 
                                : 'opacity-40 text-brand-ink/40 translate-y-1'
                            }`}>
                              {color}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <button 
                      onClick={handleAddCustomToCart}
                      disabled={!customImage}
                      className={`w-full py-5 rounded-full font-bold text-lg transition-all duration-500 flex items-center justify-center gap-3 shadow-2xl ${
                        customImage 
                          ? 'bg-brand-ink text-brand-cream hover:bg-brand-accent hover:shadow-brand-accent/30' 
                          : 'bg-brand-ink/20 text-brand-ink/60 cursor-not-allowed'
                      }`}
                    >
                      Add to Bag <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Info Panel */}
              <div className="bg-brand-ink text-brand-cream rounded-[2rem] p-12 flex flex-col justify-between relative overflow-hidden group shadow-2xl shadow-brand-ink/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/20 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:bg-brand-accent/30 transition-colors duration-700" />
                
                <div className="relative z-10 space-y-10">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-accent block">The Aura Standard</span>
                    <span className="px-4 py-1.5 bg-brand-accent/20 border border-brand-accent/40 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] text-brand-accent">Bespoke Studio</span>
                  </div>
                  <div>
                    <h3 className="text-4xl font-serif mb-6 leading-tight italic">Excellence in <br/>Production</h3>
                    <p className="text-brand-cream/70 leading-relaxed text-lg">
                      Our artisans meticulously review every custom creation, ensuring that every pixel of your design is translated with absolute fidelity. We utilize state-of-the-art Direct-to-Garment technology and sustainable, high-density fabrics to ensure your vision is realized with uncompromising clarity. 
                    </p>
                    <p className="text-brand-cream/40 leading-relaxed text-sm mt-4 italic">
                      Each piece undergoes a rigorous triple-check process for color accuracy, placement precision, and structural integrity, resulting in a garment that feels as premium as it looks.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-10 gap-x-12 pt-8 border-t border-brand-cream/10">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-cream/40 block mb-3">Core Material</span>
                      <span className="text-base font-medium tracking-wide">100% GOTS Certified Cotton</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-cream/40 block mb-3">Print Tech</span>
                      <span className="text-base font-medium tracking-wide">Ultra-HD Pigment Ink</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-cream/40 block mb-3">Finish</span>
                      <span className="text-base font-medium tracking-wide">Soft-Touch Matte</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-cream/40 block mb-3">Eco-Impact</span>
                      <span className="text-base font-medium tracking-wide">Water-Based Inks</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-cream/40 block mb-3">Inspection</span>
                      <span className="text-base font-medium tracking-wide">Hand-Verified</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-cream/40 block mb-3">Fit</span>
                      <span className="text-base font-medium tracking-wide">Pre-Shrunk Comfort</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 mt-12 pt-12 border-t border-brand-cream/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand-accent/20 flex items-center justify-center">
                      <CheckCircle2 size={20} className="text-brand-accent" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-brand-cream/80 block">Verified Quality</span>
                      <span className="text-[9px] uppercase tracking-widest text-brand-accent font-bold">Ethically Sourced</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-cream/30 block mb-1">Est. Delivery</span>
                    <span className="text-sm font-medium">5-7 Business Days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-brand-cream pt-24 pb-12 px-6 border-t border-border transition-colors duration-300">
        <div className="max-w-7xl mx-auto text-center flex flex-col items-center">
          <div className="flex flex-col items-center mb-6">
            <a href="#" className="text-3xl font-serif font-bold tracking-tighter leading-none">AURA</a>
            <span className="text-[9.5px] font-serif tracking-[0.55em] uppercase opacity-55 mt-1 ml-1 block" style={{ fontWeight: 300 }}>PROFESSIONAL</span>
          </div>
          <p className="text-sm opacity-40 uppercase tracking-[0.2em]">© 2026 AURA PRINT STUDIO. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div 
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md bg-brand-cream h-full shadow-2xl flex flex-col transition-colors duration-300">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-2xl font-serif">Your Bag ({cartCount})</h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-brand-ink/5 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
 
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <ShoppingBag size={48} strokeWidth={1} className="mb-4" />
                  <p className="text-sm font-medium uppercase tracking-widest">Your bag is empty</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="flex gap-4">
                    <div className="w-24 h-32 bg-brand-ink/5 rounded-xl overflow-hidden flex-shrink-0 relative">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {item.customDesign && (
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                          <img 
                            src={item.customDesign} 
                            alt="Custom" 
                            className="max-w-full max-h-full object-contain shadow-lg"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex-grow flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium">{item.name}</h3>
                          <button 
                            onClick={() => removeFromCart(item.id, item.customDesign)}
                            className="opacity-40 hover:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 bg-brand-ink/5 rounded-full px-3 py-1">
                          <button onClick={() => updateQuantity(item.id, -1, item.customDesign)}><Minus size={14} /></button>
                          <span className="text-sm font-medium">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1, item.customDesign)}><Plus size={14} /></button>
                        </div>
                        <span className="font-medium">${item.price * item.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
 
            {cart.length > 0 && (
              <div className="p-6 border-t border-border">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-sm opacity-50 uppercase tracking-widest font-bold">Subtotal</span>
                  <span className="text-2xl font-serif">${cartTotal}</span>
                </div>
                <button 
                  onClick={() => setIsOrderFormOpen(true)}
                  className="w-full bg-brand-ink text-brand-cream py-4 rounded-full font-bold text-lg hover:opacity-90 transition-colors flex items-center justify-center gap-2"
                >
                  Place Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Modal */}
      <AnimatePresence>
        {isOrderFormOpen && (
          <OrderForm 
            onClose={() => setIsOrderFormOpen(false)} 
            selectedMainCategory={selectedMainCategory}
            mainUploadedFile={mainUploadedFile}
          />
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-surface/80 backdrop-blur-xl border border-border px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
            <span className="text-sm font-medium tracking-wide">Item added to bag</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cartCount > 0 && !isCartOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-brand-ink text-brand-cream rounded-full shadow-2xl flex items-center justify-center group"
          >
            <ShoppingBag size={24} strokeWidth={1.5} />
            <span className="absolute -top-1 -right-1 bg-brand-accent text-brand-cream text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-brand-ink">
              {cartCount}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
