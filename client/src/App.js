import React from 'react';
import Game from './Game'; // Import the Game component
import './App.css'; // Import CSS styles if needed

function App() {
  return (
    <div className="App">
      <Game />
      <div className='credit'>
        <a className='portfolio-link midnight-green-font' 
          href="https://www.oisinbanville.com/portfolio"  
          target="_blank" 
          rel="noopener noreferrer"
          title="Visit Oisín's Portfolio Site" >www.oisinbanville.com</a>
      </div>
    </div>
  );
}

export default App;
