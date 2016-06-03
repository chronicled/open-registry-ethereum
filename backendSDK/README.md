# Chronicled Authenticator SDK

This lib can be used on node-backends to write records to Registry contract.

## Registrant Usage

```js
//dependencies
var RegistrantSdk = require('./lib/registrant.js');
var Provider = require('./lib/provider.js');

//setting up provider for reading and writing

var secretSeed = 'general famous baby ritual flower gift exit admit rice order addict cash';
var rpcUrl = 'http://52.28.142.166:8555';

var provider = new Provider(secretSeed, rpcUrl);

//setting up sdk with provider and address of contract
var registryAddress = '0x2f3b8814c136ea5640a5c1da75f666f1565ba4ae';

var registrant = new RegistrantSdk(provider, registryAddress);

//playing with the registry
var asset = {
    identities: [{
        uri: 'pubkey-ecc://10238a3b4610238a3b4610238a3b4610238a3b4610238a3b46'
    }],
    data: null
};

registrant.createAsset(asset, 'refX').then(function(data) {
    console.log(data);
});

registrant.getAsset('refX').then(function(data) {
    console.log(data);
});
```

## Certifier Usage

```
//dependencies
var CertifierSdk = require('./lib/certifier.js');
var Provider = require('./lib/provider.js');

//setting up provider for reading and writing

var secretSeed = 'general famous baby ritual flower gift exit admit rice order addict cash';
var rpcUrl = 'http://52.28.142.166:8555';

var provider = new Provider(secretSeed, rpcUrl);

//setting up sdk with provider and address of contract
var registrarAddress = '0x3811199c2e19592aa7df1ea96ad8cb9675343557';

var certifier = new CertifierSdk(provider, registrarAddress);

//playing with the registry
certifier.addRegistrant("0x7111b812c1f8c93abb2c795f8fd5a202264c1111").then(function(data) {
    console.log(data);
});

certifier.listActiveRegistrants().then(function(data) {
    console.log(data);
});

```

## Protobuf Schema used

```
message Asset {    
  repeated Identity identities = 1; 
  optional Data data = 2;           
}                                   
                                    
message Identity {                  
  required string uri = 1;          
}                                   
                                    
message Data {                      
  optional string MymeType = 1;     
  optional string brandName = 2;    
}
```