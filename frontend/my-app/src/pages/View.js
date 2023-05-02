import '../styles/View.css';
import ReactPlayer from 'react-player';
import VideoPlayer from '../components/VideoPlayer';
import '../styles/VideoGrid.css'
import React, { useState, useEffect } from 'react';


function View() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const response = await fetch('/camera/');
    const json = await response.json();
    setData(json);
    console.log(json);
  }
  return (
<div className="video-grid">
  {data.map((camera) => (
            <div className="video-grid-item" key={camera.id}>
            <h3 className="video-title">{camera.camname}</h3>
            <VideoPlayer src ={camera.protocoltype === 'hls' ? `/camera/hls/${camera.id}` : `/camera/${camera.id}`} type={camera.protocoltype === 'hls' ? 'application/x-mpegURL' : 'video/mp4'} />
            </div>
          ))}
</div>
    
  );
}

export default View;
