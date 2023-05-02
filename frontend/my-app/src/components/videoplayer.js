import React, { useState } from 'react';
import ReactPlayer from 'react-player';

const VideoPlayer = ({ src, type }) => {
  const [playing, setPlaying] = useState(true);
  const [buffering, setBuffering] = useState(false);

  const handlePlay = () => {
    setPlaying(true);
  };

  const handlePause = () => {
    setPlaying(false);
  };

  const handleBuffer = () => {
    console.log("buffer")
    setBuffering(true);
    setPlaying(false);
  };

  const handleBufferEnd = () => {
    console.log("buffer end")
    setBuffering(false);
    setPlaying(true);
  };

  return (
    <div style={{ position: 'relative', width: '10%', height: '30%' }}>
      <ReactPlayer
        url={src}
        type={type}
        controls={false}
        playing={playing}
        title="hihihihi"
        //buffer={{ duration: 5 }} 
        //bufferingProgress={0.5} 
        //onPlay={handlePlay}
        //onPause={handlePause}
        //onBuffer={handleBuffer}
        //onBufferEnd={handleBufferEnd}
      />
        <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,.0)',
          color: '#0ff',
          fontSize: '24px',
        }}
      >
        Live
      </div>
    </div>
  );
};

export default VideoPlayer;