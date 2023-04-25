import './Home.css';
import './components/videoplayer'
import VideoPlayer from './components/videoplayer';
import React, { useState, useEffect } from 'react';


function Home() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const response = await fetch('/camera/');
    const json = await response.json();
    setData(json);
    console.log(json);
  }
  return (
<body>
  
{data.map((camera) => (
          <VideoPlayer videoId={camera._id}/>
        ))}
</body>
    
  );
}

export default Home;
