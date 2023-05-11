import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import JsmpegPlayer from '../components/JsmpegPlayer';

const VideoPlayer = ({setprogress, camid, type }) => {
  const [playing, setPlaying] = useState(true);
  const [streamType, SetStreamType] = useState('mp4');
  const [streamSrc, SetStreamSrc] = useState('');
  const [buffering, setBuffering] = useState(false);
  const playerRef = useRef(null);
  const hostname = window.location.hostname;
  const port = window.location.port;
  let jsmpegPlayer = null;

  useEffect(() => {
    switch(type)
    {
      case "mp4":
        SetStreamType('video/mp4');
        SetStreamSrc(`/camera/${camid}`)
        break;
      case "hls":
        SetStreamType('application/x-mpegURL');
        SetStreamSrc(`/${camid}/play.m3u8`)
        break;
      case "mjpeg":
        SetStreamType('video/mp2t');
        SetStreamSrc(`ws://${hostname}:${port}/camera/ws/${camid}`)
        break;
    }
  }, []);



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
    {type === 'mjpeg' ? 
        <JsmpegPlayer
          setprogress = {setprogress}
          videoUrl={`ws://${hostname}:${port}/camera/ws/${camid}`}
          camid={camid}
        />
         : 
        <ReactPlayer
        url={streamSrc}
        type={streamType}
        controls={false}
        playing={playing}
        lowLatency={true}
        playsinline={true}
        ref={playerRef}
        //buffer={{ duration: 5 }} 
        //bufferingProgress={0.5} 
        //onPlay={handleSeekToEnd}
        //onPause={handlePause}
        //onBuffer={handleBuffer}
        //onBufferEnd={handleBufferEnd}
        width="100%"
        height="100%"
      />}
      
    </>
  );
};

export default VideoPlayer;