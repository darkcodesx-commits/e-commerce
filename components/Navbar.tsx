import React, { useState } from 'react';
import { ShoppingCart, Zap, Menu, X, Search } from 'lucide-react';
import { ViewState } from '../types';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  onHomeClick: () => void;
  onCategoryClick: (category: string) => void;
  activeCategory: string;
  currentView: ViewState;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  cartCount, 
  onCartClick, 
  onHomeClick, 
  onCategoryClick,
  activeCategory,
  currentView 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Removed Audio and Laptops. Added Monitors, Photography, Furniture to match remaining inventory.
  const categories = ['All', 'New Arrivals', 'Monitors', 'Accessories', 'Wearables', 'Photography', 'Furniture'];

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <div className="flex items-center cursor-pointer group" onClick={onHomeClick}>
            <div className="bg-indigo-600 rounded-lg p-1.5 group-hover:bg-indigo-700 transition-colors">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="ml-2.5 text-xl font-bold text-gray-900 tracking-tight group-hover:text-indigo-600 transition-colors">
              TechNova
            </span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 overflow-x-auto no-scrollbar mx-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onCategoryClick(cat)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  activeCategory === cat && currentView === ViewState.HOME
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          {/* Icons */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
              <Search className="h-5 w-5" />
            </button>
            
            <button 
              onClick={onCartClick}
              className="relative p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full transition-colors group"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none text-white transform bg-red-500 rounded-full ring-2 ring-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white absolute w-full shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  onCategoryClick(cat);
                  setIsMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                   activeCategory === cat
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};