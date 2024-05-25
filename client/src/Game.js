import React, { Component } from 'react';
import GameBoard from './components/GameBoard';
import GameStatus from './components/GameStatus';
import './styles.css';
import io from 'socket.io-client';
import { getCookie, setCookie, generatePlayerId, getRandomImageId, generateUsername } from './utils';
import { Image } from 'cloudinary-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRotateRight, 
  faHouseChimneyWindow, 
  faSquareXmark, 
  faTrashCan, 
  faCircleExclamation, 
  faArrowsRotate,
  faPencil
 } from '@fortawesome/free-solid-svg-icons';


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
      gameToDelete: null,
      showDeleteConfirmation: false,
      editingGameId: null,
      customNames: {},
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
    this.socket.on('gameDeleted', this.handleGameDeleted);
  };

  componentDidMount() {
    this.socket.on('connect', () => {
      console.log('Socket reconnected. Verifying game state...');
      this.requestGameState(); // Verify state upon reconnection
    });
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

    const customNames = JSON.parse(localStorage.getItem('customNames')) || {};
    this.setState({ customNames });

    this.playerId = playerId;
    this.setState({ username });

    this.gameEndTimeout = null;

    this.socket.emit('listMyGames', { playerId: this.playerId });

    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('gameId');
    if (gameId) {
      this.setState({ joinGameId: gameId }, this.joinGame);
    }
  }

  componentWillUnmount() {
    if (this.gameEndTimeout) {
      clearTimeout(this.gameEndTimeout);
    }
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

  requestGameState = () => {
    this.socket.emit('requestGameState', { gameId: this.state.gameId });
  }

  handleGameStateUpdate = (data) => {
    const gameEnded = data.winner !== null || data.board.every(cell => cell.symbol !== null);
    if (this.state.gameId === data.gameId) { // Ensure the update is for the current game
      this.setState({
        board: data.board,
        currentPlayer: data.currentPlayer,
        winner: data.winner,
        results: data.results
      });
    } else {
      console.error('Received game state for a different game');
    }

    if (gameEnded) {
      // Clear any existing timeout
      if (this.gameEndTimeout) {
          clearTimeout(this.gameEndTimeout);
      }
      // Set a new timeout
      this.gameEndTimeout = setTimeout(() => {
          this.setState({ showNewGameButton: true });
      }, 1500);
    } else {
      this.setState({ showNewGameButton: false });
    }
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
    const currentGameId = this.state.gameId; // the ID of the current game
    const filteredGames = data.games.filter(game => game.gameId !== currentGameId); // Remove the current game from the list
    this.setState({ myGames: filteredGames });
  };
  
  handleEditClick = (gameId) => {
    this.setState({ editingGameId: gameId });
  }

  handleNameChange = (event, gameId) => {
    const { customNames } = this.state;
    customNames[gameId] = event.target.value;
    this.setState({ customNames });
  }

  handleNameSubmit = (gameId) => {
    this.setState({ editingGameId: null });
    this.saveGameName(gameId, this.state.customNames[gameId]);
  }

  saveGameName = (gameId, gameName) => {
    const { customNames } = this.state;
    customNames[gameId] = gameName;
    localStorage.setItem('customNames', JSON.stringify(customNames));
    this.setState({ customNames });
  }

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

  handleDeleteGame = gameId => {
    this.setState({ gameToDelete: gameId, showDeleteConfirmation: true });
  };
  
  confirmDelete = () => {
    this.socket.emit('deleteGame', { gameId: this.state.gameToDelete, playerId: this.playerId });
    this.setState({ gameToDelete: null, showDeleteConfirmation: false });
  };
  
  cancelDelete = () => {
    this.setState({ gameToDelete: null, showDeleteConfirmation: false });
  };

  startNewGame = () => {
    this.socket.emit('startNewGame', { gameId: this.state.gameId });
  };

  handleReadyForNewGame = () => {
    this.socket.emit('playerReady', { gameId: this.state.gameId, playerId: this.playerId });
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
  
  handleKeyDown = (event, gameId) => {
    if (event.key === 'Enter') {
      this.handleNameSubmit(gameId);
      event.preventDefault();
  }};

  handleGameDeleted = (data) => {
    const { gameId } = data;
    this.setState(prevState => ({
      myGames: prevState.myGames.filter(id => id !== gameId),
      gameToDelete: null,
      showDeleteConfirmation: false,
    }));
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
        myGames: [],
        gameToDelete: null,
        showDeleteConfirmation: false,
    }, () => {
        this.updateMyGamesList();  // Fetch the updated list of games
    });
  };

  renderMyGamesList = () => {
    const { myGames, editingGameId, customNames } = this.state;
    return (
      <div className='my-games'>
        {myGames.length > 0 && (
          <div>
            <h3>My Games</h3>
          </div>
        )}
        <div className='housed-x-scroller'>
          {myGames.map(({ gameId, isMyTurn }) => (
            <div className="active-games" key={gameId}>
              <div onClick={() => this.joinGameDirectly(gameId)} className="active-games-div">
                <Image className="active-games-image" cloudName="REACT_APP_CLOUDINARY_CLOUD_NAME" publicId="https://res.cloudinary.com/dwhennrjl/image/upload/v1713277107/433-Photoroom_bgin2q.png" crop="scale" />
                <div className="turn-status">
                    {isMyTurn ? (
                    <div className='your-turn'>
                        <FontAwesomeIcon icon={faCircleExclamation} />
                      </div>
                    ) : null}
                </div>

              </div>

              <div className='active-games-name'>
                {editingGameId === gameId ? (
                  <input
                    className='edit-game-name-input dogwood midnight-green-font'
                    type="text"
                    value={customNames[gameId] || ''}
                    onChange={(e) => this.handleNameChange(e, gameId)}
                    onBlur={() => this.handleNameSubmit(gameId)}
                    onKeyDown={(e) => this.handleKeyDown(e, gameId)}
                    maxLength={8}
                    autoFocus
                  />
                ) : (
                  <div onClick={() => this.handleEditClick(gameId)} className="active-games-names">
                    <div>{customNames[gameId] || gameId}
                    <FontAwesomeIcon className="midnight-green-font" icon={ faPencil} /></div>
                  </div>
                )}
              </div>

              <button className="celeste-font" onClick={(e) => { e.stopPropagation(); this.handleDeleteGame(gameId); }}>
                <FontAwesomeIcon icon={faTrashCan} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };


  render() {
    const {
      gameId,
      isGameCreated,
      isGameStarted, 
      results,
      showNewGameButton, 
      showDeleteConfirmation,
      playerSymbol,
      customNames,
      currentPlayer
      } = this.state;

    const opponentSymbol = playerSymbol === 'X' ? 'O' : 'X';


    const renderCrowns = (count) => (
      Array(count).fill().map((_, index) => (
        <Image 
          key={index}
          className="crown-image"
          cloudName="REACT_APP_CLOUDINARY_CLOUD_NAME"
          publicId="https://res.cloudinary.com/dwhennrjl/image/upload/v1713195282/media/xos/crowns/crowns7_wiztl9.png"
          crop="scale" 
        />
      ))
    );

    return (
      <div className="game midnight-green-font honeydew">
          <button onClick={this.returnToHome} className="return-home-button midnight-green honeydew-font"><FontAwesomeIcon icon={faHouseChimneyWindow} /></button>

          <div>
            <div className="refresh-div">
              <button onClick={this.updateMyGamesList} className="refresh-button midnight-green-font">
                <FontAwesomeIcon icon={faArrowsRotate}/>
              </button>
              <p>Refresh</p>
              <p>Games</p>
            </div>
          </div>
        {isGameCreated && isGameStarted ? (
          <div>
            <div className='opponentinfo'>
              {renderCrowns(results[opponentSymbol])}
            </div>

            <GameBoard className="gameboard" board={this.state.board} onSquareClick={this.handleSquareClick} />
            <div className='game-name'>{customNames[gameId] || gameId}</div>

            <div className='playerinfo'>
              {renderCrowns(results[playerSymbol])}
            </div>

            <div className='game-status'>
              <GameStatus 
                currentPlayer={this.state.currentPlayer}
                winner={this.state.winner}
                playerSymbol={this.state.playerSymbol}
                isMyTurn={this.state.currentPlayer === this.state.playerSymbol}
              />       
            </div>

          {isGameStarted && showNewGameButton && (
          <div>
            <button className="new-game-button midnight-green-font" onClick={this.handleReadyForNewGame}>
              <FontAwesomeIcon className="new-game-icon" icon={faRotateRight} />
              <div className="new-game-text">
                <Image className="new-game-text-image" cloudName="REACT_APP_CLOUDINARY_CLOUD_NAME" publicId="https://res.cloudinary.com/dwhennrjl/image/upload/v1713273871/inkpx-curved-text_1_bydkfb.png" width="300" crop="scale" />
              </div>
            </button>                 
            <div>{currentPlayer === playerSymbol ? "Your Turn" : "Waiting for Opponent"}</div>
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
        {showDeleteConfirmation && (
        <div className="delete-confirmation"> 
          <div className='midnight-green delete-border'>
            <div className="delete-confirmation-inner dogwood midnight-green-font">
              <p>Are you sure you want to delete this game?</p>
              <button className='dogwood red-danger' onClick={this.confirmDelete}><FontAwesomeIcon icon={faTrashCan}/></button>
              <button className="dogwood midnight-green-font" onClick={this.cancelDelete}><FontAwesomeIcon icon={faSquareXmark}/></button>
            </div>
          </div>
        </div>
        )}
        
        <div className="game-list-container">
          {this.renderMyGamesList()}
        </div>
      </div>
    );
  }
}

export default Game;
