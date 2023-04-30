import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import {Link} from 'react-router-dom';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

const Cameralist = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

async function handleDelClick(params) {
  console.log(params);
  const response = await fetch("/camera/", {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({id:params.id})
  })
  const json = await response.json();
}

async function handleModClick(params) {
  console.log(params.row);
  const response = await fetch("/camera/", {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params.row)
  })
}

  const columns = [
    
    {
      field: 'camname',
      headerName: 'Camera Name',
      width: 150,
      editable: true,
    },
    {
      field: 'ip',
      headerName: 'Camera IP',
      width: 150,
      editable: true,
    },
    {
      field: 'port',
      headerName: 'Camera Port',
      type: 'number',
      width: 150,
      editable: true,
    },
    {
      field: 'username',
      headerName: 'UserId',
      editable: true,
      width: 150,
    },
    {
      field: 'password',
      headerName: 'UserPassword',
      editable: true,
      width: 150,
    },
    {
      field: 'liveprofile',
      headerName: 'Live Profile',
      width: 150,
      renderCell: (params) => {
        return (
          <Select value={params.row.liveprofile}>
            {params.row.profile.map((myfile) => (
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
          <Select value={params.row.protocoltype}>
            <MenuItem value="mp4">MP4</MenuItem>
            <MenuItem value="hls">HLS</MenuItem>
            <MenuItem value="Websocket">WS</MenuItem>
          </Select>
        );
      },
    },
    {
      field: 'mod',
      headerName: '',
      width: 80,
      renderCell: (params) => {
        return (
          <Button component={Link} to="/camera" variant="contained" onClick={() => handleModClick(params)}>
            수정
          </Button>
        );
      },
    },
    {
      field: 'del',
      headerName: '',
      width: 80,
      renderCell: (params) => {
        return (
          <Button component={Link} to="/camera" variant="contained" onClick={() => handleDelClick(params)}>
            삭제
          </Button>
        );
      },
    },
  ];

  async function fetchData() {
    const response = await fetch('/camera/');
    const json = await response.json();
    //setData(json);
    for(let i=0; i<json.length; i++)
    {
      const response2 = await fetch(`/camera/profile/${json[i].id}`);
      const json2 = await response2.json();
      json[i].profile=json2;
    }
    setData(json);
    //const response2 = await fetch('/camera/profile/');
    //const json2 = await response.json();
    console.log(data);
    };

    return (
        <>
      <Box sx={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={data}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 5,
            },
          },
        }}
        pageSizeOptions={[5]}
        checkboxSelection
        disableRowSelectionOnClick
      />
    </Box>
      {/* <Table columns={columns} data={data} Deletefunc={fetchDelData} /> */}
        </>
    )
}

export default Cameralist