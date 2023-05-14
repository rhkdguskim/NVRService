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
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  textField: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    width: 200,
  },
}));


const ResponsiveGridLayout = WidthProvider(Responsive);

function View() {
  const classes = useStyles();
  const getToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDateStyles = (date) => {
    const targetDate = new Date('2023-05-10'); // 특정 날짜
    const formattedTargetDate = targetDate.toISOString().split('T')[0];

    if (date === formattedTargetDate) {
      return {
        backgroundColor: 'yellow',
        // 다른 스타일 속성 추가 가능
      };
    }

    return {};
  };

  const hostname = window.location.hostname;
  const port = window.location.port;
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
  const [layout, setLayout] = useState([]);
  const [selectedcam, setSelectedCam] = useState("");

  const progressRef = useRef(() => {});

  const handleProgressClick = (event) => {
    const progressBarWidth = event.currentTarget.clientWidth;
    const clickPosition = event.clientX - event.currentTarget.getBoundingClientRect().left;
    const percentage = (clickPosition / progressBarWidth) * 100;
    setProgress(percentage);
  }

  const videoMouseOver = (id) => {
    //console.log("Mouse Over",id);
  }

  const videoMouseOut = (id) => {
    //console.log("Mouse Out",id);
  }

  const videoOnClick = (id) => {
    console.log("Mouse Click",id);
    setSelectedCam(id);
    fetchRecDay(id);
  }

  const callbacks = {onClick:videoOnClick, mouseOver:videoMouseOver, mouseOut:videoMouseOut  };


  const calculateRowHeight = () => {
    switch (cols) {
      case 1:
        return 1000;
      case 2:
        return 600;
      case 3:
        return 400;
      case 4:
        return 300;
      default:
        return 480;
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

  const vodAll = () => {

  }

  const liveAll = () => {

  }


  async function fetchData() {
    const response = await fetch('/camera/');
    const json = await response.json();
    console.log(json);
    setData(json);
  }

  async function fetchRecDay(id, year, month, day) {
    const body = {
      id:id,
      year:year,
      month:month,
      day:day,
    }
    const response = await fetch('/playback/rec', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const json = await response.json();
  }

  async function fetchRecMonth(id, year, month) {
    const body = {
      id:id,
      year:year,
      month:month,
    }
    const response = await fetch('/playback/rec', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const json = await response.json();
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
        
        <div id={camera.id} onClick={(event) => console.log(event.target.id)} key={index} onResizeStop={(e, d, ref, delta, position) => handleSizeChange(camera.idx, ref.clientWidth, ref.clientHeight)} style={{top: 0, left: 0, width: '100%', height: '100%' } } >
        <Box sx={{ top: 0, left: 0, width: '100%', height: '100%' }}>
        <VideoPlayer callbacks = {callbacks} caminfo ={camera} isvod={false} src={`ws://${hostname}:${port}/camera/ws/${camera.id}`} style={{ width: '100%', height: '100%' } } />
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

      <Grid item>
     <Button variant="contained" onClick={() => updateLayout(1)}>VOD ALL</Button>
    </Grid>
    <Grid item>
      <Button variant="contained" onClick={() => liveAll}>LIVE ALL</Button>
    </Grid>

    <Grid item>

    <form className={classes.container} noValidate>
      <TextField
        id="date"
        label="VOD"
        type="date"
        defaultValue={getToday()}
        className={classes.textField}
        InputLabelProps={{
          shrink: true,
        }}
        InputProps={{
          style: getDateStyles(getToday()), // 현재 날짜에 스타일 적용
        }}
      />
    </form>

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
    
    </>
    

    
  );
}

export default View;
