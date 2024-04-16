const GameStatus = ({ currentPlayer, winner }) => {
    let status;
    if (winner) {
      status = `Winner: ${winner}`;
    } else {
      status = `${currentPlayer}'s Turn`;
    }
    return <div className="status">{status}</div>;
};

export default GameStatus;