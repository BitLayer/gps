import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { getCurrentDeliveryPeriod } from '../utils/dateUtils';
import { Copy, Trash2, Users, UserCheck, RefreshCw, Check, X, CreditCard } from 'lucide-react';
import Notification from '../components/Notification';
import { useNotification } from '../hooks/useNotification';

interface User {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'agent';
  verified: boolean;
  isPaidAgent?: boolean;
  rating?: number;
  totalRatings?: number;
  transactionId?: string;
  matchStatus?: 'matched' | 'not_matched' | null;
  lastPaymentPeriod?: string;
  createdAt: string;
}

interface Order {
  id: string;
  agentId: string;
  deliveryType: 'normal' | 'emergency';
  status: 'delivered';
  deliveredAt: string;
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

const AdminDashboard: React.FC = () => {
  const { logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'customers' | 'agents' | 'agentPayments'>('customers');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  // Notification system
  const {
    notification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  } = useNotification();

  const fetchUsers = () => {
    setLoading(true);
    setError(null);
    
    try {
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
        const usersList: User[] = [];
        snapshot.forEach((doc) => {
          const userData = doc.data() as User;
          if (userData.role !== 'admin') {
            usersList.push({ uid: doc.id, ...userData });
          }
        });
        setUsers(usersList);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching users:', error);
        const errorMsg = formatErrorMessage(error);
        setError('Failed to fetch users: ' + errorMsg);
        showError('Failed to fetch users: ' + errorMsg);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error: any) {
      console.error('Error setting up user listener:', error);
      const errorMsg = formatErrorMessage(error);
      setError('Failed to setup user listener: ' + errorMsg);
      showError('Failed to setup user listener: ' + errorMsg);
      setLoading(false);
    }
  };

  const fetchOrders = () => {
    try {
      const ordersQuery = query(collection(db, 'orders'), orderBy('deliveredAt', 'desc'));
      const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
        const ordersList: Order[] = [];
        snapshot.forEach((doc) => {
          const orderData = doc.data() as Order;
          if (orderData.status === 'delivered' && orderData.agentId) {
            ordersList.push({ id: doc.id, ...orderData });
          }
        });
        setOrders(ordersList);
      });

      return unsubscribe;
    } catch (error: any) {
      console.error('Error setting up orders listener:', error);
      showError('Failed to setup orders listener: ' + formatErrorMessage(error));
    }
  };

  useEffect(() => {
    const unsubscribeUsers = fetchUsers();
    const unsubscribeOrders = fetchOrders();
    
    return () => {
      if (unsubscribeUsers) {
        unsubscribeUsers();
      }
      if (unsubscribeOrders) {
        unsubscribeOrders();
      }
    };
  }, []);

  const handleDeleteUser = async (uid: string, userEmail: string) => {
    const confirmMessage = `Are you sure you want to delete this user from the database?\n\nThis will:\n• Delete user from database\n• Remove all user data permanently\n\nEmail: ${userEmail}\nUID: ${uid}\n\nNote: The user will still exist in authentication and will need to be manually deleted from the admin console.\n\nThis action cannot be undone!`;
    
    if (window.confirm(confirmMessage)) {
      setDeletingUser(uid);
      showInfo('Deleting user from database... Please wait.');
      
      try {
        // Delete from Firestore
        await deleteDoc(doc(db, 'users', uid));
        console.log('User deleted from database');
        
        showWarning('User deleted from database. Please manually delete the user from authentication console if needed.');
        
      } catch (error: any) {
        console.error('Error deleting user:', error);
        showError('Failed to delete user: ' + formatErrorMessage(error));
      } finally {
        setDeletingUser(null);
      }
    }
  };

  const handleRoleChange = async (uid: string, newRole: 'customer' | 'agent') => {
    try {
      const updates: any = { role: newRole };
      
      if (newRole === 'customer') {
        updates.isPaidAgent = null;
        updates.rating = null;
        updates.totalRatings = null;
        updates.transactionId = null;
        updates.matchStatus = null;
        updates.lastPaymentPeriod = null;
      } else if (newRole === 'agent') {
        updates.isPaidAgent = false;
        updates.rating = 0;
        updates.totalRatings = 0;
      }
      
      await updateDoc(doc(db, 'users', uid), updates);
      showSuccess(`Role updated to ${newRole} successfully`);
    } catch (error: any) {
      console.error('Error updating role:', error);
      showError('Failed to update role: ' + formatErrorMessage(error));
    }
  };

  const handlePaymentStatus = async (uid: string, isPaid: boolean) => {
    try {
      await updateDoc(doc(db, 'users', uid), { isPaidAgent: isPaid });
      showSuccess(`Agent payment status updated to ${isPaid ? 'paid' : 'unpaid'}`);
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      showError('Failed to update payment status: ' + formatErrorMessage(error));
    }
  };

