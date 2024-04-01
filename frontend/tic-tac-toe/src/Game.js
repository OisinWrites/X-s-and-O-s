import React, { Component } from 'react';
import GameBoard from './components/GameBoard';
import GameStatus from './components/GameStatus';
import './styles.css'; // Import CSS file
import io from 'socket.io-client';
import { calculateWinner } from './utils';

class Game extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gameId: null, // Track the current game ID
      board: Array(9).fill(null), // Represents the game board
      currentPlayer: 'X', // X starts the game
      winner: null, // Indicates the winner (X, O, or null)
    };

    // Initialize Socket.io connection
    this.socket = io('http://localhost:5000'); // Connect to the server

    // Bind event handlers
    this.socket.on('gameStateUpdate', this.handleGameStateUpdate);
    this.socket.on('gameError', this.handleGameError);
  }

  componentWillUnmount() {
    // Clean up event listeners when component unmounts
    this.socket.off('gameStateUpdate', this.handleGameStateUpdate);
    this.socket.off('gameError', this.handleGameError);
  }

  handleGameStateUpdate = ({ gameId, board, currentPlayer, winner }) => {
    // Update the game state based on the data received from the server
    this.setState({ gameId, board, currentPlayer, winner });
  };

  handleGameError = (errorMessage) => {
    // Handle game-related errors (e.g., game not found, game already full)
    console.error('Game Error:', errorMessage);
    // Implement error handling as needed
  };

  handleSquareClick = (index) => {
    // Handle square click event
    if (!this.state.board[index] && !this.state.winner) {
      const newBoard = [...this.state.board];
      newBoard[index] = this.state.currentPlayer;

      // Update the game board locally
      this.setState({
        board: newBoard,
        currentPlayer: this.state.currentPlayer === 'X' ? 'O' : 'X',
        winner: calculateWinner(newBoard),
      });

      // Send the move to the server
      this.sendMoveToServer(index);
    }
  };

  sendMoveToServer = (index) => {
    // Emit an event to the server with the move information and current gameId
    this.socket.emit('move', { gameId: this.state.gameId, index });
  };

  createGame = () => {
    // Emit an event to the server to create a new game
    this.socket.emit('createGame');
  };

  joinGame = (gameId) => {
    // Emit an event to the server to join an existing game
    this.socket.emit('joinGame', gameId);
    
    // Listen for game start event from the server
    this.socket.on('gameStart', () => {
      // Redirect the user to the game room once the game starts
      this.setState({ gameId });
    });
  
    // Listen for game error event from the server
    this.socket.on('gameError', (errorMessage) => {
      // Handle game-related errors (e.g., game not found, game already full)
      console.error('Game Error:', errorMessage);
      // Clear the game ID entered by the user
      this.setState({ gameId: null });
    });
  };

  render() {
    return (
      <div className="game">
        {!this.state.gameId ? (
          <div>
            <button className="button" onClick={this.createGame}>Create Game</button>
            <input type="text" placeholder="Enter Game ID" onChange={(e) => this.setState({ gameId: e.target.value })} />
            <button className="button" onClick={() => this.joinGame(this.state.gameId)}>Join Game</button>
            <p>Hi Oisin</p>
          </div>
        ) : (
          <div>
            <div className="game-board">
              <GameBoard board={this.state.board} onSquareClick={this.handleSquareClick} />
            </div>
            <div className="game-info">
              <GameStatus currentPlayer={this.state.currentPlayer} winner={this.state.winner} />
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default Game;
