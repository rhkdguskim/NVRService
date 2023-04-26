import './Menu.css';

import React from 'react';

function Menu({isLoggedIn, setRender}) {

  function handlelistClick(event) {
    event.preventDefault();
    setRender("list");
  }

  function handleAddClick(event) {
    event.preventDefault();
    setRender("add");
  }

  function handleRegClick(event) {
    event.preventDefault();
    setRender("reg");
  }

  function handleOnvifClick(event) {
    event.preventDefault();
    setRender("onvif");
  }

  function handleLoginClick(event) {
    event.preventDefault();
    setRender("login");
  }

  async function handleLogoutClick(event) {
    event.preventDefault();
    const response = await fetch("/user/logout", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify()
    })
    setRender("logout");
  }

  return (
<ul class="menu">
  <li><a href="/">Home</a></li>
  { isLoggedIn && 
  <li> <a onClick={handlelistClick} href="/camera">Camera</a>
    <ul class="submenu">
      <li><a onClick={handleAddClick} href="/camera/">add</a></li>
    </ul>
  </li>
  }
  { isLoggedIn && <li><a onClick={handleOnvifClick} href="/onvif">Onvif Discovery</a></li> }
  { !isLoggedIn && <li><a onClick={handleLoginClick} href="/user/login">Login</a>
  <ul class="submenu">
      <li><a onClick={handleRegClick} href="login/register">Register</a></li>
    </ul>
    </li>
  }
  {isLoggedIn && <li><a onClick={handleLogoutClick} href="/user/logout">Logout</a></li>}
</ul>
    
  );
}

export default Menu;
