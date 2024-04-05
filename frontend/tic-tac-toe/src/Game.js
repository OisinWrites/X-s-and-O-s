import React, { Component } from 'react';
import GameBoard from './components/GameBoard';
import GameStatus from './components/GameStatus';
import './styles.css';
import io from 'socket.io-client';

class Game extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gameId: null,
      board: Array(9).fill(null),
      currentPlayer: 'X',
      winner: null,
      joinGameId: '',
      playerSymbol: null, // Initialized as null
      isGameCreated: false,
      isGameStarted: false,
    };

    this.socket = io(window.location.origin);
    this.setupSocketListeners();
  }

  setupSocketListeners = () => {
    this.socket.on('gameStateUpdate', this.handleGameStateUpdate);
    this.socket.on('gameError', this.handleGameError);
    this.socket.on('gameCreated', this.handleGameCreated);
    this.socket.on('gameStart', this.handleGameStart);
  };

  componentWillUnmount() {
    this.socket.off('gameStateUpdate');
    this.socket.off('gameError');
    this.socket.off('gameCreated');
    this.socket.off('gameStart');
  }

  handleGameCreated = (gameId) => {
    console.log('Game created with ID:', gameId);
    this.setState({ gameId, isGameCreated: true }, () => {
        console.log('New state:', this.state);
    });
};

  handleGameStart = (data) => {
    console.log('Game started:', data);
    const playerSymbol = data.players[0] === this.socket.id ? 'X' : 'O';
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

  handleGameStateUpdate = (data) => {
    console.log('Game state update:', data);
    this.setState({
      board: data.board,
      currentPlayer: data.currentPlayer,
      winner: data.winner,
      // No need to set isGameStarted here if it's already handled in handleGameStart
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
    this.socket.emit('move', { gameId: this.state.gameId, index });
  };

  createGame = () => {
    this.socket.emit('createGame');
  };

  joinGame = () => {
    this.socket.emit('joinGame', this.state.joinGameId);
  };

  handleJoinGameInputChange = (event) => {
    this.setState({ joinGameId: event.target.value });
  };

  render() {
    const { isGameCreated, gameId, board, currentPlayer, winner, isGameStarted } = this.state;
    return (
      <div className="game">
        {isGameCreated && isGameStarted ? (
          <>
            <p>Game ID: {this.state.gameId}</p>
            <GameBoard board={board} onSquareClick={this.handleSquareClick} />
            <GameStatus currentPlayer={currentPlayer} winner={winner} />
          </>
        ) : (
          <div>
            <button className="button" onClick={this.createGame}>Create Game</button>
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
