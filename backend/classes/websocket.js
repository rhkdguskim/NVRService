const protobuf = require('google-protobuf');
const crypto = require('crypto');
const WebSocket = require('ws');
const LinkProto = require("../protobuf/linkproto_pb")
const LinkSystem = require("../protobuf/linksystem_pb")
const VidConf = require("../protobuf/vidconf_pb")



const ws = new WebSocket('ws://110.110.10.80:9080/MilinkUserstream');

// 연결이 열릴 때
ws.onopen = () => {

  console.log('WebSocket 연결이 열렸습니다.');
  // 텍스트 데이터 전송

  ws.send(Login("admin", "admin", "nonce"));
};

// 메시지를 받았을 때
ws.onmessage = (event) => {
  console.log('WebSocket 메시지를 받았습니다: ', event.data);
};

// 연결이 닫혔을 때
ws.onclose = () => {
  console.log('WebSocket 연결이 닫혔습니다.');
};

function Login(strUser, strPasswd, strNonce)
{
  const cmd = new LinkProto.LinkCmd();
  const type = LinkProto.LinkCmdType.LINK_CMD_LOGIN_REQ;
  cmd.setType(type);
  
  const pass = strNonce + strPasswd;

  const md5Output = crypto.createHash('md5').update(pass).digest('hex');
  const req = new LinkSystem.LinkLoginReq();
  req.setStrusername(strUser);
  req.setStrpasswd(md5Output);
  cmd.setLoginreq(req);

  const strMsg = cmd.serializeBinary().toString('base64');
  console.log(strMsg);
  return strMsg;
}

