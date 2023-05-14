import React, { useEffect, useRef, useState } from 'react';
//import ReactPlayer from 'react-player';
import JsmpegPlayer from '../components/JsmpegPlayer';

const VideoPlayer = ({caminfo, src, callbacks, isvod}) => {

  useEffect(() => {
  }, []);

  return (
    <><JsmpegPlayer videoUrl={src} caminfo={caminfo} callbacks={callbacks} isvod={isvod}/>
      
    </>
  );
};

export default VideoPlayer;