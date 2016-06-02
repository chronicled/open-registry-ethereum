# Chronicled Authenticator SDK

This lib can be used on node-backends to write records to Registry contract.

## Usage

```js
//dependencies
var RegistrantSdk = require('./lib/registrant.js');
var Provider = require('./lib/provider.js');

//setting up provider for reading and writing

var secretSeed = 'general famous baby ritual flower gift exit admit rice order addict cash';
var rpcUrl = 'http://52.28.142.166:8555';

var provider  = new Provider(secretSeed, rpcUrl);

//setting up sdk with provider and address of contract

var registryAddress = '0x2bd442f68b4aff8c62d41b157c94a5329a80842d';

var registrant = new RegistrantSdk(provider, registryAddress);

//playing with the registry
var asset = {
  identities: [
    { uri: 'pubkey-ecc://10238a3b4610238a3b4610238a3b4610238a3b4610238a3b46' }
  ],
  data: null
};

registrant.createAsset(asset, 'ref3');

registrant.getAsset('ref3');
```