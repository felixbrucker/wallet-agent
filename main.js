const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');
const express = require('express');
const bodyParser = require('body-parser');
const basicAuth = require('express-basic-auth');
const walletClasses = require('./wallets');

let db = null;
let config = null;
let wallets = null;
let instances = null;
const app = express();

async function init() {
  const adapter = new FileAsync('db.json');
  db = await low(adapter);
  await db.defaults({ config: {
    user: '',
    pass: '',
    port: 8081,
    ip: '127.0.0.1',
  }, wallets: [] }).write();
  config = await db.get('config').value();
  wallets = await db.get('wallets').value();
  setupWallets();
  setupExpress();
  const listener = app.listen(config.port, config.ip, () => {
    console.log(`server running on port ${listener.address().port}`);
  });
}

function setupExpress() {
  const users = {};
  users[config.user] = config.pass;
  app.use(basicAuth({
    users,
    challenge: true,
    realm: 'wallet-agent',
  }));

  app.use(bodyParser.urlencoded({
    extended: true,
    limit: '50mb'
  }));
  app.use(bodyParser.json({
    limit: '50mb'
  }));

  app.use((req, res, next) => {
    console.log(`received request: ${req.originalUrl}`);
    next();
  });
  app.get('/stats', getStats);
}

async function getStats(req, res) {
  const stats = instances.map(instance => instance.getStats());
  res.send(stats);
}

function setupWallets() {
  instances = wallets.map(wallet => {
    const WalletClass = getWalletClass(wallet.type);
    return new WalletClass(wallet);
  });
}

function getWalletClass(type) {
  switch (type) {
    case 'generic-wallet':
      return walletClasses.GenericWallet;
    case 'bitbean-wallet':
      return walletClasses.BitbeanWallet;
    case 'hexxcoin-wallet':
      return walletClasses.HexxcoinWallet;
    case 'cryptonight-wallet':
      return walletClasses.CryptonightWallet;
    case 'bhd-wallet':
      return walletClasses.BHDWallet;
  }
}

init();