import '../styles/View.css';
import '../components/VideoPlayer'
import VideoPlayer from '../components/VideoPlayer';
import VideoPlayer2 from '../components/Video';
import React, { useState, useEffect } from 'react';


function View() {
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
          //<VideoPlayer2 src={camera._id} />
        ))}
</body>
    
  );
}

export default View;
