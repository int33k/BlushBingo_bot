const { io } = require('socket.io-client');

console.log('Testing Socket.IO connection to localhost:3001...');

const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling'],
  path: '/socket.io/',
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000
});

socket.on('connect', () => {
  console.log('✅ Socket connected successfully! ID:', socket.id);
  
  // Test authentication
  socket.emit('auth', { identifier: 'test_user_123', name: 'Test User' }, (response) => {
    console.log('Auth response:', response);
  });
  
  // Disconnect after 5 seconds
  setTimeout(() => {
    console.log('Disconnecting...');
    socket.disconnect();
    process.exit(0);
  }, 5000);
});

socket.on('disconnect', () => {
  console.log('Socket disconnected');
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message);
  process.exit(1);
});

socket.on('error', (error) => {
  console.log('❌ Socket error:', error);
});

console.log('Attempting to connect...');
