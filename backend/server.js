const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = process.env.PORT || 5000; // Use the PORT environment variable with a fallback
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Serve static files from the React app's build directory
app.use(express.static(path.join(__dirname, '..', 'frontend', 'tic-tac-toe', 'build')));

const games = {};

function createGame(playerId) {
  const gameId = Math.random().toString(36).substring(2, 10);
  console.log(`Game created: ${gameId}, by player: ${playerId}`);
  games[gameId] = {
    players: [playerId],
    gameBoard: Array(9).fill(null),
    currentPlayer: 'X',
    winner: null
  };
  return gameId;
}

function calculateWinner(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

io.on('connection', (socket) => {
  console.log('User connected:', '@'socket.id);

  socket.on('createGame', (data) => {
    const playerId = data.playerId;
    const gameId = createGame(playerId);
    socket.join(gameId);
  
    // Check if the environment is development or production
    const baseUrl = process.env.NODE_ENV === 'production' ? 'https://naughts-and-crosses-bfca04db7241.herokuapp.com' : 'http://localhost:5000';
    
    const shareableLink = `${baseUrl}/game?gameId=${gameId}`;
  
    socket.emit('gameCreated', { gameId, shareableLink });
    console.log(`Game ${gameId} created and user ${playerId} joined with link: ${shareableLink}`);
  });

  socket.on('joinGame', (data) => {
    const gameId = data.gameId;
    const playerId = data.playerId;
    const game = games[gameId];

    if (game && game.players.length < 2 && !game.players.includes(playerId)) {

      game.players.push(playerId);
      socket.join(gameId); // Second player joins the game room

      console.log(`Game ${gameId} started with players: ${game.players.join(', ')}`);

      // Notify both players that the game has started
      io.to(gameId).emit('gameStart', { gameId, players: game.players });

      // Send the current game state to both players
      const gameState = {
        board: game.gameBoard,
        currentPlayer: game.currentPlayer,
        winner: game.winner
      };
      io.to(gameId).emit('gameStateUpdate', gameState);
    } else {
      socket.emit('gameError', 'Game not found or already full');
      console.log(`Error joining game ${gameId}: Game not found or already full`);
    }
  });

  socket.on('move', ({ gameId, index }) => {
    const game = games[gameId];
    if (!game) {
      console.log(`Invalid game ID: ${gameId} for move`);
      socket.emit('gameError', 'Invalid game ID');
      return;
    }

    console.log(`Received move from ${socket.id} for game ${gameId} at index ${index}`);

    if (game.players.includes(socket.id) && game.players.length === 2 && game.gameBoard[index] === null) {
      const playerSymbol = game.players.indexOf(socket.id) === 0 ? 'X' : 'O';
      if (game.currentPlayer === playerSymbol) {
        game.gameBoard[index] = playerSymbol;
        const winner = calculateWinner(game.gameBoard);
        game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
        if (winner) {
          game.winner = winner;
        }

        io.to(gameId).emit('gameStateUpdate', { gameId, board: game.gameBoard, currentPlayer: game.currentPlayer, winner: game.winner });
        console.log(`Move made in game: ${gameId} by player ${playerSymbol}, board state:`, game.gameBoard);
      } else {
        console.log(`Invalid move by ${socket.id}: Not player's turn or invalid index`);
        socket.emit('gameError', 'Invalid move: Not your turn or position taken');
      }
    } else {
      console.log(`Invalid move attempt by ${socket.id} for game ${gameId}`);
      socket.emit('gameError', 'Invalid move or game state');
    }
  });
});

// Add a catch-all route to serve the index.html file for any unrecognized routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'tic-tac-toe', 'build', 'index.html'));
});
