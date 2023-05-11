import '../styles/View.css';
import VideoPlayer from '../components/videoplayer';
import '../styles/VideoGrid.css'
import React, { useState, useEffect, useRef } from 'react';
import {Responsive, WidthProvider} from 'react-grid-layout';
import { Grid, Button } from '@mui/material';
import Box from '@mui/material/Box';
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import Cookies from 'js-cookie';
import LinearProgress from '@mui/material/LinearProgress';
import { DatePicker } from '@material-ui/pickers';


const ResponsiveGridLayout = WidthProvider(Responsive);

function View() {
  const generateLayout = () => {
    const itemsPerPage = cols * cols;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, data.length);
    const layout = [];

    for (let i = startIndex; i < endIndex; i++) {
      const x = (i - startIndex) % cols;
      const y = Math.floor((i - startIndex) / cols);

      layout.push({
        w: 1,
        h: 1,
        x: x,
        y: y,
        i: `${i}`,
      });
    }
    console.log("layout setted")
    console.log(layout)
    Cookies.set("Layout", layout, { expires: 1 });
    setLayout(layout);
    return layout;
  };

  const getTotalPages = () => {
    return Math.ceil(data.length / (cols * cols));
  };
  const LayoutCookie = Cookies.get('Layout');
  const ColsCookie = Cookies.get('Cols');
  const CurpageCookie = Cookies.get('Cur');

  const [data, setData] = useState([]);
  const [cols, setCols] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [progress, setProgress] = useState(0);
  const [buffer, setBuffer] = useState(10);

  const [layout, setLayout] = useState([]);

  const progressRef = useRef(() => {});
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  useEffect(() => {
    progressRef.current = () => {
      if (progress > 100) {
        setProgress(0);
        setBuffer(10);
      } else {
        const diff = Math.random() * 10;
        const diff2 = Math.random() * 10;
        setProgress(progress + diff);
        setBuffer(progress + diff + diff2);
      }
    };
  });

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

  const updateLayout = (newCols) => {
    setCols(newCols);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => {
      progressRef.current();
    }, 500);

    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    generateLayout();
  }, [cols, currentPage]);

  useEffect(() => {
    const newTotalPages = Math.ceil(data.length / (cols * cols));
    setTotalPages(newTotalPages);
  }, [data, cols]);

  const handleLayoutChange = (layout) => {
    // setLayout(layout);
    console.log(layout);
  };

  const handleSizeChange = (i, width, height) => {
    //console.log(i, width, height);
  };

  const handlePrevButtonClick = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextButtonClick = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };


  async function fetchData() {
    const response = await fetch('/camera/');
    const json = await response.json();
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
      //console.log(index);
      return (
        
        <div key={index} onResizeStop={(e, d, ref, delta, position) => handleSizeChange(camera.idx, ref.clientWidth, ref.clientHeight)} style={{top: 0, left: 0, width: '100%', height: '100%' }} >
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
        <Box sx={{ top: 0, left: 0, width: '100%', height: '100%' }}>
        <VideoPlayer camid ={camera.id} type={camera.protocoltype} style={{ width: '100%', height: '100%' }} />
        </Box>
        </div>
      );
    };
    return null;
    }


  return (
    <>
    <Grid container spacing={2} sx={{py: 1,}}>
    <Grid item>
     <Button variant="contained" onClick={() => updateLayout(1)}>1x1</Button>
    </Grid>
    <Grid item>
      <Button variant="contained" onClick={() => updateLayout(2)}>2x2</Button>
    </Grid>

    <Grid item>
    <Button variant="contained" onClick={() => updateLayout(3)}>3x3</Button>
      </Grid>
      <Grid item>
      <Button variant="contained"onClick={() => updateLayout(4)}>4x4</Button>
      </Grid>

      <Grid item>
      <Button variant="contained"onClick={handlePrevButtonClick}> Prev </Button>
      </Grid>
      <Grid item>
      <Button variant="contained" onClick={handleNextButtonClick}> Next </Button>
      </Grid>
      <Grid item>
      <Button variant="contained" disabled={true}> {currentPage}/{getTotalPages()} </Button>
      
      </Grid>
    </Grid>
    
    
<ResponsiveGridLayout
  className="layout"
  breakpoints={{ lg: 1000 }}
  cols={{ lg: cols }}
  layouts={{ lg: layout }}
  onLayoutChange={handleLayoutChange}
  rowHeight={calculateRowHeight()}
  isDraggable={true}
  isResizable={false}
  maxRows={cols}
>
      {data.map((camera, index) => renderCamera(camera, index))}
      </ResponsiveGridLayout>

      <Box sx={{ width: '100%' }}>
      <LinearProgress variant="determinate" value={progress} />
    </Box>
    </>
    

    
  );
}

export default View;
