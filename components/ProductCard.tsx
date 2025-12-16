import React from 'react';
import { Plus } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onClick: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onClick }) => {
  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden h-full">
      <div className="aspect-[4/3] w-full overflow-hidden bg-gray-200 relative cursor-pointer" onClick={() => onClick(product)}>
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
      </div>
      
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
          {product.category}
        </p>
        <h3 
          className="text-lg font-bold text-gray-900 mb-2 cursor-pointer hover:text-indigo-600 transition-colors"
          onClick={() => onClick(product)}
        >
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between mt-auto">
          <p className="text-lg font-bold text-gray-900">${product.price.toLocaleString()}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="inline-flex items-center justify-center rounded-full bg-gray-900 p-2 text-white hover:bg-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};