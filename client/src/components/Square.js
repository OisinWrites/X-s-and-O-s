import React from 'react';
import { Image } from 'cloudinary-react';

const Square = ({ value, onClick }) => {
    return (
      <button className="square" onClick={onClick}>

        {value.symbol && (
            <div className='square-parent'>
                <Image 
                    cloudName="REACT_APP_CLOUDINARY_CLOUD_NAME" 
                    publicId={value.imageId}   
                    width="100" 
                    crop="scale" 
                />
            </div>
            )}
      </button>
    );
};

export default Square;