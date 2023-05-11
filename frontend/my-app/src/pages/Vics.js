import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import {Link} from 'react-router-dom';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

const Vics = () => {
  const [data, setData] = useState([]);


  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    
    {
      field: 'strName',
      headerName: 'Camera Name',
      width: 150,
      editable: true,
    },
    {
      field: 'strIP',
      headerName: 'Camera IP',
      width: 150,
      editable: true,
    },
    {
      field: 'strPort',
      headerName: 'Camera PORT',
      width: 150,
      editable: true,
    },
    {
      field: 'strUser',
      headerName: 'Username',
      editable: true,
      width: 150,
    },
    {
      field: 'strPasswd',
      headerName: 'Password',
      editable: true,
      width: 150,
    },
  ];
  
  async function fetchData() {
    const response = await fetch('camera/vics/110.110.10.80');
    const json = await response.json();
    console.log(json.cVidCamera);
    json.cVidCamera.map(item => {
      item.id = item.strId;
    })
      setData(json.cVidCamera);
    }

    return (
        <>
    <Box sx={{ height: 800, width: '100%' }}>
      <DataGrid
        rows={data}
        columns={columns}
        checkboxSelection={false}
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

        </>
    )
}

export default Vics