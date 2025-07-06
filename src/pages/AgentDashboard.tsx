import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateTime, formatRelativeTime, getCurrentDeliveryPeriod, isPaymentWindow } from '../utils/dateUtils';
import { DHAKA_LOCATIONS } from '../utils/constants';
import { MapPin, Phone, Clock, Zap, ChevronDown, ChevronUp, User, Copy, X, Calendar, TrendingUp } from 'lucide-react';
import Notification from '../components/Notification';
import { useNotification } from '../hooks/useNotification';

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: any[];
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

const AgentDashboard: React.FC = () => {
  const { userData, logout, updateUserData } = useAuth();
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted'>('pending');
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [showDeliveryHistory, setShowDeliveryHistory] = useState(false);
  const [deliveredOrders, setDeliveredOrders] = useState<Order[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [todaysIncome, setTodaysIncome] = useState(0);
  const [todaysPayment, setTodaysPayment] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'complete'>('pending');
  const [currentPaymentPeriod, setCurrentPaymentPeriod] = useState('');
  const [monthlyStats, setMonthlyStats] = useState({
    totalDeliveries: 0,
    totalIncome: 0
  });
  const [dailyStats, setDailyStats] = useState<Record<string, { deliveries: number; income: number; payment: number }>>({});

  // Notification system
  const {
    notification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  } = useNotification();

  // Admin bKash number
  const ADMIN_BKASH = '01234567890';

  // FIXED: Get location directly from userData (real-time)
  const selectedLocation = userData?.location || '';

  // Check if agent has completed payment for the period
  const checkPaymentStatus = () => {
    const period = getCurrentDeliveryPeriod();
    const lastPaymentPeriod = userData?.lastPaymentPeriod;
    const matchStatus = userData?.matchStatus;
    
    if (lastPaymentPeriod === period && matchStatus === 'matched') {
      setPaymentStatus('complete');
    } else {
      setPaymentStatus('pending');
    }
    
    setCurrentPaymentPeriod(period);
  };

  // FIXED: Handle location change - only update Firestore
  const handleLocationChange = async (location: string) => {
    console.log('AgentDashboard: Location changing to:', location);
    
    if (userData?.uid) {
      try {
        await updateUserData({ location });
        console.log('AgentDashboard: Location updated in database:', location);
        showSuccess('Location updated successfully');
      } catch (error) {
        console.error('AgentDashboard: Error updating location in database:', error);
        showError('Failed to update location: ' + formatErrorMessage(error));
      }
    }
  };

  // Check if agent is paid
  if (userData?.role === 'agent' && !userData?.isPaidAgent) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full border border-gray-light">
          <h2 className="text-xl font-bold text-fresh-red-600 mb-4">Payment Required</h2>
          <p className="text-gray-dark mb-6 text-sm">
            Your agent account is not paid. Please contact support to activate your account.
          </p>
          <button
            onClick={() => window.location.href = 'mailto:support@ghatpar.store?subject=Agent Payment Issue'}
            className="w-full bg-appetite-500 text-white py-3 rounded-lg font-medium hover:bg-appetite-600 mb-3 transition-colors"
          >
            Contact Support
          </button>
          <button
            onClick={logout}
            className="w-full border border-gray-light text-gray-dark py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!selectedLocation) return;

    // Listen to pending orders for the selected location
    const pendingOrdersQuery = query(
      collection(db, 'orders'),
      where('location', '==', selectedLocation),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribePending = onSnapshot(pendingOrdersQuery, (snapshot) => {
      const ordersList: Order[] = [];
      snapshot.forEach((doc) => {
        ordersList.push({ id: doc.id, ...doc.data() } as Order);
      });
      
      // Sort emergency orders first
      const sortedOrders = ordersList.sort((a, b) => {
        if (a.deliveryType === 'emergency' && b.deliveryType !== 'emergency') return -1;
        if (b.deliveryType === 'emergency' && a.deliveryType !== 'emergency') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      setPendingOrders(sortedOrders);
    });

    return () => unsubscribePending();
  }, [selectedLocation]);

  useEffect(() => {
    if (!userData?.uid) return;

    // Listen to orders accepted by this agent
    const myOrdersQuery = query(
      collection(db, 'orders'),
      where('agentId', '==', userData.uid),
      where('status', '==', 'accepted'),
      orderBy('acceptedAt', 'desc')
    );

    const unsubscribeMyOrders = onSnapshot(myOrdersQuery, (snapshot) => {
      const ordersList: Order[] = [];
      snapshot.forEach((doc) => {
        ordersList.push({ id: doc.id, ...doc.data() } as Order);
      });
      setMyOrders(ordersList);
    });

    // Listen to delivered orders by this agent
    const deliveredOrdersQuery = query(
      collection(db, 'orders'),
      where('agentId', '==', userData.uid),
      where('status', '==', 'delivered'),
      orderBy('deliveredAt', 'desc')
    );

    const unsubscribeDelivered = onSnapshot(deliveredOrdersQuery, (snapshot) => {
      const ordersList: Order[] = [];
      snapshot.forEach((doc) => {
        ordersList.push({ id: doc.id, ...doc.data() } as Order);
      });
      setDeliveredOrders(ordersList);
      
      // Calculate today's income and payment for current delivery period
      const currentPeriod = getCurrentDeliveryPeriod();
      const periodOrders = ordersList.filter(order => {
        if (!order.deliveredAt) return false;
        const deliveryDate = order.deliveredAt.split('T')[0];
        const deliveryTime = new Date(order.deliveredAt);
        const deliveryHour = deliveryTime.getHours();
        
        // Only count orders delivered during delivery hours (6 AM to 11:59 PM)
        return deliveryDate === currentPeriod && deliveryHour >= 6;
      });

      const income = periodOrders.length * 40; // ৳40 per delivery
      const payment = periodOrders.length * 10; // ৳10 payment per delivery
      
      setTodaysIncome(income);
      setTodaysPayment(payment);

      // Calculate monthly stats (removed totalPayment)
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const monthlyOrders = ordersList.filter(order => {
        if (!order.deliveredAt) return false;
        return order.deliveredAt.startsWith(currentMonth);
      });

      setMonthlyStats({
        totalDeliveries: monthlyOrders.length,
        totalIncome: monthlyOrders.length * 40
      });

      // Calculate daily stats
      const dailyStatsMap: Record<string, { deliveries: number; income: number; payment: number }> = {};
      ordersList.forEach(order => {
        if (!order.deliveredAt) return;
        const date = order.deliveredAt.split('T')[0];
        if (!dailyStatsMap[date]) {
          dailyStatsMap[date] = { deliveries: 0, income: 0, payment: 0 };
        }
        dailyStatsMap[date].deliveries += 1;
        dailyStatsMap[date].income += 40;
        dailyStatsMap[date].payment += 10;
      });
      setDailyStats(dailyStatsMap);
    });

    // Check payment status
    checkPaymentStatus();

    return () => {
      unsubscribeMyOrders();
      unsubscribeDelivered();
    };
  }, [userData?.uid, userData?.lastPaymentPeriod, userData?.matchStatus]);

  const handleAcceptOrder = async (order: Order) => {
    if (!userData?.uid) return;

    // Check if we're in delivery hours (6 AM to 11:59 PM)
    const currentHour = new Date().getHours();
    if (currentHour < 6) {
      showError('Delivery service is available from 6:00 AM to 11:59 PM only');
      return;
    }

    try {
      // Update order with agent info
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'accepted',
        agentId: userData.uid,
        agentName: userData.name,
        agentPhone: userData.phone,
        acceptedAt: new Date().toISOString()
      });

      showSuccess('Order accepted successfully!');
    } catch (error) {
      console.error('Error accepting order:', error);
      showError('Failed to accept order: ' + formatErrorMessage(error));
    }
  };

  const handleDeliverOrder = async (order: Order) => {
    if (!userData?.uid) return;

    try {
      // Mark as delivered
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'delivered',
        deliveredAt: new Date().toISOString()
      });

      showSuccess('Order marked as delivered! You earned ৳40 (৳10 payment due)');
    } catch (error) {
      console.error('Error delivering order:', error);
      showError('Failed to mark order as delivered: ' + formatErrorMessage(error));
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const copyAdminBkash = async () => {
    try {
      await navigator.clipboard.writeText(ADMIN_BKASH);
      setCopySuccess(true);
      showInfo('bKash number copied to clipboard');
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy bKash number:', error);
      showError('Failed to copy bKash number');
    }
  };

  const handlePayment = async () => {
    if (!transactionId.trim()) {
      showError('Please enter transaction ID');
      return;
    }

    if (todaysPayment === 0) {
      showError('No payment due for this period');
      return;
    }

    if (!isPaymentWindow()) {
      showError('Payment can only be submitted between 12:00 AM to 5:59 AM');
      return;
    }

    try {
      const period = getCurrentDeliveryPeriod();
      
      // Add to agentPayments collection
      await addDoc(collection(db, 'agentPayments'), {
        agentId: userData?.uid,
        agentName: userData?.name,
        transactionId: transactionId.trim(),
        amount: todaysPayment,
        period: period,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      // Update agent's transactionId and lastPaymentPeriod in their user profile
      await updateUserData({
        transactionId: transactionId.trim(),
        lastPaymentPeriod: period,
        matchStatus: null // Reset match status for new payment
      });

      showSuccess('Payment submitted for verification');
      setTransactionId('');
      setShowPayment(false);
    } catch (error) {
      console.error('Error submitting payment:', error);
      showError('Failed to submit payment: ' + formatErrorMessage(error));
    }
  };

  // Close modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Close delivery history modal
      if (showDeliveryHistory && !target.closest('.delivery-history-modal')) {
        setShowDeliveryHistory(false);
      }
      
      // Close payment modal
      if (showPayment && !target.closest('.payment-modal')) {
        setShowPayment(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDeliveryHistory, showPayment]);

  const currentOrders = activeTab === 'pending' ? pendingOrders : myOrders;

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

      {/* Mobile-First Responsive Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-light">
        <div className="px-4">
          {/* Top Row - Location and Stats */}
          <div className="flex items-center justify-between h-14 border-b border-gray-light">
            {/* Location Selector */}
            <div className="flex-1 max-w-xs">
              <select
                value={selectedLocation}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="w-full text-sm border border-gray-light rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select Location</option>
                {DHAKA_LOCATIONS.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            {/* Income and Payment Display */}
            <div className="flex items-center space-x-4 text-right">
              {/* Today's Income */}
              <div>
                <div className="text-xs text-gray-dark">Today's Income</div>
                <div className="text-sm font-bold text-brand-600">৳{todaysIncome}</div>
              </div>

              {/* Today's Payment */}
              <div>
                <div className="text-xs text-gray-dark">Today's Payment</div>
                <div className={`text-sm font-bold ${paymentStatus === 'complete' ? 'text-brand-600' : 'text-appetite-600'}`}>
                  {paymentStatus === 'complete' ? 'Complete' : `৳${todaysPayment}`}
                </div>
              </div>

              {/* Menu Button */}
              <button
                onClick={() => setShowPayment(true)}
                className="p-2 text-gray-dark hover:text-brand-500 transition-colors"
                disabled={paymentStatus === 'complete'}
              >
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Bottom Row - Tab Navigation */}
          {selectedLocation && (
            <div className="flex items-center justify-between h-12">
              <div className="flex space-x-1 flex-1">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'pending'
                      ? 'bg-appetite-500 text-white'
                      : 'bg-gray-light text-gray-dark hover:bg-gray-200'
                  }`}
                >
                  Pending ({pendingOrders.length})
                </button>
                <button
                  onClick={() => setActiveTab('accepted')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'accepted'
                      ? 'bg-appetite-500 text-white'
                      : 'bg-gray-light text-gray-dark hover:bg-gray-200'
                  }`}
                >
                  My Orders ({myOrders.length})
                </button>
              </div>
              
              <button
                onClick={() => setShowDeliveryHistory(true)}
                className="ml-2 px-3 py-2 bg-cool-blue-100 text-cool-blue-700 rounded-lg text-sm font-medium hover:bg-cool-blue-200 transition-colors"
              >
                History
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Payment Window Notice */}
      {isPaymentWindow() && todaysPayment > 0 && paymentStatus !== 'complete' && (
        <div className="bg-zesty-100 border-l-4 border-zesty-500 p-4">
          <div className="px-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-5 w-5 text-zesty-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-zesty-700">
                  <strong>Payment Window:</strong> You can submit your payment until 5:59 AM. 
                  Payment due: ৳{todaysPayment}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="px-4 py-4">
        {!selectedLocation ? (
          <div className="text-center py-20">
            <MapPin className="w-16 h-16 text-gray-medium mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-dark mb-2">Select Your Location</h2>
            <p className="text-gray-medium">Choose a location to see available orders</p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentOrders.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-gray-medium mb-4">
                  {activeTab === 'pending' ? (
                    <Clock className="w-16 h-16 mx-auto" />
                  ) : (
                    <User className="w-16 h-16 mx-auto" />
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-dark mb-2">
                  {activeTab === 'pending' ? 'No Pending Orders' : 'No Accepted Orders'}
                </h2>
                <p className="text-gray-medium text-sm">
                  {activeTab === 'pending' 
                    ? 'Check back later for new orders' 
                    : 'Accept orders from the Pending tab'
                  }
                </p>
              </div>
            ) : (
              currentOrders.map(order => (
                <div key={order.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-light">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-bold text-lg text-dark-text">{order.customerName}</span>
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="text-brand-600 hover:text-brand-800 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-dark">
                        {order.deliveryType === 'emergency' ? (
                          <div className="flex items-center space-x-1 text-appetite-600">
                            <Zap className="w-4 h-4" />
                            <span className="font-medium">Emergency (৳40 income)</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>Regular (৳40 income)</span>
                          </div>
                        )}
                        <span>{order.items.length} items</span>
                        <span className="font-semibold">৳{order.total}</span>
                        <span className="text-xs text-gray-medium">
                          {formatRelativeTime(order.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleOrderExpansion(order.id)}
                        className="p-2 text-gray-medium hover:text-gray-dark transition-colors"
                      >
                        {expandedOrders.has(order.id) ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                      
                      {activeTab === 'pending' ? (
                        <button
                          onClick={() => handleAcceptOrder(order)}
                          className="bg-appetite-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-appetite-600 transition-colors"
                        >
                          Accept
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeliverOrder(order)}
                          className="bg-cool-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-cool-blue-700 transition-colors"
                        >
                          Delivered
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-gray-dark mb-2">
                    <strong>Address:</strong> {order.deliveryAddress}
                  </div>

                  {expandedOrders.has(order.id) && (
                    <div className="border-t border-gray-light pt-4 mt-4">
                      <h4 className="font-medium mb-2 text-dark-text">Order Items:</h4>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-dark-text">{item.name} x {item.quantity}</span>
                            <span className="text-dark-text">৳{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-gray-light pt-2 mt-2">
                        <div className="flex justify-between items-center font-medium">
                          <span className="text-dark-text">Subtotal</span>
                          <span className="text-dark-text">৳{order.subtotal}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-dark-text">Delivery Charge</span>
                          <span className="text-dark-text">৳{order.deliveryCharge}</span>
                        </div>
                        <div className="flex justify-between items-center font-bold text-lg border-t border-gray-light pt-2">
                          <span className="text-dark-text">Total</span>
                          <span className="text-dark-text">৳{order.total}</span>
                        </div>
                      </div>
                      {order.specialRequest && (
                        <div className="mt-4 p-3 bg-zesty-50 rounded-lg border border-zesty-200">
                          <strong className="text-zesty-800">Special Request:</strong>
                          <p className="text-zesty-700">{order.specialRequest}</p>
                        </div>
                      )}
                      <div className="mt-2 text-xs text-gray-medium">
                        <div>Order placed: {formatDateTime(order.createdAt)}</div>
                        {order.acceptedAt && (
                          <div>Accepted: {formatDateTime(order.acceptedAt)}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Delivery History Modal */}
      {showDeliveryHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="delivery-history-modal bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-light">
            <div className="sticky top-0 bg-white border-b border-gray-light px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-dark-text">Delivery History</h2>
              <button
                onClick={() => setShowDeliveryHistory(false)}
                className="text-gray-medium hover:text-gray-dark transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Monthly Statistics - Removed Monthly Payment */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-cool-blue-50 p-4 rounded-lg text-center border border-cool-blue-200">
                  <div className="text-2xl font-bold text-cool-blue-600">{monthlyStats.totalDeliveries}</div>
                  <div className="text-sm text-cool-blue-800">Monthly Deliveries</div>
                </div>
                <div className="bg-brand-50 p-4 rounded-lg text-center border border-brand-200">
                  <div className="text-2xl font-bold text-brand-600">৳{monthlyStats.totalIncome}</div>
                  <div className="text-sm text-brand-800">Monthly Income</div>
                </div>
              </div>

              {/* Daily Summary */}
              <h3 className="text-lg font-semibold mb-4 flex items-center text-dark-text">
                <Calendar className="w-5 h-5 mr-2" />
                Daily Summary
              </h3>
              <div className="space-y-3">
                {Object.entries(dailyStats)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .slice(0, 10)
                  .map(([date, stats]) => (
                  <div key={date} className="border border-gray-light rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-dark-text">{formatDate(date)}</div>
                        <div className="text-sm text-gray-dark">
                          {stats.deliveries} deliveries
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-brand-600">
                          Income: ৳{stats.income}
                        </div>
                        <div className="text-sm font-medium text-appetite-600">
                          Payment: ৳{stats.payment}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="payment-modal bg-white rounded-lg w-full max-w-md border border-gray-light">
            <div className="border-b border-gray-light px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-dark-text">Submit Payment</h2>
              <button
                onClick={() => setShowPayment(false)}
                className="text-gray-medium hover:text-gray-dark transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Today's Income & Payment */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-brand-50 p-4 rounded-lg text-center border border-brand-200">
                  <div className="text-xl font-bold text-brand-600">৳{todaysIncome}</div>
                  <div className="text-sm text-brand-800">Today's Income</div>
                </div>
                <div className="bg-appetite-50 p-4 rounded-lg text-center border border-appetite-200">
                  <div className={`text-xl font-bold ${paymentStatus === 'complete' ? 'text-brand-600' : 'text-appetite-600'}`}>
                    {paymentStatus === 'complete' ? 'Complete' : `৳${todaysPayment}`}
                  </div>
                  <div className="text-sm text-appetite-800">Today's Payment</div>
                </div>
              </div>

              <div className="mb-4">
                {todaysPayment === 0 && (
                  <div className="text-sm text-gray-medium mt-1">
                    No deliveries completed for this period
                  </div>
                )}
                {paymentStatus === 'complete' && (
                  <div className="text-sm text-brand-600 mt-1">
                    Payment already completed for this period
                  </div>
                )}
                {!isPaymentWindow() && (
                  <div className="text-sm text-appetite-600 mt-1">
                    Payment window: 12:00 AM to 5:59 AM only
                  </div>
                )}
                <div className="text-sm text-gray-dark mt-2 flex items-center space-x-2">
                  <span>Admin bKash: {ADMIN_BKASH}</span>
                  <button
                    onClick={copyAdminBkash}
                    className={`p-1 rounded transition-colors ${copySuccess ? 'text-brand-600' : 'text-gray-medium hover:text-gray-dark'}`}
                    title="Copy bKash number"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {copySuccess && (
                    <span className="text-xs text-brand-600">Copied!</span>
                  )}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-dark mb-2">
                  Transaction ID
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter full transaction ID"
                  className="w-full px-3 py-2 border border-gray-light rounded-lg focus:ring-2 focus:ring-brand-500"
                  disabled={paymentStatus === 'complete' || !isPaymentWindow()}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handlePayment}
                  disabled={todaysPayment === 0 || paymentStatus === 'complete' || !isPaymentWindow()}
                  className="flex-1 bg-appetite-500 text-white py-2 rounded-lg hover:bg-appetite-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Submit Payment
                </button>
                <button
                  onClick={logout}
                  className="px-4 py-2 border border-fresh-red-300 text-fresh-red-700 rounded-lg hover:bg-fresh-red-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;