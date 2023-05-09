import React, { useRef, useState } from 'react';
import ReactPlayer from 'react-player';

const VideoPlayer = ({ name, ip, src, type }) => {
  const [playing, setPlaying] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const playerRef = useRef(null);

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

  const handleSeekToEnd = () => {
    const duration = playerRef.current.getDuration();
    playerRef.current.seekTo(duration);
    console.log(duration);
  }

  return (
    <>
    
      <ReactPlayer
        url={src}
        type={type}
        controls={false}
        playing={playing}
        lowLatency={true}
        playsinline={true}
        ref={playerRef}
        //buffer={{ duration: 5 }} 
        //bufferingProgress={0.5} 
        onPlay={handleSeekToEnd}
        //onPause={handlePause}
        //onBuffer={handleBuffer}
        //onBufferEnd={handleBufferEnd}
        width="100%"
        height="100%"
      />
    </>
  );
};

export default VideoPlayer;