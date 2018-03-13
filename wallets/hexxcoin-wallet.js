const util = require('./util');
const GenericWallet = require('./generic-wallet');

module.exports = class HexxcoinWallet extends GenericWallet {

  constructor(wallet = {}) {
    wallet.ticker = 'HXX';
    super(wallet);
  }

  async getDataForNewWallet() {
    const result = await super.getDataForNewWallet();
    const xnodeData = await util.postUrl(`http://${this.hostname}:${this.port}`, {
      jsonrpc: '2.0',
      id: 0,
      method: 'xnode',
      params: ['list-conf'],
    }, {
      auth: {
        username: this.user,
        password: this.pass,
      },
    });
    result.nodes = xnodeData.result.map(node => {
      delete node.privateKey;
      return node;
    });

    return result;
  }

  async updateStats() {
    try {
      this.stats = await this.getDataForNewWallet();
    } catch(err) {
      console.error(`[${this.name} :: Hexxcoin-Wallet-API] => ${err.message}`);
      this.stats = {};
    }
  }
};
