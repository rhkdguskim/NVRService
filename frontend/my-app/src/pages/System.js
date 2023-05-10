import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import {Link} from 'react-router-dom';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

const System = ({user}) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    
    {
      field: '_filesystem',
      headerName: 'Filesystem',
      width: 150,
      editable: false,
    },
    {
      field: '_blocks',
      headerName: 'Blocks',
      width: 150,
      editable: false,
      valueFormatter: ({ value }) => `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`,
    },
    {
      field: '_used',
      headerName: 'Used',
      width: 150,
      editable: false,
      valueFormatter: ({ value }) => `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`,
    },
    {
      field: '_available',
      headerName: 'Available',
      editable: false,
      width: 150,
      valueFormatter: ({ value }) => `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`,
    },
    {
      field: '_capacity',
      headerName: 'Capacity',
      editable: false,
      width: 150,
    },
    {
      field: '_mounted',
      headerName: 'Mounted',
      editable: false,
      width: 150,
    },
  ];

  async function fetchData() {
    const response = await fetch('/system/sdisk');
    const json = await response.json();
    setData(json);
  }

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
    </>
    )
}

export default System