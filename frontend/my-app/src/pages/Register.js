import React, {useRef} from 'react'
import FormControl from '@mui/material/FormControl';
import Input from '@mui/material/Input';
import {Box, Button,  InputLabel, FormHelperText } from "@mui/material";
import {Link} from 'react-router-dom';

const Register = () => {

    const username = useRef(null);
    const password = useRef(null);
    const onvifid = useRef(null);
    const onvifpwd = useRef(null);
  
    const handleSubmit = (event) => {
      //event.preventDefault();
      const user = {
          username:username.current.value, password:password.current.value, onvifid:onvifid.current.value, onvifpwd:onvifpwd.current.value
      }  
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

        alert("회원가입 성공!!");
        <redirect to="/"/>;
    };
    return (
      <>
      <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'left',
            justifyContent: 'center',
            height: '100vh',
            maxWidth: '250px',
            mx: 'auto',
          }}
        >
      <FormControl>
      <InputLabel sx={{ width: '100%', mb: 1 }} htmlFor="username">아이디</InputLabel>
      <Input sx={{ width: '100%', mb: 1 }} inputRef ={username} id="username" aria-describedby="username-text" />
      <FormHelperText sx={{ width: '100%', mb: 1 }} id="username-text">사용할 아이디를 입력해주세요</FormHelperText>
      </FormControl>

      <FormControl>
      <InputLabel sx={{ width: '100%', mb: 1 }} htmlFor="password">비밀번호</InputLabel>
      <Input sx={{ width: '100%', mb: 1 }} inputRef ={password} id="password" aria-describedby="password-text" type="password"/>
      <FormHelperText sx={{ width: '100%', mb: 1 }} id="password-text">비밀번호를 입력해주세요</FormHelperText>
      </FormControl>

      <FormControl>
      <InputLabel sx={{ width: '100%', mb: 1 }} htmlFor="onvifid">Onvif ID</InputLabel>
      <Input sx={{ width: '100%', mb: 1 }} inputRef ={onvifid} id="onvifid" aria-describedby="onvifid-text" />
      <FormHelperText sx={{ width: '100%', mb: 1 }} id="onvifid-text">공용 카메라 ID를 입력해주세요</FormHelperText>
      </FormControl>

      <FormControl>
      <InputLabel sx={{ width: '100%', mb: 1 }} htmlFor="onvifpwd">Onvif Password</InputLabel>
      <Input sx={{ width: '100%', mb: 1 }} inputRef ={onvifpwd} id="onvifpwd" aria-describedby="onvifpwd-text" type="password"/>
      <FormHelperText sx={{ width: '100%', mb: 1 }} id="onvifpwd-text">공용 카메라 Password를 입력해주세요</FormHelperText>
      </FormControl>

      <Button sx={{ width: '100%', mb: 1 }} component={Link} to="/" variant="outlined" onClick={handleSubmit}>회원가입</Button>
      <Button sx={{ width: '100%', mb: 1 }} component={Link} to="/" variant="outlined">뒤로가기</Button>
      </Box>
      </>
    )
}

export default Register