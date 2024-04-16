const GameStatus = ({ currentPlayer, winner, playerSymbol, isMyTurn }) => {
    let status;
    if (winner) {
        if (winner === playerSymbol) {
            status = "Congratulations! You won!";
        } else if (winner === 'Draw') {
            status = "It's a draw!";
        } else {
            status = "You lost! Better luck next time!";
        }
    } else {
        status = isMyTurn ? "It's your turn!" : "Waiting for opponent...";
    }
    return <div className="status">{status}</div>;
};

export default GameStatus;
