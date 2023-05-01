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
    <div>
      <ReactPlayer
        url={src}
        type={type}
        controls={false}
        playing={playing}
        //buffer={{ duration: 5 }} 
        //bufferingProgress={0.5} 
        //onPlay={handlePlay}
        //onPause={handlePause}
        //onBuffer={handleBuffer}
        //onBufferEnd={handleBufferEnd}
      />
    </div>
  );
};

export default VideoPlayer;