import React, { useState, useEffect } from 'react';
import Table from './onviftable';

const Onvif = () => {
  const [data, setData] = useState([]);
  const [networklist, setnetworklist] = useState([]);

  const [onvif, setonvif] = useState([]);
  useEffect(() => {
    fetchUser();
    fetchData();
    fetchNetworklist();
  },[]);

  const columns = ['Address', 'IP', 'HaredWare', 'Name'];

  const handleChangeSelect = (e) =>
  {
    //console.log(e.target.value)
    fetchOnvif(e.target.value);
  }

  async function addCamera (ip) {
    const camera = data.filter(data =>data.address === ip);
    const addcam = {camname:"New Cam", ip:camera[0].address, port:camera[0].port, username:onvif.onvifid, password:onvif.onvifpwd}
    const response = await fetch("/camera/", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(addcam)
    })
    const json = await response.json();
    
  }

  async function fetchData() {
    const response = await fetch('/onvif/');
    const json = await response.json();
    console.log(json);
    setData(json);
    
    //console.log(data.filter(data =>data.address === "192.168.219.104"))
  }

  async function fetchUser() {
    const response = await fetch('/onvif/user');
    const json = await response.json();
    setonvif(json);
    console.log(json);
    //console.log(data.filter(data =>data.address === "192.168.219.104"))
  }

  async function fetchNetworklist() {
    const response = await fetch('/onvif/networklist');
    const json = await response.json();
    setnetworklist(json);
    //console.log(json);
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
    //console.log(json);
  };

    return (
        <>
      <h1>Onvif 검색 리스트</h1>
      <Table columns={columns} data={data} addCamera={addCamera} />
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