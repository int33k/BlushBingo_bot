# Bingo Game

A real-time multiplayer Bingo game with a phased development approach.

## Project Structure

The project is organized as a monorepo with both frontend and backend in the same repository:

- `frontend/`: React.js application with Socket.IO client
- `backend/`: Node.js server with Express.js, MongoDB, and Socket.IO

## Development Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://0.0.0.0:27017/bingo-game
   CLIENT_URL=http://0.0.0.0:3000
   ENABLE_TELEGRAM_AUTH=false
   ```

4. Start the development server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   VITE_SOCKET_URL=http://0.0.0.0:5000
   VITE_ENABLE_TELEGRAM_AUTH=false
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## Game Features

- Real-time multiplayer gameplay
- Turn-based Bingo card marking
- Line completion tracking
- Victory condition validation
- Disconnection handling
- Game expiration management

## Development Phases

### Phase 1: Core Game Development

- Basic game mechanics without Telegram integration
- Temporary user identification (Challenger/Acceptor)
- Clipboard-based challenge link sharing
- Testing with multiple browser windows

### Phase 2: Telegram Integration

- Telegram Login Widget
- Telegram sharing functionality
- Telegram theme compatibility
- Telegram Web App API integration

## License

This project is licensed under the MIT License - see the LICENSE file for details.
