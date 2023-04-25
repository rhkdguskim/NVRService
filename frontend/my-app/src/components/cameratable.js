function CameraTable({ columns, data, Deletefunc }) {
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
          <tr key={camera._id}>
            <td>{camera.camname}</td>
            <td>{camera.ip}</td>
            <td>{camera.port}</td>
            <td><input id ={camera._id} type="button" onClick={Deletefunc} value="삭제"/></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default CameraTable;