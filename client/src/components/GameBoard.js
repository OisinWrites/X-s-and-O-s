import Square from './Square';
import { Image } from 'cloudinary-react';


const GameBoard = ({ board, onSquareClick }) => {
    return (
      <div className="board-parent">
        <div className="board">
          {board.map((value, index) => (
            <Square key={index} value={value} onClick={() => onSquareClick(index)} />
          ))}
        </div>
        <div className="logo">
          <Image className="grid-outline" cloudName="REACT_APP_CLOUDINARY_CLOUD_NAME" publicId="https://res.cloudinary.com/dwhennrjl/image/upload/v1713189984/media/xos/xos-grid-outline_xwtqav.png" width="300" crop="scale" />
        </div>
      </div>

    );
};

export default GameBoard;