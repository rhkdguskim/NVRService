import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import {Link} from 'react-router-dom';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

const Onvif = ({user}) => {
  const [data, setData] = useState([]);
  const [networklist, setnetworklist] = useState([]);

  async function handleAddClick(params) {
    console.log(params);

    // const camera = data.filter(data =>data.address === ip);
    const addcam = {
      camname:"New Cam",
    ip:params.row.address, 
    port:params.row.port, 
    username:user.onvifid, 
    password:user.onvifpwd,
  }
    const response = await fetch("/camera/", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(addcam)
    })
    const json = await response.json();
  }

  useEffect(() => {
    fetchData();
    fetchNetworklist();
  },[]);

  const columns = [
    
    {
      field: 'address',
      headerName: 'Camera IP',
      width: 150,
      editable: true,
    },
    {
      field: 'port',
      headerName: 'Camera PORT',
      width: 150,
      editable: true,
    },
    {
      field: 'name',
      headerName: 'Camera Name',
      width: 150,
      editable: true,
    },
    {
      field: 'hardware',
      headerName: 'Hardware',
      editable: true,
      width: 150,
    },
    {
      field: 'liveprofile',
      headerName: 'Live Profile',
      width: 150,
      renderCell: (params) => {
        return (
          <Select value="profile">
            {params.row.profile !== null && params.row.profile.map((myfile) => (
              <MenuItem value={myfile.name}>{myfile.name}</MenuItem>
           ))}
          </Select>
        );
      },
    },
    {
      field: 'protocoltype',
      headerName: 'Protocol Type',
      width: 150,
      renderCell: (params) => {
        return (
          <Select value="mp4">
            <MenuItem value="mp4">MP4</MenuItem>
            <MenuItem value="hls">HLS</MenuItem>
            <MenuItem value="Websocket">WS</MenuItem>
          </Select>
        );
      },
    },
    {
      field: 'del',
      headerName: '',
      width: 80,
      renderCell: (params) => {
        return (
          <Button component={Link} to="/onvif" variant="contained" onClick={() => handleAddClick(params)}>
            추가
          </Button>
        );
      },
    },
  ];

  const handleChangeSelect = (e) =>
  {
    //console.log(e.target.value)
    fetchOnvif(e.target.value);
  }
  async function fetchData() {
    const response = await fetch('/onvif/');
    const json = await response.json();
    
    // console.log(json);
    
    for(let i=0; i<json.length; i++)
    {
      const camera = {
        ip:json[i].address, port:json[i].port
     }

     const response2 = await fetch("/camera/profile", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(camera)
    })
    const json2 = await response2.json();
    if(json2.Isonline)
      json[i].profile=json2;
    else
      json[i].profile=null;
    }
    console.log(json);
    setData(json);
  }
  

  async function fetchNetworklist() {
    const response = await fetch('/onvif/networklist');
    const json = await response.json();
    setnetworklist(json);
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
  };

    return (
        <>
            <Box sx={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={data}
        columns={columns}
        checkboxSelection={true}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 10,
            },
          },
        }}
        pageSizeOptions={[5]}
      />
    </Box>
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