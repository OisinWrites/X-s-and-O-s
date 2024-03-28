const GameStatus = ({ currentPlayer, winner }) => {
    let status;
    if (winner) {
      status = `Winner: ${winner}`;
    } else {
      status = `Next player: ${currentPlayer}`;
    }
    return <div className="status">{status}</div>;
};