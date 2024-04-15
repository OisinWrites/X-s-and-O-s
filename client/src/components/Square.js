import React from 'react';
import { Image } from 'cloudinary-react';

const imageIds = {
  X: ["https://res.cloudinary.com/dwhennrjl/image/upload/v1713184800/media/xos/xosx2_fbt8a1.png",
  "https://res.cloudinary.com/dwhennrjl/image/upload/v1713184800/media/xos/xosx1_fiwvj5.png"],
  O: ["https://res.cloudinary.com/dwhennrjl/image/upload/v1713184800/media/xos/xos01_txfaee.png",
  "https://res.cloudinary.com/dwhennrjl/image/upload/v1713184800/media/xos/xos02_qyu2ys.png"]
};

const getRandomImageId = (value) => {
  // Randomly pick an image ID from the corresponding array
  if (value && imageIds[value]) {
    const ids = imageIds[value];
    return ids[Math.floor(Math.random() * ids.length)];
  }
  return null;
};

const Square = ({ value, onClick }) => {
  const imageId = getRandomImageId(value);
    return (
      <button className="square" onClick={onClick}>

        {value && (
            <div className='square-parent'>
                <Image 
                    cloudName="your_cloud_name" 
                    publicId={imageId}   
                    width="100" 
                    crop="scale" 
                />
            </div>
            )}
      </button>
    );
};

export default Square;