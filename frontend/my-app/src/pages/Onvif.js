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
  const [network, setnetwork] = useState('None');

  async function handleAddClick(params) {
    console.log(params);

    // const camera = data.filter(data =>data.address === ip);
    const addcam = {
      camname:params.row.name,
    ip:params.row.address, 
    port:params.row.port, 
    username:user.onvifid, 
    password:user.onvifpwd,
    protocoltype:params.row.protocoltype,
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

  async function handleProtocolComboChange (event, id) {
    const newData = data.map((item) => {
      if (item.id === id) {
        return { ...item, protocoltype: event.target.value };
      } else {
        return item;
      }
    });
    setData(newData);
  }

  useEffect(() => {
    fetchData();
    fetchNetworklist();
  }, []);

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
      field: 'protocoltype',
      headerName: 'Protocol Type',
      width: 150,
      renderCell: (params) => {
        return (
          <Select value={params.row.protocoltype || "mp4"} onChange={(event)  => handleProtocolComboChange(event, params.row.id)}>
            <MenuItem value="mp4">MP4</MenuItem>
            <MenuItem value="hls">HLS</MenuItem>
            <MenuItem value="mjpeg">MJPEG</MenuItem>
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
    setnetwork(e.target.value);
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
    setnetwork(json[0].name || "None");
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
            <Box sx={{ height: 800, width: '100%' }}>
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

      <Select value={network} onChange={handleChangeSelect}>
        {networklist.map((network) => (
          <MenuItem key={network.name} value={network.name}>{network.name}</MenuItem>
        ))}
      </Select>
      <Button variant="contained" onClick={fetchData}>
            재탐색
      </Button>
        </>
    )
}

export default Onvif