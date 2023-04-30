import React, {useRef} from 'react'
import {Link} from 'react-router-dom';
import { Box, TextField, Button } from '@mui/material';


const Login = ({handleLogin}) => {
  const username = useRef(null);
  const password = useRef(null);

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
      handleLogin(true);
    }
    else {
      handleLogin(false);
      alert(json.err+" Error")
    }
  };


  return (
    <>
        <>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            maxWidth: '400px',
            mx: 'auto',
          }}
        >
          <TextField sx={{ width: '100%', mb: 1 }} inputRef = {username} id="id" label="ID" variant="outlined" />
          <TextField sx={{ width: '100%', mb: 1 }} inputRef = {password} id="password" label="Password" type='password' variant="outlined" />
          <Button sx={{ width: '100%', mb: 1 }} variant="outlined" onClick={handleSubmit}>로그인</Button>
          <Button sx={{ width: '100%', mb: 1 }} variant="outlined" component={Link} to="/user/register">회원가입</Button>
        </Box>   
        </>
    </>
  )
}

export default Login