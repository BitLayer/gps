import React, { useState, useEffect } from 'react';
import { X, Minus, Plus, Clock, Zap, MapPin } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  unit: string;
}

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: (deliveryType: 'normal' | 'emergency', address: string, specialRequest: string) => void;
  userLocation: string;
  savedAddress: string;
}

const Cart: React.FC<CartProps> = ({
  isOpen,
  onClose,
  items,
  onQuantityChange,
  onRemoveItem,
  onCheckout,
  userLocation,
  savedAddress
}) => {
  const [deliveryType, setDeliveryType] = useState<'normal' | 'emergency'>('normal');
  const [deliveryAddress, setDeliveryAddress] = useState(savedAddress);
  const [specialRequest, setSpecialRequest] = useState('');

  useEffect(() => {
    setDeliveryAddress(savedAddress);
  }, [savedAddress]);

  // Prevent body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryCharge = deliveryType === 'normal' ? 50 : 100;
  const total = subtotal + deliveryCharge;

  const handleCheckout = () => {
    if (!userLocation) {
      alert('Please select your location first');
      return;
    }
    if (!deliveryAddress.trim()) {
      alert('Please enter your delivery address');
      return;
    }
    onCheckout(deliveryType, deliveryAddress, specialRequest);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
      {/* Backdrop */}
      <div 
        className="flex-1"
        onClick={onClose}
      />
      
      {/* Cart Panel - Mobile First with Responsive Design */}
      <div className="w-full max-w-md bg-white shadow-xl overflow-y-auto ml-auto flex flex-col max-h-screen">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-light px-4 py-4 flex items-center justify-between shadow-sm">
          <h2 className="text-lg font-bold text-dark-text">Shopping Cart</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-dark" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-20 h-20 bg-gray-light rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🛒</span>
              </div>
              <p className="text-gray-medium text-center">Your cart is empty</p>
              <p className="text-sm text-gray-medium text-center mt-1">Add some products to get started</p>
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {/* Cart Items */}
              <div className="space-y-3">
                <h3 className="font-semibold text-dark-text mb-3">Items ({items.length})</h3>
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 bg-off-white p-3 rounded-xl border border-gray-light">
                    {/* Product Image - Responsive sizing */}
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-cover rounded-lg flex-shrink-0" 
                    />
                    
                    {/* Product Details - Flexible container */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-dark-text line-clamp-2 mb-1 leading-tight">
                        {item.name}
                      </h4>
                      <p className="text-brand-600 font-bold text-sm">
                        ৳{item.price} <span className="text-gray-medium font-normal">/{item.unit}</span>
                      </p>
                    </div>
                    
                    {/* Quantity Controls - Compact responsive design */}
                    <div className="flex flex-col items-center space-y-2 flex-shrink-0">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 border-brand-500 flex items-center justify-center text-brand-600 hover:bg-brand-50 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-bold text-sm text-dark-text">{item.quantity}</span>
                        <button
                          onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-appetite-500 flex items-center justify-center text-white hover:bg-appetite-600 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-fresh-red-500 hover:text-fresh-red-700 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Location Display */}
              <div className="bg-cool-blue-50 p-3 rounded-xl border border-cool-blue-200">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-cool-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-cool-blue-800 text-sm">Delivery Location</div>
                    <div className="text-sm text-cool-blue-600 truncate">{userLocation || 'Not selected'}</div>
                  </div>
                </div>
              </div>

              {/* Delivery Type */}
              <div>
                <h3 className="font-semibold text-dark-text mb-3">Delivery Options</h3>
                <div className="space-y-3">
                  <label className="flex items-start space-x-3 cursor-pointer p-3 border-2 rounded-xl transition-colors hover:bg-gray-50 border-gray-light has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                    <input
                      type="radio"
                      value="normal"
                      checked={deliveryType === 'normal'}
                      onChange={(e) => setDeliveryType(e.target.value as 'normal')}
                      className="mt-1 text-brand-600 focus:ring-brand-500 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-dark flex-shrink-0" />
                        <span className="font-medium text-sm text-dark-text">Normal Delivery</span>
                      </div>
                      <p className="text-sm text-gray-dark mt-1">1-2 hours • ৳50 delivery charge</p>
                    </div>
                  </label>
                  
                  <label className="flex items-start space-x-3 cursor-pointer p-3 border-2 rounded-xl transition-colors hover:bg-gray-50 border-gray-light has-[:checked]:border-appetite-500 has-[:checked]:bg-appetite-50">
                    <input
                      type="radio"
                      value="emergency"
                      checked={deliveryType === 'emergency'}
                      onChange={(e) => setDeliveryType(e.target.value as 'emergency')}
                      className="mt-1 text-appetite-600 focus:ring-appetite-500 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-appetite-500 flex-shrink-0" />
                        <span className="font-medium text-sm text-dark-text">Emergency Delivery</span>
                      </div>
                      <p className="text-sm text-gray-dark mt-1">30-60 minutes • ৳100 delivery charge</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block font-semibold text-dark-text mb-2">
                  Delivery Address *
                </label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter your complete delivery address with house number, road, area..."
                  className="w-full p-3 border border-gray-light rounded-xl resize-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                  rows={3}
                />
              </div>

              {/* Special Request */}
              <div>
                <label className="block font-semibold text-dark-text mb-2">
                  Special Instructions (Optional)
                </label>
                <textarea
                  value={specialRequest}
                  onChange={(e) => setSpecialRequest(e.target.value)}
                  placeholder="Any special instructions for delivery..."
                  className="w-full p-3 border border-gray-light rounded-xl resize-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer - Order Summary & Checkout */}
        {items.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t border-gray-light p-4 space-y-4">
            {/* Order Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-dark">Subtotal ({items.length} items)</span>
                <span className="font-medium text-dark-text">৳{subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-dark">Delivery Charge</span>
                <span className="font-medium text-dark-text">৳{deliveryCharge}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-light pt-2">
                <span className="text-dark-text">Total</span>
                <span className="text-brand-600">৳{total}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={items.length === 0 || !userLocation}
              className="w-full bg-appetite-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-appetite-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              Place Order • ৳{total}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;