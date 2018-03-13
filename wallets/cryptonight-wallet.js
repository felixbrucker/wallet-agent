const util = require('./util');

module.exports = class CryptonightWallet {
  constructor(wallet) {
    this.name = wallet.name;
    this.hostname = wallet.hostname;
    this.daemonPort = wallet.daemonPort;
    this.walletPort = wallet.walletPort;
    // this.user = wallet.user; // TODO: digest auth
    // this.pass = wallet.pass;
    this.ticker = wallet.ticker;
    this.decimals = wallet.decimals;
    this.type = wallet.type;
    this.stats = {};
    this.supportsGetInfo = true;
    this.supportsGetBalance = true;
    this.supportsGetConnections = true;
    this.supportsGetLastBlockHeader = true;
    this.supportsGetStatus = true;
    this.onInit();
  }

  async updateStats() {
    try {
      const stats = {};
      if (this.supportsGetInfo) {
        const infoData = await util.postUrl(`http://${this.hostname}:${this.daemonPort}/json_rpc`, {
          jsonrpc: '2.0',
          id: 0,
          method: 'get_info',
          params: [],
        });
        if (infoData.error) {
          this.supportsGetInfo = false;
        } else {
          stats.connections = infoData.result.incoming_connections_count + infoData.result.outgoing_connections_count;
          stats.syncProgress = infoData.result.height / (infoData.result.target_height || 1);
        }
      } else {
        stats.connections = 'N/A';
      }
      if (this.supportsGetLastBlockHeader) {
        const lastBlockData = await util.postUrl(`http://${this.hostname}:${this.daemonPort}/json_rpc`, {
          jsonrpc: '2.0',
          id: 0,
          method: 'getlastblockheader',
          params: [],
        });
        if (lastBlockData.error && lastBlockData.error.message !== 'Core is busy') {
          this.supportsGetLastBlockHeader = false;
        } else if (lastBlockData.error && lastBlockData.error.message === 'Core is busy'){
          stats.syncing = true;
        } else {
          stats.lastBlockReceived = lastBlockData.result.block_header.timestamp;
        }
      }
      if (this.supportsGetConnections) {
        const connectionData = await util.postUrl(`http://${this.hostname}:${this.daemonPort}/json_rpc`, {
          jsonrpc: '2.0',
          id: 0,
          method: 'get_connections',
          params: [],
        });
        if (connectionData.error) {
          this.supportsGetConnections = false;
        } else {
          stats.connections = (stats.connections && stats.connections !== 'N/A') ? stats.connections : connectionData.result.connections.length;
        }
      }
      if (this.supportsGetBalance) {
        const balanceData = await util.postUrl(`http://${this.hostname}:${this.walletPort}/json_rpc`, {
          jsonrpc: '2.0',
          id: 0,
          method: 'getbalance',
          params: [],
        });
        if (balanceData.error) {
          this.supportsGetBalance = false;
        } else {
          stats.total = balanceData.result.balance / Math.pow(10, this.decimals);
          stats.balance = balanceData.result.unlocked_balance / Math.pow(10, this.decimals);
          stats.unconfirmed = stats.total - stats.balance;
        }
      } else {
        const balanceData = await util.postUrl(`http://${this.hostname}:${this.walletPort}/json_rpc`, {
          jsonrpc: '2.0',
          id: 0,
          method: 'getBalance',
          params: {},
        });
        if (balanceData.error) {
          // we have a problem
        } else {
          stats.balance = balanceData.result.availableBalance / Math.pow(10, this.decimals);
          stats.unconfirmed = balanceData.result.lockedAmount / Math.pow(10, this.decimals);
          stats.total = stats.balance + stats.unconfirmed;
        }
      }
      if (this.supportsGetStatus) {
        const statusData = await util.postUrl(`http://${this.hostname}:${this.walletPort}/json_rpc`, {
          jsonrpc: '2.0',
          id: 0,
          method: 'getStatus',
          params: {},
        });
        if (statusData.error) {
          this.supportsGetStatus = false;
        } else {
          stats.connections = (stats.connections && stats.connections !== 'N/A') ? stats.connections : statusData.result.peerCount;
          stats.syncProgress = stats.syncProgress ? stats.syncProgress : (statusData.result.blockCount / statusData.result.knownBlockCount);
        }
      }
      this.stats = stats;
    } catch (err) {
      console.error(`[${this.name} :: Cryptonight-Wallet-API] => ${err.message}`);
      this.stats = {};
    }
  }

  async onInit() {
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