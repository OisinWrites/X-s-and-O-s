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
    players: [{id: playerId, symbol: 'X'}],
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
  console.log('User connected:', socket.id);

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

    if (!game) {
      socket.emit('gameError', 'Game not found');
      return;
    }

    // Check if the player is already part of the game
    const existingPlayer = game.players.find(p => p.id === playerId);

    // Player is rejoining the game
    if (existingPlayer) {
      socket.join(gameId);
      socket.emit('rejoinedGame', { gameId, playerSymbol: existingPlayer.symbol });

      // Immediately send the current game state to the rejoined player
      const gameState = {
        board: game.gameBoard,
        currentPlayer: game.currentPlayer,
        winner: game.winner
      };
      socket.emit('gameStateUpdate', gameState);

      return;
    }


    if (game.players.length === 1) {

      game.players.push({id: playerId, symbol: 'O'});
      socket.join(gameId); // Second player joins the game room

      // Notify both players that the game has started
      io.to(gameId).emit('gameStart', { gameId, players: game.players.map(p => p.id) });

      // Send the current game state to both players
      const gameState = {
        board: game.gameBoard,
        currentPlayer: game.currentPlayer,
        winner: game.winner
      };
      io.to(gameId).emit('gameStateUpdate', gameState);
    } else {
      socket.emit('gameError', 'Game already full');
    }
  });

  socket.on('move', ({ gameId, index, playerId }) => {
    const game = games[gameId];
    if (!game) {
      socket.emit('gameError', 'Invalid game ID');
      return;
    }

    const player = game.players.find(p => p.id === playerId);
    if (!player) {
      socket.emit('gameError', 'Player not found in this game');
      return;
    }

    if (game.gameBoard[index] === null && game.currentPlayer === player.symbol) {
      game.gameBoard[index] = player.symbol;
      game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
      const winner = calculateWinner(game.gameBoard);
      if (winner) {
        game.winner = winner;
      }

      io.to(gameId).emit('gameStateUpdate', { gameId, board: game.gameBoard, currentPlayer: game.currentPlayer, winner: game.winner });
    } else {
      socket.emit('gameError', 'Invalid move: Not your turn or position taken');
    }
  });

  socket.on('startNewGame', ({ gameId }) => {
    console.log("Received request to start new game for gameId:", gameId);

    const game = games[gameId];
    if (!game) {
      console.log("Game not found for ID:", gameId);
      return; // Ensure the game exists
    }
  
    // Toggle starting player for the new game
    game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
    // Reset the game board
    game.gameBoard.fill(null);
    game.winner = null;
  
    // Notify players to start a new game
    io.to(gameId).emit('newGameStarted', {
      board: game.gameBoard,
      currentPlayer: game.currentPlayer,
      results: game.results,
    });
  });
});

// Add a catch-all route to serve the index.html file for any unrecognized routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'tic-tac-toe', 'build', 'index.html'));
});
