import React, { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, query, where, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { DHAKA_LOCATIONS, CATEGORIES } from '../utils/constants';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import Cart from '../components/Cart';
import Notification from '../components/Notification';
import { useNotification } from '../hooks/useNotification';
import { ChevronRight, Mail, X, User, Package, MapPin, Phone, Edit3, Save, AlertCircle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  category: string;
  unit: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  unit: string;
}

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  deliveryType: 'normal' | 'emergency';
  deliveryAddress: string;
  specialRequest: string;
  location: string;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  status: 'pending' | 'accepted' | 'delivered';
  createdAt: string;
  agentId?: string;
  agentName?: string;
  agentPhone?: string;
  acceptedAt?: string;
  deliveredAt?: string;
}

interface ProfileData {
  name: string;
  phone: string;
}

const SAMPLE_PRODUCTS: Product[] = [
  // Beverages (101+)
  { id: '101', name: 'Coca-Cola 250ml', image: '/images/coca-cola-250ml.jpg', price: 40, category: 'Beverages', unit: 'bottle' },
  { id: '102', name: 'Mojo 250ml', image: '/images/mojo-250ml.jpg', price: 35, category: 'Beverages', unit: 'bottle' },
  { id: '103', name: 'Fresh Cola 250ml', image: '/images/fresh-cola-250ml.jpg', price: 30, category: 'Beverages', unit: 'bottle' },
  { id: '104', name: 'Speed Energy Drink', image: '/images/speed-energy-drink.jpg', price: 40, category: 'Beverages', unit: 'bottle' },
  { id: '105', name: 'RC Cola 250ml', image: '/images/rc-cola-250ml.jpg', price: 25, category: 'Beverages', unit: 'bottle' },
  { id: '106', name: 'Clemon 250ml', image: '/images/clemon-250ml.jpg', price: 30, category: 'Beverages', unit: 'bottle' },
  { id: '107', name: 'Mountain Dew 250ml', image: '/images/mountain-dew-250ml.jpg', price: 35, category: 'Beverages', unit: 'bottle' },
  { id: '108', name: 'Fanta 250ml', image: '/images/fanta-250ml.jpg', price: 40, category: 'Beverages', unit: 'bottle' },
  { id: '109', name: 'Sprite 250ml', image: '/images/sprite-250ml.jpg', price: 40, category: 'Beverages', unit: 'bottle' },
  { id: '110', name: 'Pepsi 250ml', image: '/images/pepsi-250ml.jpg', price: 35, category: 'Beverages', unit: 'bottle' },

  // Chips & Crackers (201+)
  { id: '201', name: 'Poto Cracker', image: '/images/poto-cracker.jpg', price: 10, category: 'Chips & Crackers', unit: 'pack' },
  { id: '202', name: 'Detos Chips', image: '/images/detos-chips.jpg', price: 15, category: 'Chips & Crackers', unit: 'pack' },
  { id: '203', name: 'Mr. Twist', image: '/images/mr-twist.jpg', price: 10, category: 'Chips & Crackers', unit: 'pack' },
  { id: '204', name: 'Ring Chips', image: '/images/ring-chips.jpg', price: 10, category: 'Chips & Crackers', unit: 'pack' },
  { id: '205', name: 'Krispy Crackers', image: '/images/krispy-crackers.jpg', price: 15, category: 'Chips & Crackers', unit: 'pack' },
  { id: '206', name: 'Mr. Noodles Chips', image: '/images/mr-noodles-chips.jpg', price: 20, category: 'Chips & Crackers', unit: 'pack' },
  { id: '207', name: 'Lays Classic Small', image: '/images/lays-classic-small.jpg', price: 30, category: 'Chips & Crackers', unit: 'pack' },
  { id: '208', name: 'Onion Rings Chips', image: '/images/onion-rings-chips.jpg', price: 15, category: 'Chips & Crackers', unit: 'pack' },
  { id: '209', name: 'Cheese Balls', image: '/images/cheese-balls.jpg', price: 20, category: 'Chips & Crackers', unit: 'pack' },
  { id: '210', name: 'Tiffin Time Snacks', image: '/images/tiffin-time-snacks.jpg', price: 10, category: 'Chips & Crackers', unit: 'pack' },

  // Biscuits (301+)
  { id: '301', name: 'Milk Bikis', image: '/images/milk-bikis.jpg', price: 15, category: 'Biscuits', unit: 'pack' },
  { id: '302', name: 'Olympic Energy Plus', image: '/images/olympic-energy-plus.jpg', price: 15, category: 'Biscuits', unit: 'pack' },
  { id: '303', name: 'Parle-G', image: '/images/parle-g.jpg', price: 10, category: 'Biscuits', unit: 'pack' },
  { id: '304', name: 'Nutty Biscuit', image: '/images/nutty-biscuit.jpg', price: 20, category: 'Biscuits', unit: 'pack' },
  { id: '305', name: 'Treat Biscuit', image: '/images/treat-biscuit.jpg', price: 20, category: 'Biscuits', unit: 'pack' },
  { id: '306', name: 'Marie Biscuit', image: '/images/marie-biscuit.jpg', price: 15, category: 'Biscuits', unit: 'pack' },
  { id: '307', name: 'Digestive Biscuit', image: '/images/digestive-biscuit.jpg', price: 25, category: 'Biscuits', unit: 'pack' },
  { id: '308', name: 'Tiger Biscuit', image: '/images/tiger-biscuit.jpg', price: 10, category: 'Biscuits', unit: 'pack' },
  { id: '309', name: 'Bourbon Biscuit', image: '/images/bourbon-biscuit.jpg', price: 20, category: 'Biscuits', unit: 'pack' },
  { id: '310', name: 'Cream Cracker', image: '/images/cream-cracker.jpg', price: 20, category: 'Biscuits', unit: 'pack' },

  // Ice Cream (401+)
  { id: '401', name: 'Polar Cup Vanilla', image: '/images/polar-cup-vanilla.jpg', price: 25, category: 'Ice Cream', unit: 'piece' },
  { id: '402', name: 'Igloo Bar Chocolate', image: '/images/igloo-bar-chocolate.jpg', price: 20, category: 'Ice Cream', unit: 'piece' },
  { id: '403', name: 'Za Nanu Mango', image: '/images/za-nanu-mango.jpg', price: 15, category: 'Ice Cream', unit: 'piece' },
  { id: '404', name: 'Polar Cone Ice Cream', image: '/images/polar-cone-ice-cream.jpg', price: 35, category: 'Ice Cream', unit: 'piece' },
  { id: '405', name: 'Igloo Kulfi', image: '/images/igloo-kulfi.jpg', price: 25, category: 'Ice Cream', unit: 'piece' },
  { id: '406', name: 'Igloo Jumbo', image: '/images/igloo-jumbo.jpg', price: 40, category: 'Ice Cream', unit: 'piece' },
  { id: '407', name: 'Bellissimo Choco Cup', image: '/images/bellissimo-choco-cup.jpg', price: 50, category: 'Ice Cream', unit: 'piece' },
  { id: '408', name: 'Polar Mango Stick', image: '/images/polar-mango-stick.jpg', price: 20, category: 'Ice Cream', unit: 'piece' },
  { id: '409', name: 'Za Nanu Cone', image: '/images/za-nanu-cone.jpg', price: 20, category: 'Ice Cream', unit: 'piece' },
  { id: '410', name: 'Igloo Max Bar', image: '/images/igloo-max-bar.jpg', price: 35, category: 'Ice Cream', unit: 'piece' },

  // Instant Noodles (501+)
  { id: '501', name: 'Mr. Noodles Chicken', image: '/images/mr-noodles-chicken.jpg', price: 25, category: 'Instant Noodles', unit: 'pack' },
  { id: '502', name: 'Ifad Egg Noodles', image: '/images/ifad-egg-noodles.jpg', price: 20, category: 'Instant Noodles', unit: 'pack' },
  { id: '503', name: 'Maggie Masala Noodles', image: '/images/maggie-masala-noodles.jpg', price: 30, category: 'Instant Noodles', unit: 'pack' },
  { id: '504', name: 'Knorr Soupy Noodles', image: '/images/knorr-soupy-noodles.jpg', price: 35, category: 'Instant Noodles', unit: 'pack' },
  { id: '505', name: 'Cocola Noodles', image: '/images/cocola-noodles.jpg', price: 20, category: 'Instant Noodles', unit: 'pack' },
  { id: '506', name: 'Doodles Hot & Spicy', image: '/images/doodles-hot-spicy.jpg', price: 25, category: 'Instant Noodles', unit: 'pack' },
  { id: '507', name: 'Samyang Hot Chicken', image: '/images/samyang-hot-chicken.jpg', price: 150, category: 'Instant Noodles', unit: 'pack' },
  { id: '508', name: 'Mama Noodles', image: '/images/mama-noodles.jpg', price: 40, category: 'Instant Noodles', unit: 'pack' },
  { id: '509', name: 'Indomie Noodles', image: '/images/indomie-noodles.jpg', price: 35, category: 'Instant Noodles', unit: 'pack' },
  { id: '510', name: 'Top Ramen Masala', image: '/images/top-ramen-masala.jpg', price: 30, category: 'Instant Noodles', unit: 'pack' }
];


