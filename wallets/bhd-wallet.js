const GenericWallet = require('./generic-wallet');

module.exports = class BHDWallet extends GenericWallet {

  constructor(wallet = {}) {
    wallet.ticker = 'BHD';
    wallet.removeUserAgent = true;
    super(wallet);
  }

  async getDataForNewWallet() {
    const result = await super.getDataForNewWallet();
    const { result: pledgeData } = await this.postUrl(`http://${this.hostname}:${this.port}`, {
      jsonrpc: '2.0',
      id: 0,
      method: 'getpledge',
      params: [],
    }, {
      auth: {
        username: this.user,
        password: this.pass,
      },
    });
    result.pledgeAmount = pledgeData.pledge;
    result.pledgeCapacity = pledgeData.capacity;

    return result;
  }
};
