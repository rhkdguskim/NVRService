import React, { useState, useEffect } from 'react';
import Table from './cameratable';

const Cameralist = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const columns = ['카메라이름', 'IP', 'PORT'];

  async function fetchData() {
    const response = await fetch('/camera/');
    const json = await response.json();
    setData(json);
  }

  async function fetchDelData(e) {
      const response = await fetch("/camera/", {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({id:e.target.id})
      })
      const json = await response.json();
      console.log(json);
  }

    return (
        <>
      <h1>카메라 리스트</h1>
      <Table columns={columns} data={data} Deletefunc={fetchDelData} />
        </>
    )
}

export default Cameralist