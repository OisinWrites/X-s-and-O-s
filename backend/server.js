// Import necessary modules
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Create Express app
const app = express();
const server = http.createServer(app);

// Serve static files from the React app's build folder
app.use(express.static(path.join(__dirname, '..', 'frontend', 'tic-tac-toe', 'build')));

// Define route handler for the root URL
app.get('/', (req, res) => {
  console.log('Request received for the root URL'); // Log when a request is received
  res.sendFile(path.join(__dirname, '..', 'frontend', 'tic-tac-toe', 'build', 'index.html')); // Serve the React app's index.html
});

// Create Socket.io instance and attach it to the HTTP server
const io = socketIo(server);

// Initialize game state
let gameBoard = Array(9).fill(null); // Represents the Tic-Tac-Toe board
let currentPlayer = 'X'; // X starts the game
let winner = null; // Indicates the winner (X, O, or null)

// Function to check for a winner
const calculateWinner = (board) => {
  // Implementation of winning conditions (not shown here for brevity)
  // Return the winner or null if there's no winner yet
};

// Set up event handlers for Socket.io connections
io.on('connection', (socket) => {
    console.log('A user connected');
  
    // Event handler for player move
    socket.on('move', ({ index }) => {
      // Check if the move is valid
      if (!gameBoard[index] && !winner) {
        // Update game board
        gameBoard[index] = currentPlayer;
        
        // Check for winner
        winner = calculateWinner(gameBoard);
  
        // Broadcast game update to all connected clients
        io.emit('gameUpdate', { gameBoard, currentPlayer, winner });
      }
    });

  // Disconnect event handler
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start the server
const PORT = process.env.PORT || 5000; // Use the specified port or default to 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