  const handleMatchStatus = async (uid: string, matchStatus: 'matched' | 'not_matched') => {
    try {
      const updates: any = { matchStatus };
      
      // Auto-set payment status based on match status
      if (matchStatus === 'matched') {
        updates.isPaidAgent = true;
        // Reset transaction ID and match status for next payment cycle
        updates.transactionId = null;
        updates.matchStatus = null;
      } else if (matchStatus === 'not_matched') {
        updates.isPaidAgent = false;
      }
      
      await updateDoc(doc(db, 'users', uid), updates);
      showSuccess(`Transaction ${matchStatus} and payment status updated`);
    } catch (error: any) {
      console.error('Error updating match status:', error);
      showError('Failed to update match status: ' + formatErrorMessage(error));
    }
  };

  const handleSetAllPaid = async () => {
    if (window.confirm('Set all agents as paid?')) {
      try {
        const agentUsers = users.filter(user => user.role === 'agent');
        const updatePromises = agentUsers.map(agent => 
          updateDoc(doc(db, 'users', agent.uid), { isPaidAgent: true })
        );
        
        await Promise.all(updatePromises);
        showSuccess(`All ${agentUsers.length} agents set as paid`);
      } catch (error: any) {
        console.error('Error setting all paid:', error);
        showError('Failed to set all agents as paid: ' + formatErrorMessage(error));
      }
    }
  };

  const handleVerifyUser = async (uid: string, verified: boolean) => {
    try {
      await updateDoc(doc(db, 'users', uid), { verified });
      showSuccess(`User ${verified ? 'verified' : 'unverified'} successfully`);
    } catch (error: any) {
      console.error('Error updating verification status:', error);
      showError('Failed to update verification status: ' + formatErrorMessage(error));
    }
  };

  const copyTransactionId = async (transactionId: string, uid: string) => {
    try {
      await navigator.clipboard.writeText(transactionId);
      setCopySuccess(uid);
      showInfo('Transaction ID copied to clipboard');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy transaction ID:', error);
      showError('Failed to copy transaction ID');
    }
  };

  const copyUID = async (uid: string) => {
    try {
      await navigator.clipboard.writeText(uid);
      showInfo('UID copied to clipboard');
    } catch (error) {
      console.error('Failed to copy UID:', error);
      showError('Failed to copy UID');
    }
  };

  const handleRefresh = () => {
    fetchUsers();
    fetchOrders();
    showInfo('Data refreshed successfully');
  };

  const calculateTodaysPayment = (uid: string) => {
    const currentPeriod = getCurrentDeliveryPeriod();
    const periodOrders = orders.filter(order => {
      if (order.agentId !== uid || !order.deliveredAt) return false;
      
      const deliveryDate = order.deliveredAt.split('T')[0];
      const deliveryTime = new Date(order.deliveredAt);
      const deliveryHour = deliveryTime.getHours();
      
      // Only count orders delivered during delivery hours (6 AM to 11:59 PM)
      return deliveryDate === currentPeriod && deliveryHour >= 6;
    });

    return periodOrders.length * 10; // ৳10 payment per delivery
  };

  const calculateTodaysIncome = (uid: string) => {
    const currentPeriod = getCurrentDeliveryPeriod();
    const periodOrders = orders.filter(order => {
      if (order.agentId !== uid || !order.deliveredAt) return false;
      
      const deliveryDate = order.deliveredAt.split('T')[0];
      const deliveryTime = new Date(order.deliveredAt);
      const deliveryHour = deliveryTime.getHours();
      
      // Only count orders delivered during delivery hours (6 AM to 11:59 PM)
      return deliveryDate === currentPeriod && deliveryHour >= 6;
    });

    return periodOrders.length * 40; // ৳40 income per delivery
  };

