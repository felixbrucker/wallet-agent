const GenericWallet = require('./generic-wallet');

module.exports = class BHDWallet extends GenericWallet {

  constructor(wallet = {}) {
    wallet.ticker = 'BHD';
    wallet.removeUserAgent = true;
    super(wallet);
  }
};
