import React from "react";

function Table({ columns, data }) {
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
            <td>{camera.hardware}</td>
            <td>{camera.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Table;