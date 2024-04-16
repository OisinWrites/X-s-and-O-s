const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const socketMap = new Map();

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

const games = {};

function createGame(playerId) {
  const gameId = Math.random().toString(36).substring(2, 10);
  console.log(`Game created: ${gameId}, by player: ${playerId}`);
  games[gameId] = {
    players: [{id: playerId, symbol: 'X'}],
    gameBoard: Array(9).fill({symbol: null, imageId: null}),
    currentPlayer: 'X',
    winner: null,
    nextStarter: 'O',
    results: { X: 0, O: 0, draws: 0 }
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
  
    const baseUrl = process.env.NODE_ENV === 'production' ? 'https://naughts-and-crosses-bfca04db7241.herokuapp.com' : 'http://localhost:5000';
    
    const shareableLink = `${baseUrl}/game?gameId=${gameId}`;
  
    socket.emit('gameCreated', { gameId, shareableLink });
    console.log(`Game ${gameId} created and user ${playerId} joined with link: ${shareableLink}`);
  });

  socket.on('register', (playerId) => {
    socketMap.set(playerId, socket.id);
  });

  socket.on('disconnect', () => {
    socketMap.delete(socket.playerId);
  });

  socket.on('listMyGames', ({ playerId }) => {
    const playerGames = Object.entries(games).filter(([gameId, game]) => 
        game.players.some(player => player.id === playerId)
    ).map(([gameId]) => gameId);

    socket.emit('myGamesList', { games: playerGames });
  });

  socket.on('joinGame', (data) => {
    const { gameId, playerId } = data;
    const game = games[gameId];

    if (!game) {
      socket.emit('gameError', 'Game not found');
      return;
    }

    const existingPlayer = game.players.find(p => p.id === playerId);

    if (existingPlayer) {
      socket.join(gameId);

      const opponent = game.players.find(p => p.id !== playerId);
      const opponentId = opponent ? opponent.id : null;

      socket.emit('rejoinedGame', { 
        gameId,
        playerSymbol: existingPlayer.symbol,
        opponentId,
      });

      const gameState = {
        board: game.gameBoard,
        currentPlayer: game.currentPlayer,
        winner: game.winner,
        results: game.results // Include results in gameState
      };
      socket.emit('gameStateUpdate', gameState);

      return;
    }

    if (game.players.length === 1) {

      game.players.push({id: playerId, symbol: 'O'});
      socket.join(gameId);

      io.to(gameId).emit('gameStart', { gameId, players: game.players.map(p => p.id) });

      const gameState = {
        board: game.gameBoard,
        currentPlayer: game.currentPlayer,
        winner: game.winner,
        results: game.results // Include results in gameState
      };
      io.to(gameId).emit('gameStateUpdate', gameState);
      updatePlayerGamesList(game.players);
    } else {
      socket.emit('gameError', 'Game already full');
    }
  });

  function updatePlayerGamesList(players) {
    players.forEach(player => {
      const socketId = socketMap.get(player.id);
      if (socketId && io.sockets.sockets.get(socketId)) {
        io.to(socketId).emit('myGamesList', { games: getPlayerGames(player.id) });
      }
    });
  }

  function getPlayerGames(playerId) {
    return Object.entries(games).reduce((acc, [key, value]) => {
      if (value.players.some(p => p.id === playerId)) {
        acc.push(key);
      }
      return acc;
    }, []);
  }

  socket.on('move', ({ gameId, index, playerId, symbol, imageId }) => {
    const game = games[gameId];
    if (!game) {
      socket.emit('gameError', 'Invalid game ID');
      return;
    }
    const player = game.players.find(p => p.id === playerId);
    if (!player || game.gameBoard[index].symbol !== null) {
      socket.emit('gameError', 'Invalid move: Position already taken or player not found');
      return;
    }
    if (game.currentPlayer === player.symbol) {
      game.gameBoard[index] = { symbol: player.symbol, imageId: imageId };
      game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';  // Correctly toggling player
      const winner = calculateWinner(game.gameBoard.map(cell => cell.symbol));
      if (winner) {
        game.winner = winner;
        game.results[winner] += 1;
      } else if (!game.gameBoard.some(cell => cell.symbol === null)) {
        game.results.draws += 1;
      }
      io.to(gameId).emit('gameStateUpdate', {
        gameId,
        board: game.gameBoard,
        currentPlayer: game.currentPlayer,
        winner: game.winner,
        results: game.results
      });
    } else {
      socket.emit('gameError', 'Not your turn');
    }
  });
  
  
  

  socket.on('startNewGame', ({ gameId }) => {
    const game = games[gameId];
    if (!game) {
      return;
    }

    const startingSymbol = game.nextStarter === 'X' ? 'X' : 'O';
    game.currentPlayer = startingSymbol;
    game.nextStarter = startingSymbol === 'X' ? 'O' : 'X';
    
    game.gameBoard = Array(9).fill().map(() => ({ symbol: null, imageId: null }));
    game.winner = null;
  
    io.to(gameId).emit('newGameStarted', {
      board: game.gameBoard,
      currentPlayer: game.currentPlayer,
      winner: game.winner,
      results: game.results,
    });
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
});
