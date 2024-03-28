import React from 'react';
import { calculateWinner } from './utils';

class Game extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        board: Array(9).fill(null), // Represents the game board
        currentPlayer: 'X', // X starts the game
        winner: null, // Indicates the winner (X, O, or null)
      };
    }

  // Function to handle square click
  handleSquareClick = (index) => {
    // Check if the square is already filled or if there's a winner
    if (!this.state.board[index] && !this.state.winner) {
      const newBoard = [...this.state.board];
      newBoard[index] = this.state.currentPlayer;
      // Update the game board and check for winner
      this.setState({
        board: newBoard,
        currentPlayer: this.state.currentPlayer === 'X' ? 'O' : 'X',
        winner: calculateWinner(newBoard),
      });
    }
  };

  render() {
    return (
      <div className="game">
        <GameBoard board={this.state.board} onSquareClick={this.handleSquareClick} />
        <GameStatus currentPlayer={this.state.currentPlayer} winner={this.state.winner} />
      </div>
    );
  }
}

export default Game;