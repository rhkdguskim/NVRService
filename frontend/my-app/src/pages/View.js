import '../styles/View.css';
import ReactPlayer from 'react-player';
import VideoPlayer from '../components/VideoPlayer';
import '../styles/VideoGrid.css'
import React, { useState, useEffect } from 'react';
import {GridLayout, Responsive, WidthProvider} from 'react-grid-layout';
import Button from '@mui/material/Button';
import {Link} from 'react-router-dom';
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import Navigation from '../components/Navigation'

const ResponsiveGridLayout = WidthProvider(Responsive);

function View() {
  const [data, setData] = useState([]);
  const [cols, setCols] = useState(3);
  const [breakpoints, setBreakpoints] = useState({ lg: 1000 });

  const layout = [
    { i: '1', x: 0, y: 0, w: 1, h: 1 },
    { i: '2', x: 1, y: 0, w: 1, h: 1 },
    { i: '3', x: 2, y: 0, w: 1, h: 1 },
    { i: '4', x: 0, y: 1, w: 1, h: 1 },
    { i: '5', x: 1, y: 1, w: 1, h: 1 },
    { i: '6', x: 2, y: 1, w: 1, h: 1 },
    { i: '7', x: 0, y: 2, w: 1, h: 1 },
    { i: '8', x: 1, y: 2, w: 1, h: 1 },
    { i: '9', x: 2, y: 2, w: 1, h: 1 },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const handleLayoutChange = (layout) => {
    console.log(layout);
  };

  const handleSizeChange = (i, width, height) => {
    console.log(i, width, height);
  };


  async function fetchData() {
    const response = await fetch('/camera/');
    const json = await response.json();

    for (let i = 0; i < json.length; i++) {
      json[i].idx = i; // id 속성 추가
    }
    console.log(json);
    setData(json);
  }

  const renderCamera = (camera) => {
    return (
      <div key={camera.idx} data-grid={{ w: 1, h: 1, x: 0, y: 0 }} onResizeStop={(e, d, ref, delta, position) => handleSizeChange(camera.idx, ref.clientWidth, ref.clientHeight)}>
        <VideoPlayer name = {camera.camname} ip = {camera.ip} src ={camera.protocoltype === 'hls' ? `/camera/hls/${camera.id}` : `/camera/${camera.id}`} type={camera.protocoltype === 'hls' ? 'application/x-mpegURL' : 'video/mp4'} />
      </div>
    );
  };

  return (
    <>
    
<ResponsiveGridLayout
    className="layout"
    breakpoints={breakpoints}
    cols={{ lg: cols }}
    layouts={{ lg: layout }}
    onLayoutChange={handleLayoutChange}
    rowHeight={400}
    isDraggable={true}
    isResizable={false}
>
      {data.map((camera) => renderCamera(camera))}
      </ResponsiveGridLayout>
    </>

    
  );
}

export default View;
