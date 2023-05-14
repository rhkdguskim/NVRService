import React, { useEffect, useRef, useState, forwardRef } from 'react';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
import FastRewindIcon from '@material-ui/icons/FastRewind';
import FastForwardIcon from '@material-ui/icons/FastForward';

import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import ListItemText from '@material-ui/core/ListItemText';
import ListItem from '@material-ui/core/ListItem';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';

import { v4 as uuidv4 } from 'uuid';


function VideoPlayer({ caminfo, callbacks, isvod }) {
  const camera = caminfo;
  const uuid = uuidv4();
  const hostname = window.location.hostname;
  const port = window.location.port;
  const videoCanvasRef = useRef(null);
  const mainVideoCanvasRef = useRef(null);
  const [videoUrl, setvideoUrl] = useState(`ws://${hostname}:${port}/camera/ws/${camera.id}`);
  const [mainVideoUrl, setmainVideoUrl] = useState(`ws://${hostname}:${port}/camera/ws/${camera.id}`);
  const [vod, setVod] = useState(isvod);
  const [pause, setPause] = useState(false);
  const playerRef = useRef(null);
  const mainPlayerRef = useRef(null);
  const [showButtons, setShowButtons] = useState(false);
  const [open, setOpen] = useState(false);

  const handleContextMenu = (event) => {
    event.preventDefault();
  };
  
  const handleonClick = (event) => {
    event.preventDefault();
    callbacks.onClick(event.target.id);
  }

  const handleOpen = (event) => {
    event.preventDefault();
    console.log("open");
    setOpen(true);
  }

  const handleClose = () => {
    setOpen(false);
  };

  const handleMouseOver = (event) => {
    event.preventDefault();
    callbacks.mouseOver(event.target.id);
    setShowButtons(true);
  };

  const handleMouseOut = (event) => {
    event.preventDefault();
    callbacks.mouseOut(event.target.id);
    setShowButtons(false);
  };

  const handlePuase = (event) => {
    event.stopPropagation();
    setPause(!pause);
    // callbacks.onClick(direction);
  };

  const renderTitle = (camera) => {
    return (
      <>
      {!vod && <div
      style={{
        position: 'absolute',
        display: 'flex',
        backgroundColor: 'rgba(0, 0, 0, 0.1)', // Adjust the background opacity here
        color: '#52ff00',
        fontSize: '15px',
        fontWeight: 'bold',
        top: "1%",
        left: "1%",
      }}
      >
      LIVE
    </div>}
    {vod && <div
      style={{
        position: 'absolute',
        display: 'flex',
        backgroundColor: 'rgba(0, 0, 0, 0.1)', // Adjust the background opacity here
        color: '#52ff00',
        fontSize: '15px',
        fontWeight: 'bold',
        top: "1%",
        left: "1%",
      }}
      >
      VOD
    </div>}
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        backgroundColor: 'rgba(0, 0, 0, 0.1)', // Adjust the background opacity here
        color: '#52ff00',
        fontSize: '15px',
        fontWeight: 'bold',
        top: "1%",
        right: "1%",
      }}
      >
      {camera.camname}
      </div>

      <div
      style={{
        position: 'absolute',
        display: 'flex',
        backgroundColor: 'rgba(0, 0, 0, 0.1)', // Adjust the background opacity here
        color: '#52ff00',
        fontSize: '15px',
        fontWeight: 'bold',
        bottom: "1%",
        left: "1%",
      }}
      >
      Stream info
      </div>

      <div
      style={{
        position: 'absolute',
        display: 'flex',
        backgroundColor: 'rgba(0, 0, 0, 0.1)', // Adjust the background opacity here
        color: '#52ff00',
        fontSize: '15px',
        fontWeight: 'bold',
        bottom: "1%",
        right: "1%",
      }}
      >
      Time Stamp
      </div>
    </>
    
    );
  }

  const renderDialog = (open, camera) => {

    return (
      <Dialog fullScreen open={open} onClose={handleClose}>
      <AppBar>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <div
    id={camera.id}
    onMouseOver={handleMouseOver}
    onMouseOut={handleMouseOut}
    onClick={handleonClick}
    onDoubleClick={handleOpen}
    style={{ width: '100%', height: '100%', border: '1px solid black' , display: 'flex' }}
  >
    
    <canvas id={camera.id} ref={mainVideoCanvasRef} style={{ width: '100%', height: '100%' }}/>
      </div>
    </Dialog>
    )
  }

  const renderButtons = () => {
    if (!showButtons) return null;

    return (
      <>
            <div
        style={{
          position: 'absolute',
          bottom: '50%',
          left: '50%',
          transform: 'translate(-50%, 50%)',
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          padding: '10px',
          borderRadius: '50%',
          cursor: 'pointer',
        }}
        onClick={(event) => handlePuase(event, 'south')}
      >
        {pause && <PlayArrowIcon style={{ fontSize: '30px', color: '#fff' }} />}
        {!pause && <PauseIcon style={{ fontSize: '30px', color: '#fff' }} />}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '50%',
          left: '55%',
          transform: 'translate(-50%, 50%)',
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          padding: '10px',
          borderRadius: '50%',
          cursor: 'pointer',
        }}
        onClick={(event) => handlePuase(event, 'south')}
      >
        {<FastForwardIcon style={{ fontSize: '30px', color: '#fff' }} />}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '50%',
          left: '45%',
          transform: 'translate(-50%, 50%)',
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          padding: '10px',
          borderRadius: '50%',
          cursor: 'pointer',
        }}
        onClick={(event) => handlePuase(event, 'south')}
      >
        {<FastRewindIcon style={{ fontSize: '30px', color: '#fff' }} />}
      </div>
      </>


      
    );
  };

  useEffect(() => {
    if (!videoCanvasRef.current) return;
    

    playerRef.current = new window.JSMpeg.Player(videoUrl, {
      canvas: videoCanvasRef.current,
      autoplay: true,
      audio: false,
      isLive: true,
    });

    return () => {
      if (playerRef.current && playerRef.current.isPlaying) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoUrl]);

  useEffect(() => {

    if (!mainVideoCanvasRef.current) return;

    mainPlayerRef.current = new window.JSMpeg.Player(mainVideoUrl, {
      canvas: mainVideoCanvasRef.current,
      autoplay: true,
      audio: false,
      isLive: true,
    });

    return () => {

      if (mainPlayerRef.current && mainPlayerRef.current.isPlaying) {
        mainPlayerRef.current.destroy();
        mainPlayerRef.current = null;
      }
    };
  }, [mainVideoUrl]);

  return (
    <div
      id={camera.id}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      onClick={handleonClick}
      onDoubleClick={handleOpen}
      style={{ width: '100%', height: '100%', border: '1px solid black' , display: 'flex' }}
    >
      {renderTitle(camera)}
      <canvas id={camera.id} ref={videoCanvasRef} style={{ width: '100%', height: '100%' }} onContextMenu={handleContextMenu} />
      {renderButtons()}
      {renderDialog(open, camera)}
    </div>
  );
}

export default VideoPlayer;