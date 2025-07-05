import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const EmailVerificationPage: React.FC = () => {
  const { currentUser, sendVerificationEmail, refreshUserData, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(true);

  // Auto-check verification status every 3 seconds
  useEffect(() => {
    if (!autoCheckEnabled) return;

    const interval = setInterval(async () => {
      try {
        await currentUser?.reload();
        if (currentUser?.emailVerified) {
          setMessage('Email verified successfully! Redirecting...');
          setAutoCheckEnabled(false);
          
          // Refresh user data to update verification status
          await refreshUserData();
          
          // Redirect after a short delay
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentUser, autoCheckEnabled, refreshUserData]);

  const handleResendVerification = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await sendVerificationEmail();
      setMessage('Verification email sent successfully! Please check your inbox and spam folder.');
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      setError('Failed to send verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationComplete = async () => {
    setCheckingVerification(true);
    setError('');
    setMessage('');

    try {
      // Reload the current user to get the latest emailVerified status
      await currentUser?.reload();
      
      // Check if email is now verified
      if (currentUser?.emailVerified) {
        setMessage('Email verified successfully! Updating your account...');
        
        // Refresh user data to update verification status in database
        await refreshUserData();
        
        setMessage('Email verified successfully! Redirecting to dashboard...');
        
        // Redirect after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setError('Email is still not verified. Please check your email and click the verification link, then try again.');
      }
    } catch (error: any) {
      console.error('Error checking verification status:', error);
      setError('Failed to check verification status. Please try again.');
    } finally {
      setCheckingVerification(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: 'url("https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-black opacity-50"></div>
      
      <div className="relative max-w-md w-full">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center">
            {/* Logo - Increased size significantly */}
            <div className="flex justify-center mb-6">
              <img 
                src="/Logo.png" 
                alt="Ghatpar.com" 
                className="h-20 w-auto sm:h-24 md:h-28"
              />
            </div>

            {/* Email Icon */}
            <div className="w-20 h-20 bg-zesty-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-zesty-600" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-dark-text mb-4">
              Verify Your Email
            </h1>

            {/* Message */}
            <p className="text-gray-dark mb-2">
              Your account is not verified. Please verify your email to proceed.
            </p>
            
            <p className="text-sm text-gray-medium mb-6">
              We sent a verification link to <strong>{currentUser?.email}</strong>
            </p>

            {/* Auto-check indicator */}
            {autoCheckEnabled && (
              <div className="mb-6 p-3 bg-cool-blue-50 border border-cool-blue-200 rounded-lg">
                <div className="flex items-center justify-center space-x-2">
                  <Clock className="w-4 h-4 text-cool-blue-600 animate-pulse" />
                  <p className="text-cool-blue-800 text-sm">
                    Automatically checking for verification...
                  </p>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {error && (
              <div className="mb-6 p-4 bg-fresh-red-50 border border-fresh-red-200 rounded-lg">
                <p className="text-fresh-red-800 text-sm">{error}</p>
              </div>
            )}

            {message && (
              <div className="mb-6 p-4 bg-brand-50 border border-brand-200 rounded-lg">
                <p className="text-brand-800 text-sm">{message}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              {/* Resend Verification Email Button */}
              <button
                onClick={handleResendVerification}
                disabled={loading}
                className="w-full bg-appetite-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-appetite-600 focus:outline-none focus:ring-2 focus:ring-appetite-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </button>

              {/* Manual Verification Check Button */}
              <button
                onClick={handleVerificationComplete}
                disabled={checkingVerification}
                className="w-full border-2 border-brand-500 text-brand-600 py-3 px-4 rounded-lg font-medium hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {checkingVerification ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    I've Verified My Email
                  </>
                )}
              </button>

              {/* Toggle Auto-check */}
              <button
                onClick={() => setAutoCheckEnabled(!autoCheckEnabled)}
                className="w-full text-sm text-gray-dark hover:text-dark-text py-2 transition-colors"
              >
                {autoCheckEnabled ? 'Disable Auto-check' : 'Enable Auto-check'}
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-8 pt-6 border-t border-gray-light">
              <p className="text-xs text-gray-medium mb-3">
                Didn't receive the email? Check your spam folder or try resending.
              </p>
              <p className="text-xs text-gray-medium">
                After clicking the verification link in your email, the system will automatically detect it or you can click "I've Verified My Email" above.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;