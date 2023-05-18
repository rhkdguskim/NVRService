import React, { useEffect, useRef } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const VideoRenderer = () => {
  const canvasRef = useRef(null);
  const ffmpegRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    const setupFFmpeg = async () => {
      const ffmpeg = createFFmpeg({ log: true });
      await ffmpeg.load();

      ffmpegRef.current = ffmpeg;
    };

    const setupWebSocket = () => {
      const ws = new WebSocket('ws://127.0.0.1:8000/play/');

      ws.onopen = () => {
        console.log('WebSocket connection established.');
      };

      ws.onmessage = (event) => {
        const data = event.data;
        const ffmpeg = ffmpegRef.current;

        // FFmpeg로 전송하기 전에 데이터를 가공할 수 있음

        // FFmpeg 처리
        ffmpeg.FS('writeFile', 'input.mp4', new Uint8Array(data));
        ffmpeg.run('-i', 'input.mp4', '-f', 'image2pipe', '-pix_fmt', 'rgba', '-vcodec', 'png', 'output.png');

        const outputData = ffmpeg.FS('readFile', 'output.png');
        const outputUrl = URL.createObjectURL(new Blob([outputData.buffer], { type: 'image/png' }));

        // Canvas에 영상 랜더링
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const image = new Image();

        image.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        };

        image.src = outputUrl;
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed.');
      };

      wsRef.current = ws;
    };

    setupFFmpeg();
    setupWebSocket();

    return () => {
      wsRef.current.close();
    };
  }, []);

  return <canvas ref={canvasRef} />;
};

export default VideoRenderer;