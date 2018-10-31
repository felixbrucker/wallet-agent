const https = require('https');
const axios = require('axios');
const superagent = require('superagent');

const agent = new https.Agent({
  rejectUnauthorized: false
});

async function postUrl(url, data, options = {}) {
  options = Object.assign({httpsAgent: agent, timeout: 2 * 60 * 1000}, options);
  const result = await axios.post(url, data, options);
  return result.data;
}

async function postUrlWithoutUserAgent(url, data, options = {}) {
  options = Object.assign({timeout: 2 * 60 * 1000}, options);
  let myAgent = superagent.agent(agent).timeout(options.timeout);
  if (options.auth) {
    myAgent = myAgent.auth(options.auth.username, options.auth.password);
  }
  const result = await myAgent.post(url).unset('User-Agent').send(data);
  return result.body;
}

module.exports = {
  postUrl,
  postUrlWithoutUserAgent,
};