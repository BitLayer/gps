import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  category: string;
  unit: string;
}

interface ProductCardProps {
  product: Product;
  quantity: number;
  onQuantityChange: (productId: string, quantity: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, quantity, onQuantityChange }) => {
  const handleMinus = () => {
    if (quantity > 0) {
      onQuantityChange(product.id, quantity - 1);
    }
  };

  const handlePlus = () => {
    onQuantityChange(product.id, quantity + 1);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow product-card-responsive border border-gray-200">
      <div className="relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-24 xs:h-28 sm:h-32 md:h-36 object-cover"
          loading="lazy"
        />
      </div>
      
      <div className="p-2 xs:p-3 sm:p-4">
        <h3 className="font-medium text-xs xs:text-sm sm:text-base text-gray-900 mb-2 line-clamp-2 min-h-[2rem] xs:min-h-[2.5rem] sm:min-h-[3rem] leading-tight">
          {product.name}
        </h3>
        
        <div className="mb-3">
          <div className="text-green-600 font-bold text-sm xs:text-base sm:text-lg">
            ৳{product.price}
          </div>
          <div className="text-xs text-gray-500">
            per {product.unit}
          </div>
        </div>
        
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2 xs:space-x-3">
            <button
              onClick={handleMinus}
              disabled={quantity === 0}
              className="touch-target w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 rounded-full border-2 border-green-500 flex items-center justify-center text-green-600 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="w-3 h-3 xs:w-4 xs:h-4" />
            </button>
            
            <span className="w-6 xs:w-8 sm:w-10 text-center font-bold text-sm xs:text-base sm:text-lg text-gray-900">
              {quantity}
            </span>
            
            <button
              onClick={handlePlus}
              className="touch-target w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 rounded-full bg-green-600 flex items-center justify-center text-white hover:bg-green-700 transition-colors"
            >
              <Plus className="w-3 h-3 xs:w-4 xs:h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;