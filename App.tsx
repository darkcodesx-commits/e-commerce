import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { Chatbot } from './components/Chatbot';
import { RecommendationSection } from './components/RecommendationSection';
import { Product, CartItem, ViewState } from './types';
import { ArrowLeft, Trash2, ShoppingBag } from 'lucide-react';

// Mock Data - Removed Audio and Laptops (IDs 1, 4, 6)
const PRODUCTS: Product[] = [
  {
    id: '2',
    name: 'NeoVision 4K Monitor',
    category: 'Monitors',
    price: 450,
    description: '32-inch bezel-less IPS display with 144Hz refresh rate for creators.',
    image: 'https://picsum.photos/id/2/600/600',
    features: ['4K UHD', '144Hz', 'USB-C Hub']
  },
  {
    id: '3',
    name: 'Zenith Mechanical Keyboard',
    category: 'Accessories',
    price: 129,
    description: 'Hot-swappable tactile switches with RGB per-key lighting.',
    image: 'https://picsum.photos/id/3/600/600',
    features: ['RGB', 'Hot-swappable', 'Aluminum Case']
  },
  {
    id: '5',
    name: 'Titan Smartwatch',
    category: 'Wearables',
    price: 199,
    description: 'Fitness tracking, heart rate monitoring, and 7-day battery.',
    image: 'https://picsum.photos/id/5/600/600',
    features: ['GPS', 'Waterproof', 'Sleep Tracking']
  },
  {
    id: '7',
    name: 'PixelLens Camera',
    category: 'Photography',
    price: 899,
    description: 'Mirrorless camera with 24MP sensor and 4K video recording.',
    image: 'https://picsum.photos/id/250/600/600',
    features: ['4K Video', 'IBIS', 'Wi-Fi']
  },
  {
    id: '8',
    name: 'ErgoLife Office Chair',
    category: 'Furniture',
    price: 350,
    description: 'Ergonomic mesh chair with adjustable lumbar support.',
    image: 'https://picsum.photos/id/8/600/600',
    features: ['Lumbar Support', 'Breathable', 'Reclining']
  }
];

