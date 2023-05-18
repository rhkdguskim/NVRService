import React, { useEffect, useRef } from 'react';
import BroadwayPlayer from 'broadway/';

const BroadWayPlayers = () => {
    const wsRef = useRef(null);
  
    useEffect(() => {
      // Create WebSocket connection
      const socket = new WebSocket('ws://127.0.0.1/');
      wsRef.current = socket;
  
      // Handle WebSocket events
      socket.onopen = () => {
        console.log('WebSocket connected');
      };
  
      socket.onmessage = (event) => {
        const videoData = event.data;
        // Pass the received video data to the Broadway player for decoding and rendering
        handleVideoData(videoData);
      };
  
      socket.onclose = () => {
        console.log('WebSocket connection closed');
      };
  
      return () => {
        // Clean up the WebSocket connection
        socket.close();
      };
    }, []);
  
    // Function to handle received video data and render it to the canvas
    const handleVideoData = (videoData) => {
      // Decode the video frames using Broadway
      // Instantiate a new Broadway player
      const player = new BroadwayPlayer();
  
      // Pass the video data to the player for decoding
      player.decode(new Uint8Array(videoData));
  
      // Get the decoded video frames
      const frame = player.getCurrentRGBAFrame();
  
      // Render the frame on the canvas
      const canvas = document.getElementById('canvas');
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(frame, 0, 0, canvas.width, canvas.height);
    };
  
    return <canvas id="canvas" />;
  };

  export default BroadWayPlayers;