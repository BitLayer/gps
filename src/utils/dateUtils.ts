/**
 * Date utility functions for the application
 */

/**
 * Format a date string to a readable format
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Format a date string to include both date and time
 */
export const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date time:', error);
    return 'Invalid Date';
  }
};

/**
 * Format a date string to show relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    } else {
      return formatDate(dateString);
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Invalid Date';
  }
};

/**
 * Get the current delivery period (date string in YYYY-MM-DD format)
 * Delivery period runs from 6 AM to 11:59 PM
 * Orders placed between 12 AM to 5:59 AM count for the same day
 */
export const getCurrentDeliveryPeriod = (): string => {
  const now = new Date();
  const currentHour = now.getHours();
  
  // If it's between 12 AM (0) and 5:59 AM (5), use current date
  // If it's 6 AM or later, use current date
  // This means the delivery period always uses the current date
  return now.toISOString().split('T')[0]; // YYYY-MM-DD format
};

/**
 * Check if current time is within the payment window (12:00 AM to 5:59 AM)
 */
export const isPaymentWindow = (): boolean => {
  const now = new Date();
  const currentHour = now.getHours();
  
  // Payment window is from 12:00 AM (0) to 5:59 AM (5)
  return currentHour >= 0 && currentHour <= 5;
};

/**
 * Get the start and end times for the delivery window
 */
export const getDeliveryWindow = () => {
  return {
    start: 6, // 6 AM
    end: 23   // 11 PM (23:59)
  };
};

/**
 * Check if current time is within delivery hours
 */
export const isDeliveryHours = (): boolean => {
  const now = new Date();
  const currentHour = now.getHours();
  const { start, end } = getDeliveryWindow();
  
  return currentHour >= start && currentHour <= end;
};

/**
 * Get time until next delivery window opens
 */
export const getTimeUntilDeliveryWindow = (): string => {
  const now = new Date();
  const currentHour = now.getHours();
  const { start } = getDeliveryWindow();
  
  if (isDeliveryHours()) {
    return 'Delivery window is currently open';
  }
  
  let hoursUntilOpen;
  if (currentHour < start) {
    // Same day
    hoursUntilOpen = start - currentHour;
  } else {
    // Next day
    hoursUntilOpen = (24 - currentHour) + start;
  }
  
  return `Delivery opens in ${hoursUntilOpen} hour${hoursUntilOpen === 1 ? '' : 's'}`;
};