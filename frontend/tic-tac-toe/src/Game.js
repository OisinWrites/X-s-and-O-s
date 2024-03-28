import React from 'react';
import Square from './Square';
import './styles.css'; // Import CSS file
import io from 'socket.io-client';
import { calculateWinner } from './utils';

class Game extends React.Component {
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
        // Update the game board state based on the move received from the server
        const newBoard = [...this.state.board];
        newBoard[index] = this.state.currentPlayer === 'X' ? 'O' : 'X';
        this.setState({
          board: newBoard,
          currentPlayer: this.state.currentPlayer === 'X' ? 'O' : 'X',
          winner: calculateWinner(newBoard),
        });
        console.log(`Received move from server: ${index}`);
    };
    
    handleSquareClick = (index) => {
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