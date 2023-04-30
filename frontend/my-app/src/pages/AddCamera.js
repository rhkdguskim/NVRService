import React, { useState ,useRef } from "react";
import FormControl from '@mui/material/FormControl';
import Input from '@mui/material/Input';
import {Box, Button,  InputLabel, FormHelperText, Select, MenuItem } from "@mui/material";

const Cameraadd = ({user}) => {
  const camname = useRef(null);
  const ip = useRef(null);
  const port = useRef(null);
  const id = useRef(null);
  const pwd = useRef(null);
  const [profile, Setprofile] = useState("");
  const [protocol, Setprotocol] = useState("");
  const [camprofiles, Setcamprofiles] = useState([]);

  const handleComboChange = (event) => {
    Setprofile(event.target.value);
    //console.log(profile);
  }

  const handleProtocolComboChange = (event) => {
    Setprotocol(event.target.value);
    //console.log(profile);
  }

  async function CheckProfile (event) {
    const camera = {
     ip:ip.current.value, port:port.current.value
  }

  const response = await fetch("/camera/profile", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(camera)
  })
  const json = await response.json();
  console.log(json);
  if(json.Isonline)
  {
    if(json.profiles.length)
    {
      Setcamprofiles(json.profiles);
    }
  }
};

  const handleSubmit = (event) => {
    event.preventDefault();
    
    const camera = {
        camname:camname.current.value, 
        ip:ip.current.value, 
        port:port.current.value, 
        username:id.current.value, 
        password:pwd.current.value,
        liveprofile:profile,
        protocoltype:protocol,
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
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'left',
            height: '100vh',
            maxWidth: '400px',
            mx: 'auto',
          }}
        >
      <FormControl>
      <InputLabel htmlFor="camname">Camera Name</InputLabel>
      <Input inputRef ={camname} id="camname" aria-describedby="camname-text" />
      <FormHelperText id="camname-text">사용할 카메라이름을 입력해주세요.</FormHelperText>
      </FormControl>

      <FormControl>
      <InputLabel htmlFor="camip">Camera IP</InputLabel>
      <Input inputRef ={ip} id="camip" aria-describedby="camip-text" onBlur={CheckProfile}/>
      <FormHelperText id="camip-text">Camera IP를 입력해주세요</FormHelperText>
      </FormControl>

      <FormControl>
      <InputLabel htmlFor="camport">Camera PORT</InputLabel>
      <Input inputRef ={port} id="camport" aria-describedby="camport-text" onBlur={CheckProfile}/>
      <FormHelperText id="camport-text">Camera PORT를 입력해주세요</FormHelperText>
      </FormControl>

      <FormControl>
      <InputLabel htmlFor="camid">Camera ID</InputLabel>
      <Input inputRef ={id} id="camid" aria-describedby="camid-text" value={user.onvifid} />
      <FormHelperText id="camid-text">Camera ID를 입력해주세요</FormHelperText>
      </FormControl>

      <FormControl>
      <InputLabel htmlFor="campassword">Camera Password</InputLabel>
      <Input inputRef ={pwd} id="campassword" aria-describedby="campassword-text" value={user.onvifpwd} type="password" />
      <FormHelperText id="campassword-text">Camera Password를 입력해주세요</FormHelperText>
      </FormControl>

      <FormControl>
      <InputLabel id="camprofile-label">Profiles</InputLabel>
      <Select
        labelId="camprofile-label"
        id="camprofile"
        value={profile}
        label="Profiles"
        onChange={handleComboChange}
      >
        <FormHelperText id="camprofile-label">Live할 프로파일을 선택해주세요</FormHelperText>
        {camprofiles.map(camprofile => (
          <MenuItem id ={camprofile.name} value={camprofile.name}>{camprofile.name}</MenuItem>
        ))};
      </Select>
      </FormControl>

      <FormControl>
      <InputLabel id="camprotocol-label">Protocol</InputLabel>
      <Select
        labelId="camprotocol-label"
        id="camprotocol"
        value={protocol}
        label="protocol"
        onChange={handleProtocolComboChange}
      >
        <FormHelperText id="camprotocol-label">Live할 프로토콜을 선택해주세요</FormHelperText>
        <MenuItem id ='mp4' value='mp4'>MP4</MenuItem>
        <MenuItem id ='hls' value='hls'>HLS</MenuItem>
        <MenuItem id ='websocket' value='websocket'>WebSocket</MenuItem>
      </Select>
      </FormControl>

      <Button variant="outlined" onClick={handleSubmit}>카메라추가</Button>
      </Box>
    </>
  )
}

export default Cameraadd