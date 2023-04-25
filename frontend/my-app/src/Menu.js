import './Menu.css';

import React from 'react';

function Menu({setRender}) {

  function handlelistClick(event) {
    event.preventDefault();
    setRender("list");
  }

  function handleAddClick(event) {
    event.preventDefault();
    setRender("add");
  }

  function handleDelClick(event) {
    event.preventDefault();
    setRender("del");
  }

  function handleModClick(event) {
    event.preventDefault();
    setRender("mod");
  }

  function handleOnvifClick(event) {
    event.preventDefault();
    setRender("onvif");
  }

  function handleLoginClick(event) {
    event.preventDefault();
    setRender("login");
  }

  return (
<ul class="menu">
  <li><a href="/">Home</a></li>
  <li>
    <a onClick={handlelistClick} href="/camera">Camera</a>
    <ul class="submenu">
      <li><a onClick={handleAddClick} href="/camera/">add</a></li>
    </ul>
  </li>
  <li><a onClick={handleOnvifClick} href="/onvif">Onvif Discovery</a></li>
  <li><a onClick={handleLoginClick} href="/login">Login</a></li>
</ul>
    
  );
}

export default Menu;
