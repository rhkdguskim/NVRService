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
  const generateLayout = (cols) => {
    let layout = [];
    let rowIndex = 0;
    let colIndex = 0;
  
    for (let i = 0; i < data.length; i++) {
      layout.push({
        i: `${i + 1}`,
        x: colIndex,
        y: rowIndex,
        w: 1,
        h: 1,
      });
  
      colIndex++;
  
      if (colIndex >= cols) {
        colIndex = 0;
        rowIndex++;
      }
    }
  
    return layout;
  };

  const [data, setData] = useState([]);
  const [cols, setCols] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [layout, setLayout] = useState(generateLayout(1));
  const [breakpoints, setBreakpoints] = useState({ lg: 1000 });

  const calculateRowHeight = () => {
    switch (cols) {
      case 1:
        return 800;
      case 2:
        return 400;
      case 3:
        return 300;
      case 4:
        return 200;
      default:
        return 400;
    }
  };

  const updateLayout = (cols) => {
    setCols(cols);
    setLayout(generateLayout(cols));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLayoutChange = (layout) => {
    console.log(layout);
  };

  const handleSizeChange = (i, width, height) => {
    console.log(i, width, height);
  };

  const handleNextButtonClick = () => {
    const totalPages = Math.ceil(data.length / (cols * cols));
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevButtonClick = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
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

  const renderCamera = (camera, index) => {
    const itemsPerPage = cols * cols;
    if (
      index >= (currentPage - 1) * itemsPerPage &&
      index < currentPage * itemsPerPage
    )
    {
      return (

        
        <div key={camera.idx} data-grid={{ w: 1, h: 1, x: 0, y: 0 }} onResizeStop={(e, d, ref, delta, position) => handleSizeChange(camera.idx, ref.clientWidth, ref.clientHeight)} style={{ width: '100%', height: '100%' }} >
                <div
        style={{
          position: 'absolute',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.1)', // Adjust the background opacity here
          color: '#52ff00',
          fontSize: '15px',
          fontWeight: 'bold',
          left: 0,
          right: 0,
          top: 0,
        }}
      >
        LIVE : {camera.camname} : {camera.ip}
      </div>
          <VideoPlayer name = {camera.camname} ip = {camera.ip} src ={camera.protocoltype === 'hls' ? `/camera/hls/${camera.id}` : `/camera/${camera.id}`} type={camera.protocoltype === 'hls' ? 'application/x-mpegURL' : 'video/mp4'} style={{ width: '100%', height: '100%' }} />
        </div>
      );
    };
    return null;
    }


  return (
    <>
    <Button onClick={() => updateLayout(1)}>1x1</Button>
    <Button onClick={() => updateLayout(2)}>2x2</Button>
    <Button onClick={() => updateLayout(3)}>3x3</Button>
    <Button onClick={() => updateLayout(4)}>4x4</Button>
    {/* <Button onClick={handleNextButtonClick}>Next</Button>
    <Button onClick={handlePrevButtonClick}>Prev</Button> */}
<ResponsiveGridLayout
  className="layout"
  breakpoints={breakpoints}
  cols={{ lg: cols }}
  layouts={{ lg: layout }}
  onLayoutChange={handleLayoutChange}
  rowHeight={calculateRowHeight()}
  isDraggable={true}
  isResizable={false}
>
      {data.map((camera, index) => renderCamera(camera, index))}
      </ResponsiveGridLayout>
    </>

    
  );
}

export default View;
