import React from 'react';
import Square from './Square';
import './styles.css'; // Import CSS file
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

  renderSquare(index) {
    return (
      <Square
        value={this.state.board[index]}
        onClick={() => this.handleSquareClick(index)}
      />
    );
  }

renderGameStatus() {
    const { currentPlayer, winner } = this.state;
    if (winner) {
      return `Winner: ${winner}`;
    } else if (this.state.board.every((cell) => cell !== null)) {
      return 'Draw!';
    } else {
      return `Next player: ${currentPlayer}`;
    }
  }

  render() {
    return (
      <div className="game">
        <div className="game-board">
          <div className="board-row">
            {this.renderSquare(0)}
            {this.renderSquare(1)}
            {this.renderSquare(2)}
          </div>
          <div className="board-row">
            {this.renderSquare(3)}
            {this.renderSquare(4)}
            {this.renderSquare(5)}
          </div>
          <div className="board-row">
            {this.renderSquare(6)}
            {this.renderSquare(7)}
            {this.renderSquare(8)}
          </div>
        </div>
        <div className="game-info">
          <div>{this.renderGameStatus()}</div>
        </div>
      </div>
    );
  }
}

export default Game;