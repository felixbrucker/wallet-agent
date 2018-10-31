const util = require('./util');

module.exports = class GenericWallet {
  constructor(wallet) {
    this.name = wallet.name;
    this.hostname = wallet.hostname;
    this.port = wallet.port;
    this.user = wallet.user;
    this.pass = wallet.pass;
    this.ticker = wallet.ticker;
    this.type = wallet.type;
    this.postUrl = wallet.removeUserAgent ? util.postUrlWithoutUserAgent : util.postUrl;
    this.stats = {};
    this.onInit();
  }


  async getDataForOldWallet() {
    const walletData = await this.postUrl(`http://${this.hostname}:${this.port}`, {
      jsonrpc: '2.0',
      id: 0,
      method: 'getinfo',
      params: [],
    }, {
      auth: {
        username: this.user,
        password: this.pass,
      },
    });
    const result = {
      version: walletData.result.version,
      balance: walletData.result.balance,
      unconfirmed: walletData.result.newmint,
      staked: walletData.result.stake,
      connections: walletData.result.connections,
    };
    result.total = result.balance;
    if (result.unconfirmed) {
      result.total += result.unconfirmed;
    }
    if (result.staked) {
      result.total += result.staked;
    }

    const bestBockHashData = await this.postUrl(`http://${this.hostname}:${this.port}`, {
      jsonrpc: '2.0',
      id: 0,
      method: 'getbestblockhash',
      params: [],
    }, {
      auth: {
        username: this.user,
        password: this.pass,
      },
    });
    const latestBlockData = await this.postUrl(`http://${this.hostname}:${this.port}`, {
      jsonrpc: '2.0',
      id: 0,
      method: 'getblock',
      params: [
        bestBockHashData.result,
      ],
    }, {
      auth: {
        username: this.user,
        password: this.pass,
      },
    });
    result.lastBlockReceived = latestBlockData.result.time;

    return result;
  }

  async getDataForNewWallet() {
    const networkData = await this.postUrl(`http://${this.hostname}:${this.port}`, {
      jsonrpc: '2.0',
      id: 0,
      method: 'getnetworkinfo',
      params: [],
    }, {
      auth: {
        username: this.user,
        password: this.pass,
      },
    });
    const result = {
      version: networkData.result.subversion,
      connections: networkData.result.connections,
    };
    const walletData = await this.postUrl(`http://${this.hostname}:${this.port}`, {
      jsonrpc: '2.0',
      id: 0,
      method: 'getwalletinfo',
      params: [],
    }, {
      auth: {
        username: this.user,
        password: this.pass,
      },
    });
    result.balance = walletData.result.balance;
    result.unconfirmed = walletData.result.unconfirmed_balance;
    if (result.unconfirmed && walletData.result.immature_balance) {
      result.unconfirmed += walletData.result.immature_balance;
    } else if (walletData.result.immature_balance){
      result.unconfirmed = walletData.result.immature_balance;
    }
    result.total = result.balance;
    if (result.unconfirmed) {
      result.total += result.unconfirmed;
    }

    const blockchainData = await this.postUrl(`http://${this.hostname}:${this.port}`, {
      jsonrpc: '2.0',
      id: 0,
      method: 'getblockchaininfo',
      params: [],
    }, {
      auth: {
        username: this.user,
        password: this.pass,
      },
    });
    result.syncProgress = blockchainData.result.verificationprogress;

    const latestBlockData = await this.postUrl(`http://${this.hostname}:${this.port}`, {
      jsonrpc: '2.0',
      id: 0,
      method: 'getblock',
      params: [
        blockchainData.result.bestblockhash,
      ],
    }, {
      auth: {
        username: this.user,
        password: this.pass,
      },
    });
    result.lastBlockReceived = latestBlockData.result.time;

    return result;
  }

  async updateStats() {
    const getDataForWallet = this.isOldWallet ? this.getDataForOldWallet.bind(this) : this.getDataForNewWallet.bind(this);
    try {
      this.stats = await getDataForWallet();
    } catch(err) {
      console.error(`[${this.name} :: Generic-Wallet-API] => ${err.message}`);
      this.stats = {};
    }
  }

  async determineIfOldWallet() {
    this.isOldWallet = true;
    try {
      const networkData = await this.postUrl(`http://${this.hostname}:${this.port}`, {
        jsonrpc: '2.0',
        id: 0,
        method: 'getnetworkinfo',
        params: [],
      }, {
        auth: {
          username: this.user,
          password: this.pass,
        },
      });

      if (networkData.error === null) {
        this.isOldWallet = false;
      }
    } catch(err) {} // ignore errors here, old wallet does not support the method
  }

  async onInit() {
    await this.determineIfOldWallet();
    await this.updateStats();
    this.runningInterval = setInterval(this.updateStats.bind(this), 60 * 1000);
  }

  getStats() {
    return {
      name: this.name,
      type: this.type,
      data: this.stats,
      ticker: this.ticker.toUpperCase(),
    };
  }

  cleanup() {
    if (this.runningInterval) {
      clearInterval(this.runningInterval);
      this.runningInterval = null;
    }
    this.stats = {};
  }
};