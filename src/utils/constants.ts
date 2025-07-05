/**
 * Application constants and configuration
 */

/**
 * Available delivery locations in Dhaka
 */
export const DHAKA_LOCATIONS = [
  'Dhanmondi',
  'Gulshan',
  'Banani',
  'Uttara',
  'Mirpur',
  'Mohammadpur',
  'Old Dhaka',
  'New Market',
  'Elephant Road',
  'Panthapath',
  'Farmgate',
  'Tejgaon',
  'Motijheel',
  'Ramna',
  'Azimpur',
  'Lalmatia',
  'Shyamoli',
  'Adabor',
  'Mohakhali',
  'Baridhara',
  'Bashundhara',
  'Wari',
  'Sutrapur',
  'Lalbagh',
  'Hazaribagh',
  'Kamrangirchar',
  'Keraniganj',
  'Savar',
  'Gazipur',
  'Narayanganj'
];

/**
 * Product categories available in the store
 */
export const CATEGORIES = [
  'All',
  'Beverages',
  'Chips & Crackers',
  'Biscuits',
  'Ice Cream',
  'Instant Noodles'
];

/**
 * Delivery configuration
 */
export const DELIVERY_CONFIG = {
  NORMAL_CHARGE: 50,
  EMERGENCY_CHARGE: 100,
  NORMAL_TIME: '1-2 hours',
  EMERGENCY_TIME: '30-60 minutes',
  DELIVERY_HOURS: {
    START: 6, // 6 AM
    END: 23   // 11 PM
  },
  PAYMENT_WINDOW: {
    START: 0, // 12 AM
    END: 5    // 5:59 AM
  }
};

/**
 * Agent payment configuration
 */
export const AGENT_CONFIG = {
  INCOME_PER_DELIVERY: 40,
  PAYMENT_PER_DELIVERY: 10,
  ADMIN_BKASH: '01234567890'
};

/**
 * User roles
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
  AGENT: 'agent'
} as const;

/**
 * Order statuses
 */
export const ORDER_STATUSES = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DELIVERED: 'delivered'
} as const;

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  CART_PREFIX: 'cart_',
  REMEMBER_ME: 'rememberMe',
  USER_PREFERENCES: 'userPreferences'
};

/**
 * API endpoints (for future use)
 */
export const API_ENDPOINTS = {
  ORDERS: '/api/orders',
  USERS: '/api/users',
  PRODUCTS: '/api/products',
  PAYMENTS: '/api/payments'
};

/**
 * Validation patterns
 */
export const VALIDATION_PATTERNS = {
  PHONE: /^(\+88)?01[3-9]\d{8}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6
};

/**
 * Default values
 */
export const DEFAULTS = {
  PAGINATION_LIMIT: 20,
  SEARCH_DEBOUNCE_MS: 300,
  NOTIFICATION_DURATION_MS: 3000,
  AUTO_REFRESH_INTERVAL_MS: 30000
};