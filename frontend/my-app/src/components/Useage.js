import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

function App() {
  const [cpuData, setCpuData] = useState([]);
  const [memoryData, setMemoryData] = useState([]);
  const [diskData, setDiskData] = useState([]);

  const cpuChartRef = useRef();
  const memoryChartRef = useRef();
  const diskChartRef = useRef();

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/data');
    socket.onopen = () => {
      console.log('Connected to server');
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setCpuData((prevData) => [...prevData, data.cpuUsage]);
      setMemoryData((prevData) => [...prevData, data.memoryUsage]);
      setDiskData((prevData) => [...prevData, data.diskUsage]);
    };

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    const cpuCtx = cpuChartRef.current.getContext('2d');
    const memoryCtx = memoryChartRef.current.getContext('2d');
    //const diskCtx = diskChartRef.current.getContext('2d');

    let cpuChart = null;
    let memoryChart = null;
    let diskChart = null;

    const createCharts = () => {
      cpuChart = new Chart(cpuCtx, {
        type: 'line',
        data: {
          labels: cpuData.map((_, i) => i),
          datasets: [
            {
              label: 'CPU Usage',
              data: cpuData,
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            yAxes: [
              {
                ticks: {
                  beginAtZero: true,
                  max: 100,
                },
              },
            ],
          },
        },
      });

      memoryChart = new Chart(memoryCtx, {
        type: 'line',
        data: {
          labels: memoryData.map((_, i) => i),
          datasets: [
            {
              label: 'Memory Usage',
              data: memoryData,
              borderColor: 'rgba(54, 162, 235, 1)',
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            yAxes: [
              {
                ticks: {
                  beginAtZero: true,
                  max: 100,
                },
              },
            ],
          },
        },
      });

      // diskChart = new Chart(diskCtx, {
      //   type: 'line',
      //   data: {
      //     labels: diskData.map((_, i) => i),
      //     datasets: [
      //       {
      //         label: 'Disk Usage',
      //         data: diskData,
      //         borderColor: 'rgba(255, 206, 86, 1)',
      //         backgroundColor: 'rgba(255, 206, 86, 0.2)',
      //         borderWidth: 1,
      //       },
      //     ],
      //   },
      //   options: {
      //     scales: {
      //       yAxes: [
      //         {
      //           ticks: {
      //             beginAtZero: true,
      //             max: 100,
      //           },
      //         },
      //       ],
      //     },
      //   },
      // });
    };

    const updateCharts = () => {
      cpuChart.data.datasets[0].data = cpuData;
      cpuChart.update();

      memoryChart.data.datasets[0].data = memoryData;
      memoryChart.update();

      diskChart.data.datasets[0].data = diskData;
      diskChart.update();
    };

    createCharts();

    return () => {
      if (cpuChart) {
        cpuChart.destroy();
      }
      if (memoryChart) {
        memoryChart.destroy();
      }
      if (diskChart) {
        diskChart.destroy();
      }
    };
  }, [cpuData, memoryData, diskData]);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <canvas ref={cpuChartRef} style={{ width: '50%', height: '200px' }}></canvas>
      <canvas ref={memoryChartRef} style={{ width: '50%', height: '200px' }}></canvas>
      {/* <canvas ref={diskChartRef} style={{ width: '30%', height: '200px' }}></canvas> */}
    </div>
  );
}

export default App;