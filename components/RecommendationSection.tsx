import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Product, Recommendation } from '../types';
import { getRecommendations } from '../services/geminiService';

interface RecommendationSectionProps {
  cartItems: Product[];
  allProducts: Product[];
  onAddToCart: (product: Product) => void;
}

export const RecommendationSection: React.FC<RecommendationSectionProps> = ({ cartItems, allProducts, onAddToCart }) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only fetch if cart has items
    if (cartItems.length === 0) {
      setRecommendations([]);
      return;
    }

    const fetchRecommendations = async () => {
      setLoading(true);
      const recs = await getRecommendations(cartItems, allProducts);
      setRecommendations(recs);
      setLoading(false);
    };

    // Debounce to prevent API spam
    const timeoutId = setTimeout(fetchRecommendations, 1000);
    return () => clearTimeout(timeoutId);
  }, [cartItems, allProducts]);

  if (cartItems.length === 0 || recommendations.length === 0) return null;

  return (
    <div className="my-12 animate-fade-in">
      <div className="flex items-center space-x-2 mb-6">
        <Sparkles className="h-6 w-6 text-indigo-500" />
        <h2 className="text-2xl font-bold text-gray-900">AI Suggested For You</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          // Skeleton Loading
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 h-48 animate-pulse flex flex-col justify-between">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-12 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))
        ) : (
          recommendations.map((rec) => {
            const product = allProducts.find(p => p.id === rec.productId);
            if (!product) return null;

            return (
              <div key={rec.productId} className="bg-white p-5 rounded-xl border border-indigo-50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                
                <div className="flex justify-between items-start mb-3">
                   <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0 mr-4">
                     <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                   </div>
                   <div>
                     <h3 className="font-bold text-gray-900 line-clamp-1">{product.name}</h3>
                     <p className="text-sm font-semibold text-indigo-600">${product.price}</p>
                   </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded-lg">
                    "{rec.reason}"
                  </p>
                </div>

                <button
                  onClick={() => onAddToCart(product)}
                  className="w-full py-2 px-4 bg-white border border-indigo-600 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors flex items-center justify-center group"
                >
                  Add to Cart
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};