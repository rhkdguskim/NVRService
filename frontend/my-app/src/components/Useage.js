import React, { useState, useEffect } from 'react';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

function App() {
  const [cpuData, setCpuData] = useState(0);
  const [memoryData, setMemoryData] = useState(0);
  const [diskData, setDiskData] = useState(0);
  const [networkData, setnetworkData] = useState(0);


  const hostname = window.location.hostname;
  const port = window.location.port;

  useEffect(() => {
    const socket = new WebSocket(`ws://${hostname}:${port}/system/data`);
    socket.onopen = () => {
      console.log('Connected to server');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setCpuData(data.cpu);
      setMemoryData(data.memory);
      setDiskData(data.disk);
      setnetworkData(data.network);
    };

    return () => {
      socket.close();
    };
  }, []);


    return (
      <>
      <div style={{ display: 'flex', alignItems: 'center' }}>

  <div style={{ display: 'flex', marginRight: '16px' }}>
    <div style={{ marginRight: '16px' }}>
      <h3>CPU</h3>
      <CircularProgressbar value={cpuData} text={`${cpuData}%`} />
    </div>

    <div style={{ marginRight: '16px' }}>
    <h3>Memory</h3>
      <CircularProgressbar value={memoryData} text={`${memoryData}%`} />
    </div>

    <div style={{ marginRight: '16px' }}>
    <h3>Disk</h3>
      <CircularProgressbar value={diskData} text={`${diskData}%`} />
    </div>

    <div style={{ marginRight: '16px' }}>
    <h3>Network</h3>
      <CircularProgressbar value={networkData} text={`${networkData}%`} />
    </div>
  </div>
</div>
      </>
      
    );
  }

export default App;