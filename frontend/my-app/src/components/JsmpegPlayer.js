import React, { useEffect, useRef } from 'react';

function VideoPlayer({ videoUrl }) {
  const videoCanvasRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!videoCanvasRef.current) return;

    playerRef.current = new window.JSMpeg.Player(videoUrl, { canvas: videoCanvasRef.current });

    return () => {
      if (playerRef.current && playerRef.current.isPlaying) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoUrl]);

  return <canvas ref={videoCanvasRef} style={{ width: '100%', height: '100%' }} />;
}

export default VideoPlayer;