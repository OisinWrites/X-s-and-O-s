import React, { Component } from 'react';
import GameBoard from './components/GameBoard';
import GameStatus from './components/GameStatus';
import './styles.css';
import io from 'socket.io-client';
import { getCookie, setCookie, generatePlayerId, getRandomImageId, generateUsername } from './utils';
import { Image } from 'cloudinary-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateRight, faHouseChimneyWindow } from '@fortawesome/free-solid-svg-icons';


class Game extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gameId: null,
      board: Array(9).fill({symbol: null, imageId: null}),
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
    let username = getCookie('username');

    if (!playerId) {
      playerId = generatePlayerId();
      username = generateUsername();
      setCookie('playerId', playerId, 365);
      setCookie('username', username, 365);
    } else if (!username) {
      username = generateUsername();
      setCookie('username', username, 365);
    }

    this.playerId = playerId;
    this.setState({ username });

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
    this.setState({
        gameId: data.gameId,
        shareableLink: data.shareableLink,
        isGameCreated: true
    }, () => {
        this.shareGameLink();
        this.updateMyGamesList();  // Fetch the updated list of games
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
    const gameEnded = data.winner !== null || data.board.every(cell => cell.symbol !== null);
    this.setState({
        board: data.board,
        currentPlayer: data.currentPlayer,
        winner: data.winner,
        showNewGameButton: gameEnded,
        results: data.results,
    });
  };
  
  handleGameError = (errorMessage) => {
    console.error('Game Error:', errorMessage);
  };

  handleSquareClick = (index) => {
    console.log("Square at index", index, "is currently:", this.state.board[index]);
    const { board, winner, isGameStarted, playerSymbol, currentPlayer } = this.state;
    if (isGameStarted && board[index].symbol === null && !winner && playerSymbol === currentPlayer) {
      const newBoard = [...board];
      const imageId = getRandomImageId(playerSymbol); // Use the utility function
      newBoard[index] = {symbol: playerSymbol, imageId}; // Update the square with both symbol and image ID
      this.setState({ board: newBoard });
      this.sendMoveToServer(index, imageId);
    }
  };

  updateMyGamesList = () => {
    this.socket.emit('listMyGames', { playerId: this.playerId });
  };

  handleMyGamesList = (data) => {
    this.setState({ myGames: data.games });
  };

  sendMoveToServer = (index, imageId) => {
    const symbol = this.state.playerSymbol;
    this.socket.emit('move', { gameId: this.state.gameId, index, playerId: this.playerId, symbol, imageId });
  };

  createGame = () => {
    this.socket.emit('createGame', { playerId: this.playerId });
  };

  joinGame = () => {
    this.socket.emit('joinGame', { gameId: this.state.joinGameId, playerId: this.playerId });
    this.updateMyGamesList();
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

  returnToHome = () => {
    this.setState({
        gameId: null,
        board: Array(9).fill({symbol: null, imageId: null}),
        currentPlayer: 'X',
        winner: null,
        joinGameId: '',
        playerSymbol: null,
        isGameCreated: false,
        isGameStarted: false,
        results: { X: 0, O: 0, draws: 0 },
        showNewGameButton: false,
        myGames: [],  // Clear existing games to force a re-fetch
    }, () => {
        this.updateMyGamesList();  // Fetch the updated list of games
    });
  };


  render() {
    const { isGameCreated, isGameStarted, results, showNewGameButton, opponentId, username, winner, playerId } = this.state;

    const renderCrowns = (count) => {
      return Array(count).fill(
        <Image 
          className="crown-image"
          cloudName="REACT_APP_CLOUDINARY_CLOUD_NAME"
          publicId="https://res.cloudinary.com/dwhennrjl/image/upload/v1713195282/media/xos/crowns/crowns7_wiztl9.png"
          crop="scale" 
        />

      ).map((crown, index) => <span key={index}>{crown}</span>);
    };

    return (
      <div className="game midnight-green-font honeydew">
        {isGameCreated && isGameStarted ? (
          <div>
            <button onClick={this.returnToHome} className="return-home-button midnight-green honeydew-font"><FontAwesomeIcon icon={faHouseChimneyWindow} /></button>
            <div className='opponentinfo'>
            <div>{renderCrowns(results.O)}</div>
          </div>

          <GameBoard className="gameboard" board={this.state.board} onSquareClick={this.handleSquareClick} />

          <div className='playerinfo'>
            <div>{renderCrowns(results.X)}</div>
          </div>

          <div className='game-status'>
            <GameStatus 
              currentPlayer={this.state.currentPlayer}
              winner={this.state.winner}
              playerSymbol={this.state.playerSymbol}
              isMyTurn={this.state.currentPlayer === this.state.playerSymbol}
            />       
          </div>

          {showNewGameButton && (
          <div>
          <button className="new-game-button midnight-green-font" onClick={this.startNewGame}>
            <FontAwesomeIcon className="new-game-icon" icon={faRotateRight} />
            <div className="new-game-text">
              <Image className="new-game-text-image" cloudName="REACT_APP_CLOUDINARY_CLOUD_NAME" publicId="https://res.cloudinary.com/dwhennrjl/image/upload/v1713273871/inkpx-curved-text_1_bydkfb.png" width="300" crop="scale" />
            </div>
          </button>                 
          </div>
          )}
          </div>
        ) : (
          <>
            <div>
              <div className='button-parent'>
                <div className='midnight-green'>
                  <button className="button invite-button dogwood gluten-bubble" onClick={this.createGame}>INVITE</button>
                </div>
              </div>

              <div className="logo">
                <Image className="logo-image" cloudName="REACT_APP_CLOUDINARY_CLOUD_NAME" publicId="https://res.cloudinary.com/dwhennrjl/image/upload/v1713185054/media/xos/xopng-Photoroom_2_sx93d4.png" width="300" crop="scale" />
              </div>
            </div>            
          </>
        )}

        <div className='my-games'>
          <div>
            {this.state.myGames.length > 0 && (  
              <h3>My Games</h3>
            )}
            <div className='housed-x-scroller'>                
              {this.state.myGames.map(gameId => (
                <div className="active-games" key={gameId} onClick={() => this.joinGameDirectly(gameId)}>
                  <div className="active-games-div">
                    <Image className="active-games-image" cloudName="REACT_APP_CLOUDINARY_CLOUD_NAME" publicId="https://res.cloudinary.com/dwhennrjl/image/upload/v1713277107/433-Photoroom_bgin2q.png" crop="scale" />
                  </div>
                  <div className='active-games-name'>
                    {gameId}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Game;
