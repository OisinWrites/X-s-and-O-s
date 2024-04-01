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
      board: Array(9).fill(null), // Represents the game board
      currentPlayer: 'X', // X starts the game
      winner: null, // Indicates the winner (X, O, or null)
    };

    // Initialize Socket.io connection
    this.socket = io('http://localhost:5000'); // Replace with your Socket.io server URL
  }

  componentDidMount() {
    // Listen for move events from the server
    this.socket.on('move', this.handleMoveFromServer);
    console.log('Listening for move events from the server...');
  }

  componentWillUnmount() {
    // Clean up event listeners when component unmounts
    this.socket.off('move', this.handleMoveFromServer);
    console.log('Removing move event listener...');
  }

  handleMoveFromServer = ({ index }) => {
    console.log(`Received move from server: ${index}`);
    // Update the game board state based on the move received from the server
    const newBoard = [...this.state.board];
    newBoard[index] = this.state.currentPlayer === 'X' ? 'O' : 'X';
    this.setState({
      board: newBoard,
      currentPlayer: this.state.currentPlayer === 'X' ? 'O' : 'X',
      winner: calculateWinner(newBoard),
    });
  };

  handleSquareClick = (index) => {
    console.log(`Square clicked: ${index}`);
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
      console.log(`Sent move to server: ${index}`);
    }
  };

  sendMoveToServer = (index) => {
    // Emit an event to the server with the move information
    this.socket.emit('move', { index });
  };

  render() {
    return (
      <div className="game">
        <div className="game-board">
          <GameBoard board={this.state.board} onSquareClick={this.handleSquareClick} />
        </div>
        <div className="game-info">
          <GameStatus currentPlayer={this.state.currentPlayer} winner={this.state.winner} />
        </div>
      </div>
    );
  }
}

export default Game;
