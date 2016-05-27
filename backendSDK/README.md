# Chronicled Authenticator SDK

This lib can be used on node-backends to write records to Registry contract.

## Usage

```js
var AuthSdk = require('./lib/index.js');

var registryAddress = '0x2bd442f68b4aff8c62d41b157c94a5329a80842d';
var secretSeed = 'general famous baby ritual flower gift exit admit rice order addict cash';
var rpcUrl = 'http://52.28.142.166:8555';

var auth = new AuthSdk(registryAddress, secretSeed, rpcUrl);

auth.create('{\"value\":\"json schema compliant value\"}', 3, 'ref3');

auth.getRecord('ref3');
```