import React, { useState, useEffect } from 'react';
import Table from './onviftable';

const Onvif = () => {
  const [data, setData] = useState([]);
  const [networklist, setnetworklist] = useState([]);
  useEffect(() => {
    fetchData();
    fetchNetworklist();
  }, []);

  const columns = ['DeviceName', 'IP', 'PORT'];

  const handleChangeSelect = (e) =>
  {
    console.log(e.target.value)
    fetchOnvif(e.target.value);
  }

  async function fetchData() {
    const response = await fetch('/onvif/');
    const json = await response.json();
    setData(json);
  }

  async function fetchNetworklist() {
    const response = await fetch('/onvif/networklist');
    const json = await response.json();
    setnetworklist(json);
    console.log(json);
  }

  async function fetchOnvif(data) {
    const response = await fetch("/onvif/", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({eth:data, timeout:5000})
    })
    const json = await response.json();
    console.log(json);
  };

    return (
        <>
      <h1>Onvif 검색 리스트</h1>
      <Table columns={columns} data={data} />
      <br></br>
      <select onChange={handleChangeSelect}>
      {networklist.map((network) => (
          <option key={network.name} value={network.name}>{network.name}</option>
        ))}
      </select>
      <button onClick={fetchData}>Refresh</button>
        </>
    )
}

export default Onvif