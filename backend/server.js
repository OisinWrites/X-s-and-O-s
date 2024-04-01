// Import necessary modules
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

// Create Express app
const app = express();
const server = http.createServer(app);

// Serve static files from the React app's build folder
app.use(express.static(path.join(__dirname, '..', 'frontend', 'tic-tac-toe', 'build')));

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests from frontend origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Allow the specified methods
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With'], // Allow the specified headers
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

// Define route handler for the root URL
app.get('/', (req, res) => {
  console.log('Request received for the root URL'); // Log when a request is received
  res.sendFile(path.join(__dirname, '..', 'frontend', 'tic-tac-toe', 'build', 'index.html')); // Serve the React app's index.html
});

// Create Socket.io instance and attach it to the HTTP server
const io = socketIo(server);

// Initialize game state
const games = {}; // Object to store game instances

// Function to create a new game instance
function createGame(player1, player2) {
  const gameId = generateGameId(); // Generate a unique game ID
  const gameIdLastSix = gameId.slice(-6); // Get the last 6 digits of the game ID
  console.log(`Game created with ID: ${gameIdLastSix}`);
  
  games[gameId] = {
    players: [player1, player2],
    gameBoard: Array(9).fill(null),
    currentPlayer: 'X',
    winner: null
    // Add any other game state properties as needed
  };
  return gameId;
}

// Function to generate a unique game ID
function generateGameId() {
  return Math.random().toString(36).substring(2, 10); // Example ID generation, you may need a more robust approach
}

// Set up event handlers for Socket.io connections
io.on('connection', (socket) => {
  console.log('A user connected');

  // Event handler for creating a new game instance
  socket.on('createGame', () => {
    console.log('Creating a new game...');
    const gameId = createGame(socket.id, null); // Player 1 is the creator
    console.log('New game created:', gameId);
    socket.join(gameId); // Join the room corresponding to the game ID
    socket.emit('gameCreated', gameId); // Notify the creator of the game ID
  });

  // Event handler for joining an existing game instance
  socket.on('joinGame', (gameId) => {
    const game = games[gameId];
    if (game && !game.players[1]) {
      game.players[1] = socket.id; // Assign player 2
      socket.join(gameId); // Join the room corresponding to the game ID
      io.to(gameId).emit('gameStart'); // Notify both players that the game has started
    } else {
      // Handle error: game not found or already full
      socket.emit('gameError', 'Game not found or already full');
    }
  });

  // Event handler for player move
  socket.on('move', ({ gameId, index }) => {
    const game = games[gameId];
    if (game && game.players.includes(socket.id) && game.currentPlayer === getPlayerSymbol(socket.id)) {
        // Update game state
        game.gameBoard[index] = game.currentPlayer;
        // Check for win/draw conditions, update currentPlayer, winner, etc.
        
        // Serialize game state
        const serializedGameState = serializeGameState(game);
        // Emit game state update to all players in the game room
        io.to(gameId).emit('gameStateUpdate', serializedGameState);
    } else {
        // Handle error: invalid move
        socket.emit('moveError', 'Invalid move');
    }
  });

  // Other event handlers as needed

  // Disconnect event handler
  socket.on('disconnect', () => {
    console.log('A user disconnected');
    // Handle disconnection and update game state if necessary
    // ...
  });
});

// Start the server
const PORT = process.env.PORT || 5000; // Use the specified port or default to 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// New code snippet for the API endpoint
app.get('/api/data', (req, res) => {
  // Your logic to fetch data from the database or any other source
  // Replace the following dummy data with your actual data logic
  const data = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' }
  ];
  
  // Send the data as JSON response
  res.json(data);
});