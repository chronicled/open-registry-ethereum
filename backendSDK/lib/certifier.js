const Web3 = require('web3');
const ProviderEngine = require('web3-provider-engine');
const CacheSubprovider = require('web3-provider-engine/subproviders/cache.js');
const FixtureSubprovider = require('web3-provider-engine/subproviders/fixture.js');
const FilterSubprovider = require('web3-provider-engine/subproviders/filters.js');
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js');
const VmSubprovider = require('web3-provider-engine/subproviders/vm.js');
const HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet.js');
const NonceSubprovider = require('web3-provider-engine/subproviders/nonce-tracker.js');
const wallet = require('eth-lightwallet');

const pwDerivedKey = new Uint8Array([215,152,86,175,5,168,43,177,135,97,218,89,136,5,110,93,193,114,94,197,247,212,127,83,200,150,255,124,17,245,91,10]);
const registrarAbi = [{"constant":false,"inputs":[{"name":"_authenticator","type":"address"},{"name":"_isActive","type":"bool"}],"name":"setActive","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"authenticatorIndex","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_authenticator","type":"address"},{"name":"_delegate","type":"address"}],"name":"add","outputs":[],"type":"function"},{"constant":false,"inputs":[{"name":"_authenticator","type":"address"},{"name":"_delegate","type":"address"}],"name":"setDelegate","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"_authenticator","type":"address"},{"name":"_delegate","type":"address"}],"name":"isDelegate","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"_authenticator","type":"address"}],"name":"isAuthenticator","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"authenticators","outputs":[{"name":"addr","type":"address"},{"name":"delegate","type":"address"},{"name":"isActive","type":"bool"}],"type":"function"},{"constant":true,"inputs":[],"name":"getAuthenticatorsSize","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"inputs":[],"type":"constructor"}];

function Certifier (registrarAddress, secretSeed, rpcUrl) {

  var engine = new ProviderEngine();
  var web3 = new Web3(engine);
  
  engine.addProvider(new FixtureSubprovider({
    web3_clientVersion: 'ProviderEngine/v0.0.0/javascript',
    net_listening: true,
    eth_hashrate: '0x00',
    eth_mining: false,
    eth_syncing: true,
  }));

  // cache layer
  engine.addProvider(new CacheSubprovider());

  // filters 
  engine.addProvider(new FilterSubprovider())

  // pending nonce
  engine.addProvider(new NonceSubprovider());

  // vm
  //engine.addProvider(new VmSubprovider());

  var ks = new wallet.keystore(secretSeed, pwDerivedKey);
  ks.generateNewAddress(pwDerivedKey, 1);
  var addr = '0x' + ks.getAddresses()[0];

  engine.addProvider(new HookedWalletSubprovider({
    getAccounts: function(cb) {
      cb(null, [addr]);
    },
    approveTransaction: function(txParams, cb) {
      cb(null, true);
    },
    signTransaction: function(txData, cb) {
      txData.gasPrice = parseInt(txData.gasPrice, 16);
      txData.nonce = parseInt(txData.nonce, 16);
      txData.gasLimit = txData.gas;
      var tx = wallet.txutils.createContractTx(addr, txData);
      var signed = wallet.signing.signTx(ks, pwDerivedKey, tx.tx, addr);
      cb(null, signed);
    }
  }));

  engine.addProvider(new RpcSubprovider({
    rpcUrl: rpcUrl,
  }));
  engine.start();

  this.registrar = web3.eth.contract(registrarAbi).at(registrarAddress);

  this.address = addr;
  this.web3 = web3;
}

Certifier.prototype.list = function () {
  return Promise.reject('not implemented');
}

Certifier.prototype.add = function (authenticator, delegate) {
  var self = this;
  return new Promise(function (fulfill, reject) {
    self.registrar.add(authenticator, delegate, {from: self.address}, function(err, data) {
      if (err) {
        reject(err);
      }
      fulfill(data);
    });
  });
}

Certifier.prototype.setActive = function (authenticator, isActive) {
  var self = this;
  return new Promise(function (fulfill, reject) {
    self.registrar.setActive(authenticator, isActive, {from: self.address}, function(err, data) {
      if (err) {
        reject(err);
      }
      fulfill(data);
    });
  });
}

module.exports = Certifier;