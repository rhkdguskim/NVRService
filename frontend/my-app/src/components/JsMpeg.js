import React, { useRef, useEffect } from 'react';
import JSMpeg from 'jsmpeg';

function JSMpegPlayer({ url, options }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const player = new JSMpeg.Player(url, { canvas, ...options });
    return () => {
      player.destroy();
    };
  }, [url, options]);

  return <canvas ref={canvasRef} />;
}

export default JSMpegPlayer;