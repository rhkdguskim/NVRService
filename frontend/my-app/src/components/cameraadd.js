import React, { useRef } from "react";

const Cameraadd = () => {
  const camname = useRef(null);
  const ip = useRef(null);
  const port = useRef(null);
  const id = useRef(null);
  const pwd = useRef(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    const camera = {
        body: {camname:camname.current.value, ip:ip.current.value, port:port.current.value, username:id.current.value, password:pwd.current.value}
    }
    console.log(camera);

    fetch("/camera/", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(camera)
      })
      .then(response => response.json())
      .then(data => console.log(data))
      .catch(error => console.error(error));
  };
  return (
    <>
      <h1>카메라 추가</h1>
      <form onSubmit={handleSubmit}>
      <ul>
        <li>카메라이름: <input ref ={camname} type="text"/></li>
        <li>카메라IP: <input ref ={ip} type="text"/></li>
        <li>카메라PORT: <input ref ={port} type="text"/></li>
        <li>유저아이디: <input ref ={id} type="text" /></li>
        <li>비밀번호: <input ref ={pwd} type="password" /></li>
        <input type="submit" value="추가" />
      </ul>
    </form>
    </>
  )
}

export default Cameraadd