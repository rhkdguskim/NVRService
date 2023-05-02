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

const ResponsiveGridLayout = WidthProvider(Responsive);

function View() {
  const [data, setData] = useState([]);
  const [cols, setCols] = useState(4);
  const [breakpoints, setbreakpoints] = useState(1200);

  const changelayout = (num) => {
    setCols(num);
    switch(num)
    {
      case 4:
        setbreakpoints(1200)
        break;
      case 3:
        setbreakpoints(996)
        break;
      case 2:
        setbreakpoints(768)
        break;
      case 1:
        setbreakpoints(480)
        break;
    }
    
  }
  const layout = [
    { i: "1", x: 0, y: 0, w: 1, h: 1 },
    { i: "2", x: 1, y: 0, w: 1, h: 1 },
    { i: "3", x: 2, y: 0, w: 1, h: 1 },
    { i: "4", x: 3, y: 0, w: 1, h: 1 },
    { i: "5", x: 0, y: 1, w: 1, h: 1 },
    { i: "6", x: 1, y: 1, w: 1, h: 1 },
    { i: "7", x: 2, y: 1, w: 1, h: 1 },
    { i: "8", x: 3, y: 1, w: 1, h: 1 },
    { i: "9", x: 0, y: 2, w: 1, h: 1 },
    { i: "10", x: 1, y: 2, w: 1, h: 1 },
    { i: "11", x: 2, y: 2, w: 1, h: 1 },
    { i: "12", x: 3, y: 2, w: 1, h: 1 }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const onLayoutChange = (layout) => {
    // 그리드 레이아웃 변경시 호출되는 콜백 함수
    console.log(layout);
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
  return (
    <>
    <Button onClick={() => changelayout(4)}>4x4</Button>
      <Button onClick={() => changelayout(3)}>3x3</Button>
      <Button onClick={() => changelayout(2)}>2x2</Button>
      <Button onClick={() => changelayout(1)}>1x1</Button>
    
<ResponsiveGridLayout
  className="layout"
  layouts={{ md: layout }}
  breakpoints={{ lg: 800, md: 996, sm: 768, xs: 480, xxs: 0 }}
  cols={{ lg: 3, md: 3, sm: 2, xs: 1, xxs: 1 }}
  rowHeight={350}
  
  isDraggable={true}
  isResizable={true}
>
     {data.map((camera) => (
            <div key={Number(camera.idx)} className="video-grid-item" >
            <VideoPlayer src ={camera.protocoltype === 'hls' ? `/camera/hls/${camera.id}` : `/camera/${camera.id}`} type={camera.protocoltype === 'hls' ? 'application/x-mpegURL' : 'video/mp4'} />
            </div>
      ))}
      </ResponsiveGridLayout>
    </>

    
  );
}

export default View;