// Helper function to format error messages
const formatErrorMessage = (error: any): string => {
  if (!error) return 'An unknown error occurred';
  
  const errorMessage = error.message || error.toString();
  
  // Replace Firebase-specific terms
  const cleanMessage = errorMessage
    .replace(/firebase/gi, 'User')
    .replace(/firestore/gi, 'Database')
    .replace(/auth\//gi, '')
    .replace(/Firebase/gi, 'User')
    .replace(/Firestore/gi, 'Database');
  
  return cleanMessage || 'An error occurred. Please try again';
};

// Form validation functions
const validateName = (name: string): string | null => {
  if (!name.trim()) return 'Name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters';
  return null;
};

const validatePhone = (phone: string): string | null => {
  if (!phone.trim()) return 'Phone number is required';
  const phoneRegex = /^(\+88)?01[3-9]\d{8}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return 'Please enter a valid Bangladeshi phone number';
  }
  return null;
};

const validateAddress = (address: string): string | null => {
  if (!address.trim()) return 'Delivery address is required';
  if (address.trim().length < 10) return 'Please provide a complete address';
  return null;
};

const CustomerDashboard: React.FC = () => {
  const { userData, logout, updateUserData } = useAuth();
  
  // Product and cart state
  const [products] = useState(SAMPLE_PRODUCTS);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [filteredProducts, setFilteredProducts] = useState(products);
  
  // UI state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showAllCategory, setShowAllCategory] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Profile and order state
  const [profileData, setProfileData] = useState<ProfileData>({
    name: userData?.name || '',
    phone: userData?.phone || ''
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  
  // Loading states
  const [profileLoading, setProfileLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);

  // Notification system
  const {
    notification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  } = useNotification();

  // Get all unique categories from products
  const categories = Array.from(new Set(products.map(p => p.category))).sort();

  // FIXED: Get location and delivery address directly from userData (real-time)
  const userLocation = userData?.location || '';
  const savedAddress = userData?.deliveryAddress || '';

  // Load saved cart from localStorage only once on mount
  useEffect(() => {
    if (userData?.uid) {
      console.log('CustomerDashboard: Loading cart for user:', userData.uid);
      
      // Load saved cart from localStorage
      const savedCart = localStorage.getItem(`cart_${userData.uid}`);
      if (savedCart) {
        try {
          const cart = JSON.parse(savedCart);
          setCartItems(cart);
          const qty: Record<string, number> = {};
          cart.forEach((item: CartItem) => {
            qty[item.id] = item.quantity;
          });
          setQuantities(qty);
        } catch (error) {
          console.error('Error loading cart from localStorage:', error);
          localStorage.removeItem(`cart_${userData.uid}`);
        }
      }

      // Set up real-time order listener
      const ordersQuery = query(
        collection(db, 'orders'),
        where('customerId', '==', userData.uid)
      );

      const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
        const ordersList: Order[] = [];
        snapshot.forEach((doc) => {
          ordersList.push({ id: doc.id, ...doc.data() } as Order);
        });
        // Sort orders by createdAt in descending order
        ordersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(ordersList);
      }, (error) => {
        console.error('Error fetching orders:', error);
        showError('Failed to load order history: ' + formatErrorMessage(error));
      });

      return () => unsubscribe();
    }
  }, [userData?.uid, showError]);

  // Update profile data when userData changes
  useEffect(() => {
    if (userData) {
      setProfileData({
        name: userData.name || '',
        phone: userData.phone || ''
      });
    }
  }, [userData]);

  // Real-time search and category filtering
  useEffect(() => {
    let filtered = products;
    
    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }
    
    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]);

  // Close modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Close cart if clicking outside
      if (isCartOpen && !target.closest('.cart-container') && !target.closest('[data-cart-trigger]')) {
        setIsCartOpen(false);
      }
      
      // Close profile if clicking outside
      if (showProfile && !target.closest('.profile-modal') && !target.closest('[data-profile-trigger]')) {
        setShowProfile(false);
        setEditingProfile(false);
        setProfileErrors({});
      }
      
      // Close order history if clicking outside
      if (showOrderHistory && !target.closest('.order-history-modal') && !target.closest('[data-order-history-trigger]')) {
        setShowOrderHistory(false);
      }
      
      // Close category modal if clicking outside
      if (showAllCategory && !target.closest('.category-modal') && !target.closest('[data-category-trigger]')) {
        setShowAllCategory(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCartOpen, showProfile, showOrderHistory, showAllCategory]);

  // Get products by category
  const getProductsByCategory = useCallback((category: string) => {
    return filteredProducts.filter(p => p.category === category);
  }, [filteredProducts]);

  // Handle quantity changes
  const handleQuantityChange = useCallback((productId: string, quantity: number) => {
    const newQuantities = { ...quantities, [productId]: quantity };
    setQuantities(newQuantities);

    if (quantity === 0) {
      const newCartItems = cartItems.filter(item => item.id !== productId);
      setCartItems(newCartItems);
      if (userData?.uid) {
        localStorage.setItem(`cart_${userData.uid}`, JSON.stringify(newCartItems));
      }
    } else {
      const product = products.find(p => p.id === productId);
      if (product) {
        const existingItem = cartItems.find(item => item.id === productId);
        let newCartItems;
        
        if (existingItem) {
          newCartItems = cartItems.map(item => 
            item.id === productId ? { ...item, quantity } : item
          );
        } else {
          newCartItems = [...cartItems, { ...product, quantity }];
        }
        
        setCartItems(newCartItems);
        if (userData?.uid) {
          localStorage.setItem(`cart_${userData.uid}`, JSON.stringify(newCartItems));
        }
      }
    }
  }, [quantities, cartItems, products, userData?.uid]);

  // FIXED: Handle location change - only update Firestore
  const handleLocationChange = useCallback(async (location: string) => {
    console.log('CustomerDashboard: Location changing to:', location);
    
    if (userData?.uid) {
      try {
        await updateUserData({ location });
        console.log('CustomerDashboard: Location updated in database:', location);
        showSuccess('Location updated successfully');
      } catch (error) {
        console.error('CustomerDashboard: Error updating location in database:', error);
        showError('Failed to update location: ' + formatErrorMessage(error));
      }
    }
  }, [userData?.uid, updateUserData, showSuccess, showError]);

  // Handle search
  const handleSearch = useCallback((query: string, category: string) => {
    setSearchQuery(query);
    setSelectedCategory(category);
  }, []);

  // FIXED: Handle order cancellation - simplified without confirmation
  const handleCancelOrder = useCallback(async (orderId: string) => {
    if (!userData?.uid) {
      showError('Please log in to cancel orders');
      return;
    }

    setCancellingOrder(orderId);
    showInfo('Cancelling order... Please wait.');
    
    try {
      // Delete the order from Firestore
      await deleteDoc(doc(db, 'orders', orderId));
      
      showSuccess('Order cancelled successfully');
    } catch (error) {
      console.error('Error cancelling order:', error);
      showError('Failed to cancel order: ' + formatErrorMessage(error));
    } finally {
      setCancellingOrder(null);
    }
  }, [userData?.uid, showError, showInfo, showSuccess]);

  // FIXED: Handle checkout - only update Firestore for delivery address
  const handleCheckout = useCallback(async (
    deliveryType: 'normal' | 'emergency', 
    address: string, 
    specialRequest: string
  ) => {
    if (!userData?.uid) {
      showError('Please log in to place an order');
      return;
    }

    // Validate address
    const addressError = validateAddress(address);
    if (addressError) {
      showError(addressError);
      return;
    }

    if (!userLocation) {
      showError('Please select your location first');
      return;
    }

    if (cartItems.length === 0) {
      showError('Your cart is empty');
      return;
    }

    setCheckoutLoading(true);

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryCharge = deliveryType === 'normal' ? 50 : 100;
    const total = subtotal + deliveryCharge;

    const order = {
      customerId: userData.uid,
      customerName: userData.name,
      customerPhone: userData.phone,
      items: cartItems,
      deliveryType,
      deliveryAddress: address.trim(),
      specialRequest: specialRequest.trim(),
      location: userLocation,
      subtotal,
      deliveryCharge,
      total,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      agentId: null,
      agentName: null,
      agentPhone: null
    };

    try {
      // Add to Firestore orders collection
      await addDoc(collection(db, 'orders'), order);
      
      // Save delivery address to Firestore (will be synced real-time)
      await updateUserData({ deliveryAddress: address });
      
      // Clear cart
      setCartItems([]);
      setQuantities({});
      localStorage.removeItem(`cart_${userData.uid}`);
      setIsCartOpen(false);
      
      showSuccess('Order placed successfully! You will be notified when an agent accepts it.');
    } catch (error) {
      console.error('Error placing order:', error);
      showError('Failed to place order: ' + formatErrorMessage(error));
    } finally {
      setCheckoutLoading(false);
    }
  }, [userData, userLocation, cartItems, updateUserData, showSuccess, showError]);

  // Handle profile update
  const handleProfileUpdate = useCallback(async () => {
    // Validate form
    const nameError = validateName(profileData.name);
    const phoneError = validatePhone(profileData.phone);
    
    const errors: Record<string, string> = {};
    if (nameError) errors.name = nameError;
    if (phoneError) errors.phone = phoneError;
    
    setProfileErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      showError('Please fix the errors below');
      return;
    }

    setProfileLoading(true);

    try {
      await updateUserData({
        name: profileData.name.trim(),
        phone: profileData.phone.trim()
      });
      
      setEditingProfile(false);
      setProfileErrors({});
      showSuccess('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Failed to update profile: ' + formatErrorMessage(error));
    } finally {
      setProfileLoading(false);
    }
  }, [profileData, updateUserData, showSuccess, showError]);

  // Handle contact support
  const handleContactSupport = useCallback(() => {
    window.location.href = 'mailto:support@ghatpar.store?subject=Customer Support Request';
  }, []);

  // Format order status
  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-zesty-100 text-zesty-800';
      case 'accepted': return 'bg-cool-blue-100 text-cool-blue-800';
      case 'delivered': return 'bg-brand-100 text-brand-800';
      default: return 'bg-gray-light text-gray-dark';
    }
  };

  return (
    <div className="min-h-screen bg-off-white">
      {/* Notification Component */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          isVisible={notification.isVisible}
          onClose={hideNotification}
          duration={3000}
        />
      )}

      {/* FIXED: Navbar - Pass userLocation directly from userData */}
      <Navbar
        location={userLocation}
        onLocationChange={handleLocationChange}
        cartItems={cartItems}
        onCartClick={() => setIsCartOpen(true)}
        onSearch={handleSearch}
        onProfileClick={() => setShowProfile(true)}
        onOrderHistoryClick={() => setShowOrderHistory(true)}
        onLogout={logout}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Search Results or Category Filter */}
        {(searchQuery.trim() || selectedCategory !== 'All') && (
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-dark-text">
                {searchQuery.trim() 
                  ? `Search results for "${searchQuery}"` 
                  : `${selectedCategory} Products`
                }
                <span className="text-sm font-normal text-gray-medium ml-2">
                  ({filteredProducts.length} items)
                </span>
              </h2>
            </div>
            
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantity={quantities[product.id] || 0}
                    onQuantityChange={handleQuantityChange}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-medium mx-auto mb-4" />
                <p className="text-gray-medium text-lg mb-2">No products found</p>
                <p className="text-gray-medium">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        )}

        {/* Category Sections (when not searching) */}
        {!searchQuery.trim() && selectedCategory === 'All' && (
          <>
            {categories.map(category => {
              const categoryProducts = getProductsByCategory(category);
              if (categoryProducts.length === 0) return null;
              
              return (
                <div key={category} className="mb-6 sm:mb-8">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-dark-text">
                      {category}
                      <span className="text-sm font-normal text-gray-medium ml-2">
                        ({categoryProducts.length} items)
                      </span>
                    </h2>
                    {/* Always show View All button if there are products in the category */}
                    <button
                      onClick={() => setShowAllCategory(category)}
                      className="flex items-center text-brand-600 hover:text-brand-800 font-medium text-sm md:text-base transition-colors"
                      data-category-trigger
                    >
                      View All <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                    </button>
                  </div>
                  <div className="flex space-x-3 sm:space-x-4 md:space-x-5 lg:space-x-6 overflow-x-auto pb-4 scrollbar-hide">
                    {categoryProducts.slice(0, 6).map(product => (
                      <div key={product.id} className="flex-shrink-0">
                        <ProductCard
                          product={product}
                          quantity={quantities[product.id] || 0}
                          onQuantityChange={handleQuantityChange}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Empty state when no categories have products */}
        {!searchQuery.trim() && selectedCategory === 'All' && 
         categories.every(cat => getProductsByCategory(cat).length === 0) && (
          <div className="text-center py-20">
            <Package className="w-20 h-20 text-gray-medium mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-dark mb-2">No Products Available</h3>
            <p className="text-gray-medium">Products will appear here once they are added to the inventory</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-light py-4 sm:py-6 mt-8 sm:mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <button
            onClick={handleContactSupport}
            className="flex items-center justify-center mx-auto text-brand-600 hover:text-brand-800 font-medium text-sm sm:text-base transition-colors"
          >
            <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Contact Support
          </button>
        </div>
      </footer>

      {/* Shopping Cart */}
      <div className="cart-container">
        <Cart
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          onQuantityChange={handleQuantityChange}
          onRemoveItem={(productId) => handleQuantityChange(productId, 0)}
          onCheckout={handleCheckout}
          userLocation={userLocation}
          savedAddress={savedAddress}
        />
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="profile-modal bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-light">
            <div className="sticky top-0 bg-white border-b border-gray-light px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h2 className="text-lg sm:text-xl font-bold flex items-center text-dark-text">
                <User className="w-5 h-5 mr-2" />
                Profile
              </h2>
              <button
                onClick={() => {
                  setShowProfile(false);
                  setEditingProfile(false);
                  setProfileErrors({});
                }}
                className="text-gray-medium hover:text-gray-dark p-1 rounded-full hover:bg-gray-light transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6">
              {editingProfile ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-dark mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => {
                        setProfileData({...profileData, name: e.target.value});
                        if (profileErrors.name) {
                          setProfileErrors({...profileErrors, name: ''});
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 text-sm sm:text-base ${
                        profileErrors.name ? 'border-fresh-red-500' : 'border-gray-light'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {profileErrors.name && (
                      <div className="flex items-center mt-1 text-fresh-red-600 text-xs">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {profileErrors.name}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-dark mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => {
                        setProfileData({...profileData, phone: e.target.value});
                        if (profileErrors.phone) {
                          setProfileErrors({...profileErrors, phone: ''});
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 text-sm sm:text-base ${
                        profileErrors.phone ? 'border-fresh-red-500' : 'border-gray-light'
                      }`}
                      placeholder="01XXXXXXXXX"
                    />
                    {profileErrors.phone && (
                      <div className="flex items-center mt-1 text-fresh-red-600 text-xs">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {profileErrors.phone}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={handleProfileUpdate}
                      disabled={profileLoading}
                      className="flex-1 bg-appetite-500 text-white py-2 rounded-lg hover:bg-appetite-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex items-center justify-center transition-colors"
                    >
                      {profileLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingProfile(false);
                        setProfileData({
                          name: userData?.name || '',
                          phone: userData?.phone || ''
                        });
                        setProfileErrors({});
                      }}
                      disabled={profileLoading}
                      className="flex-1 border border-gray-light text-gray-dark py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm sm:text-base transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-off-white p-4 rounded-lg border border-gray-light">
                    <div className="text-xs text-gray-medium mb-1">User ID</div>
                    <div className="text-xs font-mono text-gray-dark break-all">{userData?.uid}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-dark mb-1">Name</div>
                    <div className="text-sm sm:text-base text-dark-text">{userData?.name || 'Not set'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-dark mb-1">Email</div>
                    <div className="text-sm sm:text-base text-dark-text">{userData?.email}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-dark mb-1">Phone</div>
                    <div className="text-sm sm:text-base text-dark-text">{userData?.phone || 'Not set'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-dark mb-1">Location</div>
                    <div className="flex items-center text-sm sm:text-base text-dark-text">
                      <MapPin className="w-4 h-4 mr-1 text-gray-medium" />
                      {userLocation || 'Not set'}
                    </div>
                  </div>
                  
                  <div className="bg-cool-blue-50 p-3 rounded-lg border border-cool-blue-200">
                    <div className="text-xs text-cool-blue-800 font-medium mb-1">Note</div>
                    <div className="text-xs text-cool-blue-700">
                      To change your location, use the location selector in the navbar above.
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setEditingProfile(true);
                      setProfileData({
                        name: userData?.name || '',
                        phone: userData?.phone || ''
                      });
                    }}
                    className="w-full bg-appetite-500 text-white py-2 rounded-lg hover:bg-appetite-600 text-sm sm:text-base flex items-center justify-center transition-colors"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order History Modal */}
      {showOrderHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="order-history-modal bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-light">
            <div className="sticky top-0 bg-white border-b border-gray-light px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h2 className="text-lg sm:text-xl font-bold flex items-center text-dark-text">
                <Package className="w-5 h-5 mr-2" />
                Order History
              </h2>
              <button
                onClick={() => setShowOrderHistory(false)}
                className="text-gray-medium hover:text-gray-dark p-1 rounded-full hover:bg-gray-light transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6">
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-medium mx-auto mb-4" />
                  <p className="text-gray-medium text-lg mb-2">No orders yet</p>
                  <p className="text-gray-medium">Your order history will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.id} className="border border-gray-light rounded-lg p-4 hover:bg-off-white transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-medium text-sm sm:text-base text-dark-text">
                            Order #{order.id?.slice(-6) || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-medium">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          {/* FIXED: Cancel Order Button - Only show for pending orders with clear label */}
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={cancellingOrder === order.id}
                              className="px-3 py-1 text-xs font-medium text-fresh-red-600 hover:text-fresh-red-800 hover:bg-fresh-red-50 border border-fresh-red-300 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Cancel Order"
                            >
                              {cancellingOrder === order.id ? 'Cancelling...' : 'Cancel Order'}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-dark">Items</div>
                          <div className="font-medium text-dark-text">{order.items.length} items</div>
                        </div>
                        <div>
                          <div className="text-gray-dark">Total</div>
                          <div className="font-medium text-brand-600">৳{order.total}</div>
                        </div>
                        <div>
                          <div className="text-gray-dark">Delivery</div>
                          <div className="font-medium text-dark-text capitalize">{order.deliveryType}</div>
                        </div>
                        <div>
                          <div className="text-gray-dark">Location</div>
                          <div className="font-medium text-dark-text">{order.location}</div>
                        </div>
                      </div>
                      
                      {order.agentName && (
                        <div className="mt-3 pt-3 border-t border-gray-light">
                          <div className="text-xs text-gray-dark mb-1">Agent Details</div>
                          <div className="flex items-center text-sm">
                            <User className="w-4 h-4 mr-1 text-gray-medium" />
                            <span className="font-medium mr-2 text-dark-text">{order.agentName}</span>
                            {order.agentPhone && (
                              <a 
                                href={`tel:${order.agentPhone}`}
                                className="flex items-center text-brand-600 hover:text-brand-800 transition-colors"
                              >
                                <Phone className="w-3 h-3 mr-1" />
                                {order.agentPhone}
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Category View All Modal - FIXED VERTICAL SPACING */}
      {showAllCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="category-modal bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-y-auto border border-gray-light">
            <div className="sticky top-0 bg-white border-b border-gray-light px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h2 className="text-lg sm:text-xl font-bold text-dark-text">
                {showAllCategory}
                <span className="text-sm font-normal text-gray-medium ml-2">
                  ({getProductsByCategory(showAllCategory).length} items)
                </span>
              </h2>
              <button
                onClick={() => setShowAllCategory(null)}
                className="text-gray-medium hover:text-gray-dark p-1 rounded-full hover:bg-gray-light transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6">
              {/* FIXED: Added proper vertical spacing with gap-y-4 sm:gap-y-5 md:gap-y-6 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-x-3 gap-y-4 sm:gap-x-4 sm:gap-y-5 md:gap-x-5 md:gap-y-6 lg:gap-x-6 lg:gap-y-6">
                {getProductsByCategory(showAllCategory).map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    quantity={quantities[product.id] || 0}
                    onQuantityChange={handleQuantityChange}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;