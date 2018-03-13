const moment = require('moment');
const util = require('./util');
const GenericWallet = require('./generic-wallet');

module.exports = class BitbeanWallet extends GenericWallet {

  constructor(wallet = {}) {
    wallet.ticker = 'BITB';
    super(wallet);
  }

  async getDataForOldWallet() {
    const result = await super.getDataForOldWallet();
    const sproutingData = await util.postUrl(`http://${this.hostname}:${this.port}`, {
      jsonrpc: '2.0',
      id: 0,
      method: 'getsproutinginfo',
      params: [],
    }, {
      auth: {
        username: this.user,
        password: this.pass,
      },
    });
    result.sprouting = sproutingData.result.Enabled && sproutingData.result.Sprouting;
    if (result.sprouting) {
      result.sproutingInterval = moment.duration(sproutingData.result['Expected Time'], 'seconds').humanize();
    }

    return result;
  }

  async updateStats() {
    try {
      this.stats = await this.getDataForOldWallet();
    } catch(err) {
      console.error(`[${this.name} :: Bitbean-Wallet-API] => ${err.message}`);
      this.stats = {};
    }
  }
};
