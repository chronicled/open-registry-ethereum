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
const registryAbi = [{"constant":true,"inputs":[{"name":"_reference","type":"bytes32"}],"name":"getRecord","outputs":[{"name":"","type":"uint256"},{"name":"","type":"string"}],"type":"function"},{"constant":true,"inputs":[],"name":"registrar","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"records","outputs":[{"name":"owner","type":"address"},{"name":"version","type":"uint256"},{"name":"data","type":"string"},{"name":"isValid","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_data","type":"string"},{"name":"_version","type":"uint256"},{"name":"_reference","type":"bytes32"},{"name":"_owner","type":"address"}],"name":"createFor","outputs":[],"type":"function"},{"constant":false,"inputs":[{"name":"_data","type":"string"},{"name":"_version","type":"uint256"},{"name":"_reference","type":"bytes32"}],"name":"create","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_reference","type":"bytes32"},{"name":"_isValid","type":"bool"}],"name":"setValid","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"recordIndex","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"inputs":[],"type":"constructor"}];


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

  this.registry = web3.eth.contract(registryAbi).at(registryAddress);