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
      myGames: [],
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
    this.socket.on('myGamesList', this.handleMyGamesList);
  };

  componentDidMount() {
    let playerId = getCookie('playerId');
    if (!playerId) {
      playerId = generatePlayerId();
      setCookie('playerId', playerId, 365);
    }
    this.playerId = playerId;

    this.socket.emit('listMyGames', { playerId: this.playerId });

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
    this.socket.off('myGamesList');
  }

  handleGameCreated = (data) => {
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
      alert(`Copy and share this link: ${this.state.shareableLink}`);
    }
  };

  handleGameStart = (data) => {
    const playerSymbol = data.players[0] === this.playerId ? 'X' : 'O';
    const opponentId = data.players.find(id => id !== this.playerId);
    this.setState({
      gameId: data.gameId,
      isGameStarted: true,
      playerSymbol: playerSymbol,
      isGameCreated: true,
      opponentId: opponentId,
    });
  };

  handleRejoinedGame = (data) => {
    this.setState({
      gameId: data.gameId,
      playerSymbol: data.playerSymbol,
      isGameCreated: true,
      isGameStarted: true,
      opponentId: data.opponentId,
    });
  };

  handleGameStateUpdate = (data) => {
    const gameEnded = data.winner !== null || !data.board.includes(null);
    this.setState({
      board: data.board,
      currentPlayer: data.currentPlayer,
      winner: data.winner,
      showNewGameButton: gameEnded,
      results: data.results, // Update results based on the latest gameState
    });
  };

  handleGameError = (errorMessage) => {
    console.error('Game Error:', errorMessage);
  };

  handleSquareClick = (index) => {
    const { board, winner, isGameStarted, playerSymbol, currentPlayer } = this.state;
    if (isGameStarted && !board[index] && !winner && playerSymbol === currentPlayer) {
      this.sendMoveToServer(index);
    }
  };

  handleMyGamesList = (data) => {
    this.setState({ myGames: data.games });
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

  joinGameDirectly = (gameId) => {
    this.setState({ joinGameId: gameId }, this.joinGame);
  };

  handleJoinGameInputChange = (event) => {
    this.setState({ joinGameId: event.target.value });
  };

  startNewGame = () => {
    this.socket.emit('startNewGame', { gameId: this.state.gameId });
  };

  handleNewGameStarted = (data) => {
    this.setState({
      board: data.board,
      currentPlayer: data.currentPlayer,
      winner: null,
      showNewGameButton: false,
      results: data.results, // Ensure to update the state with the new results
    });
  };

  render() {
    const { isGameCreated, gameId, board, currentPlayer, winner, isGameStarted, results, showNewGameButton, opponentId } = this.state;
    const renderCrowns = (count) => {
      return Array(count).fill('👑').map((crown, index) => <span key={index}>{crown}</span>);
    };

    return (
      <div className="game">
        {isGameCreated && isGameStarted ? (
          <>
            <p>Game ID: {gameId}</p>

            <div>O {renderCrowns(results.O)}</div>
            <div>{opponentId || 'Waiting for opponent...'}</div>

            <GameBoard board={board} onSquareClick={this.handleSquareClick} />

            <div class="your-id">{this.playerId}</div> 
            <div>X {renderCrowns(results.X)}</div>

            <GameStatus currentPlayer={currentPlayer} winner={winner} />
            {showNewGameButton && <button onClick={this.startNewGame}>Start New Game</button>}
          </>
        ) : (
          <div>
            <button className="button" onClick={this.createGame}>Invite to Play</button>
            <input type="text" placeholder="Enter Game ID" value={this.state.joinGameId} onChange={this.handleJoinGameInputChange} />
            <button className="button" onClick={this.joinGame}>Join Game</button>
            <p>Game ID: {gameId}</p>

            <div>
              <h3>My Games</h3>
              {this.state.myGames.map(gameId => (
                <div key={gameId} onClick={() => this.joinGameDirectly(gameId)} className="game-item">
                  Game: {gameId}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default Game;
