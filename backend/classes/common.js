const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
const portRegex = /^[0-9]{1,5}$/;

function isValidIPandPORT(ipAddress , port) {
  return ipRegex.test(ipAddress) && portRegex.test(port);
}

module.exports = {isValidIPandPORT};