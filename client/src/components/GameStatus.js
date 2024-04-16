const GameStatus = ({ currentPlayer, winner, playerId }) => {
  let status;

  if (winner) {
      if (winner === playerId) {
          status = <div className="winner-banner">You win!</div>;
      } else {
          status = <div className="winner-banner">You lose!</div>;
      }
  } else {
      if (currentPlayer === playerId) {
          status = "Your turn";
      } else {
          status = "Opponent's turn";
      }
  }

  return <div className="status">{status}</div>;
};

export default GameStatus;
