import React, { Component } from 'react';
import GameBoard from './components/GameBoard';
import GameStatus from './components/GameStatus';
import './styles.css';
import io from 'socket.io-client';
import { getCookie, setCookie, generatePlayerId } from './utils';


class Game extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gameId: null,
      board: Array(9).fill(null),
      currentPlayer: 'X',
      winner: null,
      joinGameId: '',
      playerSymbol: null,
      isGameCreated: false,
      isGameStarted: false,
      results: { X: 0, O: 0, draws: 0 },
      showNewGameButton: false,
    };

    this.startNewGame = this.startNewGame.bind(this);
    this.socket = io(window.location.origin);
    this.setupSocketListeners();
  }

  setupSocketListeners = () => {
    this.socket.on('gameStateUpdate', this.handleGameStateUpdate);
    this.socket.on('gameError', this.handleGameError);
    this.socket.on('gameCreated', this.handleGameCreated);
    this.socket.on('gameStart', this.handleGameStart);
    this.socket.on('rejoinedGame', this.handleRejoinedGame);
    this.socket.on('newGameStarted', this.handleNewGameStarted);
  };

  componentDidMount() {
      let playerId = getCookie('playerId');
      if (!playerId) {
          playerId = generatePlayerId();
          setCookie('playerId', playerId, 365); // Store for 365 days
      }
      this.playerId = playerId; // Store playerId in the component for later use

      const urlParams = new URLSearchParams(window.location.search);
      const gameId = urlParams.get('gameId');
      if (gameId) {
          this.setState({ joinGameId: gameId }, this.joinGame);
      }
  }

  componentWillUnmount() {
    this.socket.off('gameStateUpdate');
    this.socket.off('gameError');
    this.socket.off('gameCreated');
    this.socket.off('gameStart');
    this.socket.off('rejoinedGame');
  }

  handleGameCreated = (data) => {
    console.log('Game created with ID:', data.gameId);
    this.setState({ gameId: data.gameId, shareableLink: data.shareableLink, isGameCreated: true }, () => {
      this.shareGameLink();
    });
  };

  shareGameLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join My Game',
        url: this.state.shareableLink,
      }).then(() => {
        console.log('Thanks for sharing!');
      })
      .catch(console.error);
    } else {
      // Fallback for browsers that do not support the Web Share API
      // Show the link in a prompt or modal for the user to copy
      alert(`Copy and share this link: ${this.state.shareableLink}`);
    }
  };

  handleGameStart = (data) => {
    console.log('Game started:', data);
    const playerSymbol = data.players[0] === this.playerId ? 'X' : 'O';
    // Ensure the gameId is updated in the state when the game starts
    this.setState({
      gameId: data.gameId, // Set the gameId from the gameStart event data
      isGameStarted: true,
      playerSymbol: playerSymbol,
      isGameCreated: true, // Ensure the UI transitions for the player joining a game
    }, () => {
      console.log('Game state after starting:', this.state);
    });
  };

  handleRejoinedGame = (data) => {
    console.log('Successfully rejoined game:', data.gameId);

    this.setState({
      gameId: data.gameId,
      playerSymbol: data.playerSymbol,
      isGameCreated: true,
      isGameStarted: true,
    });
  };
  

  handleGameStateUpdate = (data) => {
    const gameEnded = data.winner !== null || !data.board.includes(null);

    console.log('Game state update:', data);
    this.setState({
      board: data.board,
      currentPlayer: data.currentPlayer,
      winner: data.winner,
      showNewGameButton: gameEnded,
    });
  };

  handleGameError = (errorMessage) => {
    console.error('Game Error:', errorMessage);
  };

  handleSquareClick = (index) => {
    const { board, winner, isGameStarted, playerSymbol, currentPlayer } = this.state;
    console.log(`Square clicked: ${index}, isGameStarted: ${isGameStarted}, currentPlayer: ${currentPlayer}, playerSymbol: ${playerSymbol}`);
  
    if (isGameStarted && !board[index] && !winner && playerSymbol === currentPlayer) {
      console.log(`Valid move by ${playerSymbol} at index ${index}`);
      this.sendMoveToServer(index);
    } else {
      console.log(`Invalid move attempt: isGameStarted=${isGameStarted}, board[index]=${board[index]}, winner=${winner}, playerSymbol=${playerSymbol}, currentPlayer=${currentPlayer}`);
    }
  };

  sendMoveToServer = (index) => {
    this.socket.emit('move', { gameId: this.state.gameId, index, playerId: this.playerId });
  };

  createGame = () => {
    this.socket.emit('createGame', { playerId: this.playerId });
  };

  joinGame = () => {
    this.socket.emit('joinGame', { gameId: this.state.joinGameId, playerId: this.playerId });
  };

  handleJoinGameInputChange = (event) => {
    this.setState({ joinGameId: event.target.value });
  };

  startNewGame = () => {
    console.log("Starting new game for gameId:", this.state.gameId);

    this.socket.emit('startNewGame', { gameId: this.state.gameId });
  };

  handleNewGameStarted = (data) => {
    console.log("New game data received:", data);

    this.setState({
      board: data.board, // Ensure this is a reset board
      currentPlayer: data.currentPlayer, // Updated player to start
      winner: null, // Clear any winner
      showNewGameButton: false, // Hide "Start New Game" button
      results: data.results, // Ensure this contains the updated results, including any new wins
    });
  };

  render() {
    const { isGameCreated, gameId, board, currentPlayer, winner, isGameStarted, results, showNewGameButton } = this.state;
    console.log("Results before rendering crowns:", this.state.results);
    const renderCrowns = (count) => {
      console.log("Rendering crowns for count:", count);
      return Array(count).fill('👑').map((crown, index) => <span key={index}>{crown}</span>);
    };

    return (
      <div className="game">
        {isGameCreated && isGameStarted ? (
          <>
            <p>Game ID: {this.state.gameId}</p>
            <div>{renderCrowns(this.state.results.X)}</div> {/* For "X" player */}
            <div>{renderCrowns(this.state.results.O)}</div> {/* For "O" player */}
            <GameBoard board={board} onSquareClick={this.handleSquareClick} />
            <GameStatus currentPlayer={currentPlayer} winner={winner} />
            {showNewGameButton && (
              <button onClick={this.startNewGame}>Start New Game</button>
            )}
          </>
        ) : (
          <div>
            <button className="button" onClick={this.createGame}>Invite to Play</button>
            <input type="text" placeholder="Enter Game ID" value={this.state.joinGameId} onChange={this.handleJoinGameInputChange} />
            <button className="button" onClick={this.joinGame}>Join Game</button>
            <p>Game ID: {this.state.gameId}</p>
          </div>
        )}
      </div>
    );
  }
}

export default Game;
