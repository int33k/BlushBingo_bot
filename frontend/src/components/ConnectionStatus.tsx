import React from 'react';
import { useSocket } from '../hooks';

const ConnectionStatus: React.FC = () => {
  const { isConnected } = useSocket();

  return (
    <div className="flex items-center gap-2 text-sm">
      <div
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-400' : 'bg-red-400'
        }`}
      />
      <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
        {isConnected ? 'Connected' : 'Reconnecting...'}
      </span>
    </div>
  );
};

export default ConnectionStatus;
