var fs = require('fs');

function saveConfigs(data) {
  fs.writeFileSync('./config.json', JSON.stringify(data));
}

function getConfigs() {
  let data = fs.readFileSync('./config.json')
  return JSON.parse(data)
}

module.exports.saveConfigs = saveConfigs
module.exports.getConfigs = getConfigs