  const customers = users.filter(user => user.role === 'customer');
  const agents = users.filter(user => user.role === 'agent');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <img 
                src="/Logo.png" 
                alt="Ghatpar.com" 
                className="h-12 w-auto sm:h-14 md:h-16"
              />
              <span className="text-xl font-bold text-emerald-600">Admin Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={logout}
                className="text-red-600 hover:text-red-800 font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800">{error}</div>
            <button
              onClick={handleRefresh}
              className="mt-2 text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        <div className="mb-6">
          <div className="flex space-x-4 border-b">
            <button
              onClick={() => setActiveTab('customers')}
              className={`pb-2 px-4 font-medium transition-colors ${
                activeTab === 'customers'
                  ? 'border-b-2 border-emerald-600 text-emerald-600'
                  : 'text-gray-600 hover:text-emerald-600'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Customers ({customers.length})
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={`pb-2 px-4 font-medium transition-colors ${
                activeTab === 'agents'
                  ? 'border-b-2 border-emerald-600 text-emerald-600'
                  : 'text-gray-600 hover:text-emerald-600'
              }`}
            >
              <UserCheck className="w-4 h-4 inline mr-2" />
              Agents ({agents.length})
            </button>
            <button
              onClick={() => setActiveTab('agentPayments')}
              className={`pb-2 px-4 font-medium transition-colors ${
                activeTab === 'agentPayments'
                  ? 'border-b-2 border-emerald-600 text-emerald-600'
                  : 'text-gray-600 hover:text-emerald-600'
              }`}
            >
              <CreditCard className="w-4 h-4 inline mr-2" />
              Agent Payments ({agents.length})
            </button>
          </div>
        </div>

        {activeTab === 'agentPayments' && agents.length > 0 && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={handleSetAllPaid}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Set All Paid
            </button>
          </div>
        )}

        {users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Users Found</h3>
            <p className="text-gray-500">Users will appear here once they register</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    UID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  {(activeTab === 'customers' || activeTab === 'agents') && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Verification
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                    </>
                  )}
                  {activeTab === 'agents' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                  )}
                  {activeTab === 'agentPayments' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Today's Income
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Today's Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Match Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Status
                      </th>
                    </>
                  )}
                  {(activeTab === 'customers' || activeTab === 'agents') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(activeTab === 'customers' ? customers : agents).map((user, index) => (
                  <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs">{user.uid.slice(0, 8)}...</span>
                        <button
                          onClick={() => copyUID(user.uid)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.phone || 'N/A'}
                    </td>
                    {(activeTab === 'customers' || activeTab === 'agents') && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              user.verified 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.verified ? 'Verified' : 'Not Verified'}
                            </span>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleVerifyUser(user.uid, true)}
                                className="bg-green-600 text-white px-2 py-1 text-xs rounded hover:bg-green-700 transition-colors"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => handleVerifyUser(user.uid, false)}
                                className="bg-red-600 text-white px-2 py-1 text-xs rounded hover:bg-red-700 transition-colors"
                              >
                                ✗
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.uid, e.target.value as 'customer' | 'agent')}
                            className="border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-emerald-500 transition-colors"
                          >
                            <option value="customer">Customer</option>
                            <option value="agent">Agent</option>
                          </select>
                        </td>
                      </>
                    )}
                    {activeTab === 'agents' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.rating ? `${user.rating.toFixed(1)} (${user.totalRatings})` : 'No ratings'}
                      </td>
                    )}
                    {activeTab === 'agentPayments' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-semibold text-green-600">
                            ৳{calculateTodaysIncome(user.uid)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-semibold text-emerald-600">
                            ৳{calculateTodaysPayment(user.uid)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {user.transactionId ? (
                              <>
                                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded max-w-[120px] truncate" title={user.transactionId}>
                                  {user.transactionId}
                                </span>
                                <button
                                  onClick={() => copyTransactionId(user.transactionId!, user.uid)}
                                  className={`text-gray-400 hover:text-gray-600 transition-colors ${
                                    copySuccess === user.uid ? 'text-green-600' : ''
                                  }`}
                                  title="Copy Transaction ID"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <span className="text-sm text-gray-400">No Transaction ID</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              user.matchStatus === 'matched' 
                                ? 'bg-green-100 text-green-800' 
                                : user.matchStatus === 'not_matched'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.matchStatus === 'matched' ? 'Matched' : 
                               user.matchStatus === 'not_matched' ? 'Not Matched' : 'Pending'}
                            </span>
                            {user.transactionId && (
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleMatchStatus(user.uid, 'matched')}
                                  className={`p-1 rounded text-white text-xs transition-colors ${
                                    user.matchStatus === 'matched' 
                                      ? 'bg-green-700' 
                                      : 'bg-green-600 hover:bg-green-700'
                                  }`}
                                  title="Mark as Matched"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleMatchStatus(user.uid, 'not_matched')}
                                  className={`p-1 rounded text-white text-xs transition-colors ${
                                    user.matchStatus === 'not_matched' 
                                      ? 'bg-red-700' 
                                      : 'bg-red-600 hover:bg-red-700'
                                  }`}
                                  title="Mark as Not Matched"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              user.isPaidAgent
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isPaidAgent ? 'Paid' : 'Unpaid'}
                            </span>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handlePaymentStatus(user.uid, true)}
                                className="bg-green-600 text-white px-2 py-1 text-xs rounded hover:bg-green-700 transition-colors"
                              >
                                Paid
                              </button>
                              <button
                                onClick={() => handlePaymentStatus(user.uid, false)}
                                className="bg-red-600 text-white px-2 py-1 text-xs rounded hover:bg-red-700 transition-colors"
                              >
                                Unpaid
                              </button>
                            </div>
                          </div>
                        </td>
                      </>
                    )}
                    {(activeTab === 'customers' || activeTab === 'agents') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={() => handleDeleteUser(user.uid, user.email)}
                          disabled={deletingUser === user.uid}
                          className={`text-red-600 hover:text-red-800 transition-colors p-2 rounded-full hover:bg-red-50 ${
                            deletingUser === user.uid ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title="Delete User from Database"
                        >
                          {deletingUser === user.uid ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
