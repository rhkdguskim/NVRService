import React, { useRef, useEffect } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import ws from "ws";

const StreamPlayer = () => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      const wsUrl = "ws://localhost:8080"; // 웹소켓 주소
      const videoJsOptions = {
        autoplay: true,
        controls: true,
        fluid: true,
        muted: true,
        sources: [
          {
            src: window.URL.createObjectURL(new Blob()),
            type: "video/mp4",
          },
        ],
      };

      playerRef.current = videojs(videoRef.current, videoJsOptions);

      const wsClient = new ws(wsUrl);

      wsClient.onopen = () => {
        console.log("WebSocket Client Connected");
      };

      wsClient.onmessage = (e) => {
        const reader = new FileReader();
        reader.addEventListener("loadend", () => {
          if (playerRef.current) {
            const videoBlob = new Blob([reader.result]);
            playerRef.current.src({
              src: window.URL.createObjectURL(videoBlob),
              type: "video/mp4",
            });
          }
        });
        reader.readAsArrayBuffer(e.data);
      };
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, []);

  return (
    <div data-vjs-player>
      <video ref={videoRef} className="video-js vjs-16-9" />
    </div>
  );
};

export default StreamPlayer;