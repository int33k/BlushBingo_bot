import React, { useEffect } from 'react';

interface NotificationBannerProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  message,
  type,
  onClose,
  autoClose = true,
  duration = 5000
}) => {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 border-green-500 text-green-100';
      case 'error':
        return 'bg-red-600 border-red-500 text-red-100';
      case 'warning':
        return 'bg-yellow-600 border-yellow-500 text-yellow-100';
      case 'info':
        return 'bg-blue-600 border-blue-500 text-blue-100';
      default:
        return 'bg-gray-600 border-gray-500 text-gray-100';
    }
  };

  return (
    <div className="fixed top-4 left-4 right-4 z-50">
      <div className={`${getTypeStyles()} border-l-4 p-4 rounded-r-lg shadow-lg max-w-2xl mx-auto`}>
        <div className="flex items-start">
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 mr-3 text-xl hover:opacity-75 transition-opacity cursor-pointer"
            aria-label="Close notification"
          >
            {type === 'success' && '✓'}
            {type === 'error' && '✗'}
            {type === 'warning' && '⚠'}
            {type === 'info' && 'ℹ'}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium break-words">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationBanner;