const https = require('https');
const axios = require('axios');

const agent = new https.Agent({
  rejectUnauthorized: false
});

async function getUrl(url) {
  const result = await axios.get(url, {httpsAgent: agent, timeout: 2 * 60 * 1000});
  return result.data;
}

async function postUrl(url, data, options = {}) {
  options = Object.assign({httpsAgent: agent, timeout: 2 * 60 * 1000}, options);
  const result = await axios.post(url, data, options);
  return result.data;
}
function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

module.exports = {
  getUrl,
  postUrl,
  sleep,
};