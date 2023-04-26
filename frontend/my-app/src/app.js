import React, { useState, useEffect } from 'react';

import Menu from './Menu';
import Header from './Header';
import Home from './Home';
import Footer from './Footer';
import Cameraadd from './components/cameraadd';
import Cameralist from './components/cameralist';
import Onvif from './components/onvif';
import Login from './components/login';
import Register from './components/register';

function App() {
  const [RenderStatus, SetRenderStatus] = useState(<Home/>);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetchLogined();
  },);

  async function fetchLogined() {
    const response = await fetch('/user/');
    const json = await response.json();
    setIsLoggedIn(json.islogined)
  }
  
  const handleLogin = (login) => {
    console.log(login);
    setIsLoggedIn(login);
  };


  const SetRender = (str) => {
    switch(str)
    {
      case "list":
        SetRenderStatus(<Cameralist/>);
        break;
      case "add":
        SetRenderStatus(<Cameraadd/>);
        break;
      case "onvif":
        SetRenderStatus(<Onvif/>);
      break;
      case "login":
        if(!isLoggedIn)
          SetRenderStatus(<Login isLoggedIn={isLoggedIn}/>);
      break;
      case "reg":
        SetRenderStatus(<Register/>);
      break;
    }
  }

  return (
    <>
    <Header />
    <Menu isLoggedIn= {isLoggedIn} setRender={SetRender}/>
    {RenderStatus}
    <Footer />
    </>
  );
}

export default App;