const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState('All');

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setCurrentView(ViewState.PRODUCT_DETAIL);
  };

  const handleHomeClick = () => {
    setCurrentView(ViewState.HOME);
    setCategory('All');
    setSelectedProduct(null);
  };

  const handleCartClick = () => {
    setCurrentView(ViewState.CART);
  };

  const handleCategoryClick = (cat: string) => {
    setCategory(cat);
    setCurrentView(ViewState.HOME);
    setSelectedProduct(null);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Filter Products based on Category
  const filteredProducts = PRODUCTS.filter(p => {
    if (category === 'All') return true;
    if (category === 'New Arrivals') {
      // Logic for New Arrivals (Updated for current inventory)
      return ['2', '5', '7', '8'].includes(p.id);
    }
    return p.category === category;
  });

  // --- Views ---

  const renderHome = () => (
    <div className="space-y-12">
      {/* Hero Section - Only show on 'All' or 'New Arrivals' */}
      {(category === 'All' || category === 'New Arrivals') && (
        <div className="relative bg-gray-900 rounded-3xl overflow-hidden shadow-2xl mx-4 lg:mx-0">
          <div className="absolute inset-0">
             <img src="https://picsum.photos/id/201/1200/600" className="w-full h-full object-cover opacity-50" alt="Technology" />
          </div>
          <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8 flex flex-col items-center text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6">
              {category === 'New Arrivals' ? 'Just Landed.' : 'Future Tech. Today.'}
            </h1>
            <p className="mt-6 text-xl text-gray-300 max-w-3xl">
              Discover the latest gadgets and electronics curated by AI. Experience the new standard of shopping with TechNova.
            </p>
          </div>
        </div>
      )}

      {/* Recs */}
      {category === 'All' && (
         <RecommendationSection cartItems={cart} allProducts={PRODUCTS} onAddToCart={addToCart} />
      )}

      <div>
        <div className="flex items-center justify-between mb-6 px-4 lg:px-0">
           <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
           <span className="text-sm text-gray-500">{filteredProducts.length} Products</span>
        </div>
        
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 lg:px-0 pb-12">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={addToCart}
                onClick={handleProductClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300 mx-4 lg:mx-0">
            <p className="text-gray-500">No products found in this category.</p>
            <button 
              onClick={() => setCategory('All')}
              className="mt-4 text-indigo-600 font-medium hover:underline"
            >
              View All Products
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderProductDetail = () => {
    if (!selectedProduct) return null;
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button 
          onClick={handleHomeClick}
          className="flex items-center text-sm text-gray-500 hover:text-indigo-600 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Shop
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-square rounded-3xl overflow-hidden bg-gray-100 shadow-lg">
            <img 
              src={selectedProduct.image} 
              alt={selectedProduct.name} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-indigo-600 font-bold uppercase tracking-wide text-sm mb-2">
              {selectedProduct.category}
            </span>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{selectedProduct.name}</h1>
            <p className="text-3xl text-gray-900 font-bold mb-6">${selectedProduct.price}</p>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              {selectedProduct.description}
            </p>

            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">Key Features</h3>
              <ul className="space-y-2">
                {selectedProduct.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-gray-600">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <button 
              onClick={() => addToCart(selectedProduct)}
              className="w-full bg-gray-900 text-white py-4 px-8 rounded-xl font-bold text-lg hover:bg-indigo-600 transition-colors shadow-lg hover:shadow-indigo-500/30"
            >
              Add to Cart
            </button>
          </div>
        </div>
        
        <div className="mt-12">
          <RecommendationSection 
            cartItems={cart.length > 0 ? cart : [selectedProduct]} 
            allProducts={PRODUCTS} 
            onAddToCart={addToCart} 
          />
        </div>
      </div>
    );
  };

  const renderCart = () => (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h2>
      
      {cart.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300">
          <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-xl text-gray-500 mb-6">Your cart is empty</p>
          <button 
            onClick={handleHomeClick}
            className="text-indigo-600 font-semibold hover:text-indigo-800"
          >
            Start Shopping &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.map(item => (
              <div key={item.id} className="flex items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover object-center" />
                </div>
                <div className="ml-4 flex-1 flex flex-col">
                  <div>
                    <div className="flex justify-between text-base font-medium text-gray-900">
                      <h3>{item.name}</h3>
                      <p className="ml-4">${item.price * item.quantity}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{item.category}</p>
                  </div>
                  <div className="flex flex-1 items-end justify-between text-sm">
                    <div className="flex items-center space-x-2">
                       <button 
                         onClick={() => updateQuantity(item.id, -1)}
                         className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                       >-</button>
                       <span className="font-medium text-gray-900">{item.quantity}</span>
                       <button 
                         onClick={() => updateQuantity(item.id, 1)}
                         className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                       >+</button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      type="button" 
                      className="font-medium text-red-500 hover:text-red-600 flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
            <div className="flow-root">
              <dl className="-my-4 divide-y divide-gray-200 text-sm">
                <div className="flex items-center justify-between py-4">
                  <dt className="text-gray-600">Subtotal</dt>
                  <dd className="font-medium text-gray-900">${cartTotal.toLocaleString()}</dd>
                </div>
                <div className="flex items-center justify-between py-4">
                  <dt className="text-gray-600">Shipping</dt>
                  <dd className="font-medium text-gray-900">
                    {cartTotal > 500 ? 'Free' : '$15.00'}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-4 border-t border-gray-200">
                  <dt className="text-base font-bold text-gray-900">Order Total</dt>
                  <dd className="text-base font-bold text-indigo-600">
                    ${(cartTotal + (cartTotal > 500 ? 0 : 15)).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>
            <button className="w-full mt-6 bg-indigo-600 border border-transparent rounded-xl shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all">
              Checkout
            </button>
            <p className="mt-4 text-xs text-gray-500 text-center">
              Secure Checkout powered by TechNova Pay
            </p>
          </div>
        </div>
      )}
      
      {/* Show Recs even in cart */}
      <RecommendationSection cartItems={cart} allProducts={PRODUCTS} onAddToCart={addToCart} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar 
        cartCount={cartCount} 
        onCartClick={handleCartClick} 
        onHomeClick={handleHomeClick}
        onCategoryClick={handleCategoryClick}
        activeCategory={category}
        currentView={currentView}
      />
      
      <main className="max-w-7xl mx-auto py-8">
        {currentView === ViewState.HOME && renderHome()}
        {currentView === ViewState.PRODUCT_DETAIL && renderProductDetail()}
        {currentView === ViewState.CART && renderCart()}
      </main>

      <Chatbot products={PRODUCTS} />
    </div>
  );
};

export default App;