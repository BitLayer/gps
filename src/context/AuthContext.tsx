import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

interface UserData {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'customer' | 'agent';
  verified: boolean;
  isPaidAgent?: boolean;
  rating?: number;
  totalRatings?: number;
  location?: string;
  deliveryAddress?: string;
  transactionId?: string;
  matchStatus?: 'matched' | 'not_matched' | null;
  lastPaymentPeriod?: string;
  createdAt: string;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  loading: boolean;
  updateUserData: (updates: Partial<UserData>) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to convert Firebase errors to user-friendly messages
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
  
  // Common error mappings
  const errorMappings: Record<string, string> = {
    'auth/user-not-found': 'No account found with this email address',
    'auth/wrong-password': 'Incorrect password',
    'auth/email-already-in-use': 'An account with this email already exists',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/invalid-email': 'Please enter a valid email address',
    'auth/user-disabled': 'This account has been disabled',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later',
    'auth/network-request-failed': 'Network error. Please check your connection',
    'auth/user-token-expired': 'Session expired. Please sign in again',
    'permission-denied': 'Access denied. Please check your permissions',
    'unavailable': 'Service temporarily unavailable. Please try again',
    'not-found': 'Requested data not found',
    'already-exists': 'Data already exists',
    'invalid-argument': 'Invalid data provided',
    'deadline-exceeded': 'Request timeout. Please try again',
    'resource-exhausted': 'Service limit exceeded. Please try again later'
  };

  // Check for specific error codes
  const errorCode = error.code;
  if (errorCode && errorMappings[errorCode]) {
    return errorMappings[errorCode];
  }

  // Return cleaned message or fallback
  return cleanMessage || 'An error occurred. Please try again';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;
        
        // Always check and update verified status based on Firebase Auth
        if (currentUser?.emailVerified && !data.verified) {
          console.log('Email verified in Firebase Auth, updating database...');
          await updateDoc(doc(db, 'users', uid), { verified: true });
          data.verified = true;
          console.log('Database updated with verified status');
        }
        
        setUserData(data);
      } else {
        // Create user data if it doesn't exist
        const newUserData: UserData = {
          uid: uid,
          name: currentUser?.displayName || 'User',
          email: currentUser?.email || '',
          phone: '',
          role: 'customer',
          verified: currentUser?.emailVerified || false,
          createdAt: new Date().toISOString(),
        };
        
        await setDoc(doc(db, 'users', uid), newUserData);
        setUserData(newUserData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw new Error(formatErrorMessage(error));
    }
  };

  const refreshUserData = async () => {
    if (currentUser?.uid) {
      // Only reload the current user to get latest emailVerified status
      // The real-time listener will handle userData updates
      try {
        await currentUser.reload();
      } catch (error: any) {
        console.error('Error refreshing user data:', error);
        // If token expired, logout the user
        if (error?.code === 'auth/user-token-expired') {
          console.log('User token expired, logging out...');
          await logout();
        }
        throw new Error(formatErrorMessage(error));
      }
    }
  };

  const updateUserData = async (updates: Partial<UserData>) => {
    if (!currentUser?.uid) return;
    
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), updates);
      // Don't update local state here - the real-time listener will handle it
    } catch (error) {
      console.error('Error updating user data:', error);
      throw new Error(formatErrorMessage(error));
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  };

  const signup = async (name: string, email: string, phone: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // Send email verification immediately
      await sendEmailVerification(user);
      
      // Create user data in Firestore
      const userData: UserData = {
        uid: user.uid,
        name,
        email,
        phone,
        role: 'customer',
        verified: false,
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, 'users', user.uid), userData);
      
      // Don't sign out the user - let them go to verification page
      throw new Error('VERIFICATION_SENT');
    } catch (error: any) {
      if (error.message === 'VERIFICATION_SENT') {
        throw error;
      }
      throw new Error(formatErrorMessage(error));
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw new Error(formatErrorMessage(error));
    }
  };

  const sendVerificationEmail = async () => {
    if (currentUser) {
      try {
        await sendEmailVerification(currentUser);
      } catch (error) {
        throw new Error(formatErrorMessage(error));
      }
    } else {
      throw new Error('No user logged in');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.emailVerified);
      setCurrentUser(user);
      
      if (user) {
        try {
          await fetchUserData(user.uid);
        } catch (error) {
          console.error('Error fetching user data on auth change:', error);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // FIXED: Set up real-time listener for user data when user is authenticated
  useEffect(() => {
    if (!currentUser?.uid) return;

    console.log('Setting up real-time listener for user:', currentUser.uid);
    
    // Set up real-time listener for user document
    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as UserData;
          console.log('Real-time update received:', data);
          setUserData(data);
        }
      },
      (error) => {
        console.error('Error in real-time listener:', error);
      }
    );

    return () => {
      console.log('Cleaning up real-time listener');
      unsubscribe();
    };
  }, [currentUser?.uid]);

  // Listen for changes in emailVerified status
  useEffect(() => {
    if (currentUser && userData) {
      const checkVerificationStatus = async () => {
        try {
          // Reload user to get latest emailVerified status
          await currentUser.reload();
          
          // If email is verified in Firebase Auth but not in our database, update it
          if (currentUser.emailVerified && !userData.verified) {
            console.log('Email verification detected, updating database...');
            try {
              await updateDoc(doc(db, 'users', currentUser.uid), { verified: true });
              console.log('Database updated with verified status');
            } catch (error) {
              console.error('Error updating verification status:', error);
            }
          }
        } catch (error: any) {
          console.error('Error checking verification status:', error);
          // If token expired, logout the user
          if (error?.code === 'auth/user-token-expired') {
            console.log('User token expired during verification check, logging out...');
            await logout();
          }
        }
      };

      // Check verification status every 5 seconds when user is on verification page
      const interval = setInterval(checkVerificationStatus, 5000);
      
      return () => clearInterval(interval);
    }
  }, [currentUser, userData]);

  const value = {
    currentUser,
    userData,
    login,
    signup,
    logout,
    resetPassword,
    sendVerificationEmail,
    loading,
    updateUserData,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
