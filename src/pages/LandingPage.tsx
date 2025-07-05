import React, { useState } from 'react';
import { Eye, EyeOff, Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Notification from '../components/Notification';
import { useNotification } from '../hooks/useNotification';

const LandingPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [resetEmail, setResetEmail] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, signup, resetPassword } = useAuth();

  // Notification system
  const {
    notification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        showSuccess('Login successful! Redirecting...');
        // User will be automatically redirected by App.tsx based on verification status
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await signup(formData.name, formData.email, formData.phone, formData.password);
      }
    } catch (error: any) {
      if (error.message === 'VERIFICATION_SENT') {
        showSuccess('Account created successfully! You will be redirected to verify your email.');
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: ''
        });
        // Don't switch to login - user will be redirected to verification page
      } else {
        showError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await resetPassword(resetEmail);
      showSuccess('Password reset email sent! Check your inbox.');
      setResetEmail('');
      setShowReset(false);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
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

      {/* Background Image */}
      <div 
        className="fixed inset-0 w-full h-full"
        style={{
          backgroundImage: 'url("https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Dark Overlay */}
      <div className="fixed inset-0 w-full h-full bg-black opacity-50" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <img 
                src="/Logo.png" 
                alt="Ghatpar.com" 
                className="h-24 w-auto sm:h-28 md:h-32 lg:h-36"
              />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Your Online Marketplace</h1>
            <p className="text-xl text-gray-200">A one-stop shop for everything you need!</p>
          </div>

          <div className="bg-white rounded-xl shadow-2xl p-8">
            {showReset ? (
              <form onSubmit={handleReset} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-dark-text text-center mb-6">Reset Password</h2>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-medium" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-3 border border-gray-light rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-appetite-500 text-white py-3 rounded-lg font-medium hover:bg-appetite-600 focus:outline-none focus:ring-2 focus:ring-appetite-500 disabled:opacity-50 flex items-center justify-center transition-colors"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Email'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowReset(false)}
                  className="w-full text-brand-600 hover:text-brand-800 font-medium transition-colors"
                >
                  Back to Login
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-dark-text text-center mb-6">
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </h2>

                  {!isLogin && (
                    <div className="mb-4">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Full Name"
                        className="w-full px-4 py-3 border border-gray-light rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        required
                      />
                    </div>
                  )}

                  <div className="mb-4">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="Email Address"
                      className="w-full px-4 py-3 border border-gray-light rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      required
                    />
                  </div>

                  {!isLogin && (
                    <div className="mb-4">
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="Phone Number"
                        className="w-full px-4 py-3 border border-gray-light rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        required
                      />
                    </div>
                  )}

                  <div className="mb-4 relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Password"
                      className="w-full px-4 py-3 pr-12 border border-gray-light rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-medium hover:text-gray-dark transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {!isLogin && (
                    <div className="mb-4 relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        placeholder="Confirm Password"
                        className="w-full px-4 py-3 pr-12 border border-gray-light rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-gray-medium hover:text-gray-dark transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  )}

                  {isLogin && (
                    <div className="flex items-center justify-between mb-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-gray-light text-brand-600 focus:ring-brand-500"
                        />
                        <span className="ml-2 text-sm text-gray-dark">Remember me</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowReset(true)}
                        className="text-sm text-brand-600 hover:text-brand-800 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-appetite-500 text-white py-3 rounded-lg font-medium hover:bg-appetite-600 focus:outline-none focus:ring-2 focus:ring-appetite-500 disabled:opacity-50 flex items-center justify-center transition-colors"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Please wait...
                    </>
                  ) : (
                    isLogin ? 'Sign In' : 'Create Account'
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-brand-600 hover:text-brand-800 font-medium transition-colors"
                  >
                    {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;