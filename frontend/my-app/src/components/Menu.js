import '../styles/Menu.css'
import {Link} from 'react-router-dom';
import React from 'react';
import Button from '@mui/material/Button';
import RMenu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

function Menu() {

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  function handleClose(event) {
    setAnchorEl(null);
  }
  function handleCamClick(event) {
    setAnchorEl(event.currentTarget);
  }

  function handleAddCamClick(event) {
    setAnchorEl(null);
  }

  return (
    <div className='navbar'>
      <Button
        component={Link} to="/"
        color="inherit"
        className="navbar__button"
        id="home"
        aria-controls={open ? 'home-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        Home
      </Button>
      <Button
        component={Link} to="/view"
        color="inherit"
        className="navbar__button"
        id="view"
        aria-controls={open ? 'home-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        View
      </Button>
      <Button
      component={Link} to="/camera"
        color="inherit"
        className="navbar__button"
        id="camera"
        aria-controls={open ? 'camera-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleCamClick}
      >
        Camera
      </Button>
      <Button
      component={Link} to="/onvif"
        color="inherit"
        className="navbar__button"
        id="onvif"
        aria-controls={open ? 'onvif-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        Onvif Discovery
      </Button>
      <RMenu
        id="camera-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'camera-button',
        }}
      >
        <MenuItem component={Link} to="/camera/add" onClick={handleAddCamClick}>Add</MenuItem>
      </RMenu>
    </div>
  );
}

export default Menu;
