import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const Notification: React.FC<NotificationProps> = ({
  message,
  type,
  isVisible,
  onClose,
  duration = 3000
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(onClose, 300); // Wait for exit animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible && !isAnimating) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getIconBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100';
      case 'error':
        return 'bg-red-100';
      case 'warning':
        return 'bg-yellow-100';
      case 'info':
        return 'bg-blue-100';
      default:
        return 'bg-blue-100';
    }
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] pointer-events-none">
      <div
        className={`
          bg-white rounded-full shadow-lg border border-gray-200
          min-w-[280px] max-w-md mx-auto pointer-events-auto
          transform transition-all duration-300 ease-out
          ${isAnimating && isVisible 
            ? 'translate-y-0 opacity-100 scale-100' 
            : '-translate-y-4 opacity-0 scale-95'
          }
        `}
      >
        {/* Content */}
        <div className="px-4 py-2">
          <div className="flex items-center space-x-3">
            {/* Icon with background */}
            <div className={`flex-shrink-0 w-7 h-7 ${getIconBgColor()} rounded-full flex items-center justify-center`}>
              {getIcon()}
            </div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 leading-tight">
                {message}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={() => {
                setIsAnimating(false);
                setTimeout(onClose, 300);
              }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification;