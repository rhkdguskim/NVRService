import React, {useRef} from 'react'

const Register = () => {

    const username = useRef(null);
    const password = useRef(null);
    const onvifid = useRef(null);
    const onvifpwd = useRef(null);
  
    const handleSubmit = (event) => {
      event.preventDefault();
      const user = {
          username:username.current.value, password:password.current.value, onvifid:onvifid.current.value, onvifpwd:onvifpwd.current.value
      }
      console.log(user);
  
      fetch("/user/", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(user)
        })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error(error));

        alert("회원가입 성공!!")
    };
    return (
      <>
        <h1>회원 가입</h1>
        <form onSubmit={handleSubmit}>
        <ul>
          <li>아이디: <input ref ={username} type="text"/></li>
          <li>비밀번호: <input ref ={password} type="password"/></li>
          <li>ONVIF 아이디: <input ref ={onvifid} type="text"/></li>
          <li>ONVIF 비밀번호: <input ref ={onvifpwd} type="password" /></li>
          <input type="submit" value="추가" />
        </ul>
      </form>
      </>
    )
}

export default Register