import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AgentDashboard from './pages/AgentDashboard';
import EmailVerificationPage from './pages/EmailVerificationPage';

const AppRoutes: React.FC = () => {
  const { currentUser, userData } = useAuth();

  // If no user is logged in, show landing page
  if (!currentUser) {
    return <LandingPage />;
  }

  // If user is logged in but email is not verified, show verification page
  if (!currentUser.emailVerified) {
    return <EmailVerificationPage />;
  }

  // If user data is still loading, show loading spinner
  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  // Admin can always access dashboard (no additional verification needed)
  if (userData.role === 'admin') {
    return <AdminDashboard />;
  }

  // For non-admin users, check verification status in database
  if (!userData.verified) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center border border-gray-light">
          <div className="w-16 h-16 bg-zesty-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-zesty-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-dark-text mb-4">Account Not Verified</h2>
          <p className="text-gray-dark mb-6">
            Your account is not yet verified. Please check your email for verification instructions or contact support.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = 'mailto:support@ghatpar.store?subject=Account Verification Issue'}
              className="w-full bg-appetite-500 text-white py-3 rounded-lg font-medium hover:bg-appetite-600 transition-colors"
            >
              Contact Support
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full border border-gray-light text-gray-dark py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Refresh Status
            </button>
            <button
              onClick={() => {
                // Sign out and redirect to landing page
                window.location.href = '/';
              }}
              className="w-full text-fresh-red-600 hover:text-fresh-red-800 font-medium py-2 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Redirect based on user role for verified users
  switch (userData.role) {
    case 'customer':
      return <CustomerDashboard />;
    case 'agent':
      return <AgentDashboard />;
    default:
      return <Navigate to="/" />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <div className="App">
          <Routes>
            <Route path="/*" element={<AppRoutes />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;