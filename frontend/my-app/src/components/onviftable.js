import React, {useRef} from 'react';

function Table({ columns, data , addCamera }) {
  const addOnvifCamera = (e) => {
    addCamera(e.target.id);
  }
  return (
    <table>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column}>{column}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((camera) => (
          <tr key={camera.address}>
            <td>{camera.address}</td>
            <td>{camera.port}</td>
            <td>{camera.hardware}</td>
            <td>{camera.name}</td>
            <td><input id ={camera.address} type="button" onClick={addOnvifCamera} value="추가"/></td>
            
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Table;