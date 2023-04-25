import React, { useState } from 'react';

import Menu from './Menu';
import Header from './Header';
import Home from './Home';
import Footer from './Footer';
import Cameraadd from './components/cameraadd';
import Cameralist from './components/cameralist';
import Onvif from './components/onvif';
import Login from './components/login';

function App() {
  const [RenderStatus, SetRenderStatus] = useState(<Home/>);

  const SetRender = (str) => {
    if(str === "list")
    {
        SetRenderStatus(<Cameralist/>);
    }
    else if(str === "add") {
        SetRenderStatus(<Cameraadd/>);
    }
        
    else if(str === "del") {
        SetRenderStatus(<Cameraadd/>);
    }
    else if(str === "onvif") {
      SetRenderStatus(<Onvif/>);
  }
    else if(str === "login") {
      SetRenderStatus(<Login/>);
    }
    else{
        SetRenderStatus(<Cameraadd/>);
    }
  }

  return (
    <>
    <Header />
    <Menu setRender={SetRender}/>
    {RenderStatus}
    <Footer />
    </>
  );
}

export default App;