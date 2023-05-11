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

  async function fetchData() {
    const response = await fetch('/system/sdisk');
    const json = await response.json();
    console.log(json);
    

    const response2 = await fetch('/system/disk');
    const json2 = await response2.json();
    console.log(json2);

    json.map(item => {
      item._use = "disable";
      json2.map(item2 => {
        if(item.id === item2.id)
        {
          item._use = "enable";
        }
      })
    })

    setData(json);
  }


  async function handleUseageComboChange (event, id) {
    console.log(event.target.value, id);
    const newData = data.map((item) => {
      if (item.id === id) {
        if(event.target.value === 'enable') {
          const response = fetch("/system/disk", {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({id:id})
          })
        }
        else {
            const response = fetch("/system/disk", {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({id:id})
            })
        }
        return { ...item, _use: event.target.value };
      } else {
        return item;
      }
    });
    setData(newData);
  }

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
    {
      field: '_limit',
      headerName: 'limit',
      editable: true,
      width: 150,
      valueFormatter: ({ value }) => `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`,
    },
    {
      field: '_path',
      headerName: 'Path',
      editable: true,
      width: 150,
    },
    {
      field: '_use',
      headerName: 'Useage',
      width: 150,
      renderCell: (params) => {
        return (
          <Select id={params.row.id} value={params.row._use} onChange={(event)  => handleUseageComboChange(event, params.row.id)}>
            <MenuItem key='enable' id = "enable" value="enable">사용</MenuItem>
            <MenuItem key='disable' id = "disable" value="disable">미사용</MenuItem>
          </Select>
        );
      },
    },
  ];
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

export default System