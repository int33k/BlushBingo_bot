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
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4`}>
      <div className={`${getTypeStyles()} border-l-4 p-4 rounded-r-lg shadow-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {type === 'success' && <span className="text-xl">✓</span>}
              {type === 'error' && <span className="text-xl">✗</span>}
              {type === 'warning' && <span className="text-xl">⚠</span>}
              {type === 'info' && <span className="text-xl">ℹ</span>}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{message}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-lg hover:opacity-75 transition-opacity"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationBanner;