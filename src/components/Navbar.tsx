import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, User, Search, MapPin, Menu, X } from 'lucide-react';
import { DHAKA_LOCATIONS, CATEGORIES } from '../utils/constants';

interface NavbarProps {
  location: string;
  onLocationChange: (location: string) => void;
  cartItems: any[];
  onCartClick: () => void;
  onSearch: (query: string, category: string) => void;
  onProfileClick: () => void;
  onOrderHistoryClick: () => void;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  location,
  onLocationChange,
  cartItems,
  onCartClick,
  onSearch,
  onProfileClick,
  onOrderHistoryClick,
  onLogout
}) => {
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // FIXED: Create Two Separate Refs
  const desktopLocationRef = useRef<HTMLDivElement>(null);
  const mobileLocationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Debug: Log location changes
  useEffect(() => {
    console.log('Navbar: Location prop changed to:', location);
  }, [location]);

  // FIXED: Update Click Outside Handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // FIXED: Check both desktop and mobile location refs
      const clickedOutsideDesktop = desktopLocationRef.current && !desktopLocationRef.current.contains(target);
      const clickedOutsideMobile = mobileLocationRef.current && !mobileLocationRef.current.contains(target);

      if (showLocationDropdown && clickedOutsideDesktop && clickedOutsideMobile) {
        setShowLocationDropdown(false);
      }
      
      if (profileRef.current && !profileRef.current.contains(target)) {
        if (showProfileDropdown) {
          setShowProfileDropdown(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLocationDropdown, showProfileDropdown]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery, selectedCategory);
  };

  const handleLocationSelect = (selectedLocation: string) => {
    console.log('Navbar: Location selected:', selectedLocation);
    // FIXED: Close dropdown first to avoid React batching delays
    setShowLocationDropdown(false);
    onLocationChange(selectedLocation);
  };

  const toggleLocationDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowLocationDropdown(!showLocationDropdown);
  };

  // Update search when query or category changes
  useEffect(() => {
    onSearch(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory, onSearch]);

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-light">
      {/* Main container with proper responsive constraints */}
      <div className="w-full max-w-7xl mx-auto">
        {/* Responsive padding container */}
        <div className="px-2 sm:px-4 lg:px-6">
          {/* Top row - Logo and Actions */}
          <div className="flex items-center justify-between h-16 sm:h-18 lg:h-20">
            {/* Logo - Increased size significantly */}
            <div className="flex-shrink-0 cursor-pointer" onClick={() => window.location.reload()}>
              <div className="flex items-center space-x-2">
                <img 
                  src="/Logo.png" 
                  alt="Ghatpar.com" 
                  className="h-12 w-auto sm:h-14 md:h-16 lg:h-18 xl:h-20"
                />
              </div>
            </div>

            {/* Desktop Search Bar - Hidden on mobile */}
            <div className="hidden lg:flex flex-1 max-w-2xl mx-6">
              <form onSubmit={handleSearch} className="flex w-full">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-r-0 rounded-l-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 border-gray-light"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products..."
                  className="flex-1 px-4 py-2 border-t border-b border-gray-light focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-appetite-500 text-white rounded-r-lg hover:bg-appetite-600 focus:outline-none focus:ring-2 focus:ring-appetite-500 transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* FIXED: Desktop Location Dropdown - Updated ref */}
            <div className="hidden lg:flex relative mr-4" ref={desktopLocationRef}>
              <button
                key={location} // Keep button key for additional re-render guarantee
                onClick={toggleLocationDropdown}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-light rounded-lg hover:bg-gray-50 whitespace-nowrap min-w-[160px] justify-between transition-colors"
                type="button"
              >
                <div className="flex items-center space-x-1 flex-1 min-w-0">
                  <MapPin className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  {/* FIXED: Ensure proper text display without truncate */}
                  <span className="text-sm font-medium text-left max-w-[120px]">
                    {location || 'Select Location'}
                  </span>
                </div>
                <svg 
                  className={`w-4 h-4 text-gray-medium transition-transform duration-200 flex-shrink-0 ${showLocationDropdown ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showLocationDropdown && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-light rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                  <div className="p-2 border-b bg-off-white">
                    <p className="text-xs font-medium text-gray-dark">Select your delivery location</p>
                  </div>
                  {DHAKA_LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleLocationSelect(loc);
                      }}
                      type="button"
                      className={`block w-full text-left px-4 py-3 hover:bg-brand-50 text-sm transition-colors border-b border-gray-light last:border-b-0 ${
                        location === loc ? 'bg-brand-100 text-brand-800 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-medium" />
                        <span>{loc}</span>
                        {location === loc && (
                          <span className="ml-auto text-brand-600 font-bold">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Side Actions - Properly contained */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* FIXED: Mobile Location Button - Updated ref */}
              <div className="lg:hidden relative" ref={mobileLocationRef}>
                <button
                  onClick={toggleLocationDropdown}
                  type="button"
                  className="p-2 text-gray-dark hover:text-brand-500 relative transition-colors"
                >
                  <MapPin className="w-5 h-5" />
                  {!location && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-fresh-red-500 rounded-full animate-pulse"></span>
                  )}
                </button>
                
                {showLocationDropdown && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-72 bg-white border border-gray-light rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                    <div className="p-2 border-b bg-off-white">
                      <p className="text-xs font-medium text-gray-dark">Select your location</p>
                    </div>
                    {DHAKA_LOCATIONS.map((loc) => (
                      <button
                        key={loc}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleLocationSelect(loc);
                        }}
                        type="button"
                        className={`block w-full text-left px-4 py-3 hover:bg-brand-50 text-sm transition-colors border-b border-gray-light last:border-b-0 ${
                          location === loc ? 'bg-brand-100 text-brand-800 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-medium" />
                          <span>{loc}</span>
                          {location === loc && (
                            <span className="ml-auto text-brand-600 font-bold">✓</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Button */}
              <button
                onClick={onCartClick}
                type="button"
                className="relative p-2 text-gray-dark hover:text-brand-500 transition-colors"
                data-cart-trigger
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-appetite-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                    {cartItems.length > 9 ? '9+' : cartItems.length}
                  </span>
                )}
              </button>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  type="button"
                  className="p-2 text-gray-dark hover:text-brand-500 transition-colors"
                  data-profile-trigger
                >
                  <User className="w-5 h-5" />
                </button>
                
                {showProfileDropdown && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-light rounded-lg shadow-lg z-50">
                    <button
                      onClick={() => {
                        onProfileClick();
                        setShowProfileDropdown(false);
                      }}
                      type="button"
                      className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm transition-colors"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        onOrderHistoryClick();
                        setShowProfileDropdown(false);
                      }}
                      type="button"
                      className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm transition-colors"
                    >
                      Order History
                    </button>
                    <button
                      onClick={() => {
                        onLogout();
                        setShowProfileDropdown(false);
                      }}
                      type="button"
                      className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-fresh-red-600 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Search Bar - Properly contained within navbar */}
          <div className="lg:hidden border-t border-gray-light py-3">
            <form onSubmit={handleSearch} className="flex space-x-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2 py-2 border border-gray-light rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 flex-shrink-0 min-w-0"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="flex flex-1 min-w-0">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="flex-1 px-3 py-2 border border-gray-light rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 min-w-0"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-appetite-500 text-white rounded-r-lg hover:bg-appetite-600 transition-colors flex-shrink-0"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Mobile Location Notice - Only show when no location selected */}
          {!location && (
            <div className="lg:hidden bg-zesty-50 border-t border-zesty-200 py-2 -mx-2 sm:-mx-4">
              <p className="text-xs text-zesty-800 text-center px-4">
                📍 Please select your location to see available products
              </p>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;