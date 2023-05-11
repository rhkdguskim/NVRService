import React, { useEffect, useRef } from 'react';

function VideoPlayer({ setprogress, videoUrl, camid }) {
  const videoCanvasRef = useRef(null);
  
  const playerRef = useRef(null);

  const handleContextMenu = (event) => {
    event.preventDefault();
  };

  function handleDoubleClick(event) {
    // 더블 클릭 시에 호출될 함수
    console.log(event.target.id);
    const hostname = window.location.hostname;
    const port = window.location.port;
    console.log('Canvas double clicked!');

    // 새로운 팝업 창 띄우기
    window.open(`http://${hostname}:${port}/camera/capture/${event.target.id}`, 'popup', 'width=1980,height=1080');
  }

  
  function handleonClick(event) {
    const currentTime = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999); // Set end of day to 23:59:59.999
      const remainingTime = endOfDay.getTime() - currentTime.getTime();
      const totalDuration = 24 * 60 * 60 * 1000; // Total duration in milliseconds (24 hours)
      const progress = ((totalDuration - remainingTime) / totalDuration) * 100;
    setprogress(progress);
  }

  function handleMouseMove(event) {
    //console.log(videoCanvasRef.current);
    const context = videoCanvasRef.current.getContext('2d');
    if (!context) {
      //console.log(context);
      //console.log('context is not ready');
      return;
    }
    context.clearRect(0, 0, videoCanvasRef.current.width, videoCanvasRef.current.height);
    const mouseX = event.clientX - videoCanvasRef.current.getBoundingClientRect().x;
    const mouseY = event.clientY - videoCanvasRef.current.getBoundingClientRect().y;
    context.beginPath();
    context.moveTo(mouseX, 0);
    context.lineTo(mouseX, videoCanvasRef.current.height);
    context.moveTo(0, mouseY);
    context.lineTo(videoCanvasRef.current.width, mouseY);
    context.strokeStyle = 'red';
    context.stroke();
  }

  useEffect(() => {
    if (!videoCanvasRef.current) return;

    playerRef.current = new window.JSMpeg.Player(videoUrl, { 
      canvas: videoCanvasRef.current,
      autoplay: true,
      audio: false,
      isLive : true,
    });

    if (videoCanvasRef.current) {
      videoCanvasRef.current.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (playerRef.current && playerRef.current.isPlaying) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      if (videoCanvasRef.current) {
        videoCanvasRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [videoUrl]);

  return <div style={{ width: '100%', height: '100%', border: '1px solid black'} }>
    <canvas id={camid} ref={videoCanvasRef} style={{ width: '100%', height: '100%' }} onContextMenu={handleContextMenu} onDoubleClick={handleDoubleClick} onMouseMove={handleMouseMove} onClick={handleonClick}/>
    </div>
}

export default VideoPlayer;