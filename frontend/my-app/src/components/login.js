import React, {useRef, useState, useEffect} from 'react'

const Login = (isLoggedIn) => {
  const username = useRef(null);
  const password = useRef(null);

  const [isLogined, SetisLogined] = useState(false);

  useEffect(() => {
    //handleLogin(isLogined);
  },);

  async function handleSubmit (event) {
    event.preventDefault();
    const user = {
        username:username.current.value, password:password.current.value
    }

    const response = await fetch("/user/login", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(user)
    })

    const json = await response.json();
    if(json.Logined) {
      alert("로그인성공!!")
      SetisLogined(true);
    }
    else {
      SetisLogined(false);
      alert(json.err+" Error")
    }
      
  };

  return (
    <>
    {!isLogined && 
        <form onSubmit={handleSubmit}>
        <ul>
          <li>아이디: <input ref ={username} type="text"/></li>
          <li>비밀번호: <input ref ={password} type="password"/></li>
          <input type="submit" value="로그인" />
        </ul>
        </form>
    }

    </>
  )
}

export default Login