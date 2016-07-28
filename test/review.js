'use strict';
var Promise = require('bluebird');

var Provider = require('../../open-registry-sdk/lib/provider.js');
var RegistrantSdk = require('../../open-registry-sdk/lib/registrant.js');
var RegistrarSdk = require('../../open-registry-sdk/lib/certifier.js');
var ConsumerSdk = require('../../open-registry-sdk/lib/consumer.js');
var secretSeed = "galaxy blue prison pudding mind ozone obey plunge resemble repeat such other";
// var privateKey = "0xf16061d4912b559390a378b3e223e726fa889b89e0635d04cbaec65d0efc6067";
var address = "0x85bd6dbf8e579feef62439c4dcf2b2100ce22808";

var singleId = 'hello:12345678'
var serviceUrl = 'http://hello.com';

var severalIds = ["pbk:ec:secp256r1:0211fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29fb6", "ble:1.0:aabbccddeeff", "pbk:ec:secp256r1:0222fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29fb6"]
var things = [
  {identities: severalIds.slice(0, 2), data: {service_url: 'abc.com'}},
  {identities: severalIds.slice(-1), data: {service_url: 'http://chronicled.com/'}},
];

var UtilURN = require('../../open-registry-utils/lib/urn.js');
var packURN = UtilURN.packer.encodeAndChunk.bind(UtilURN.packer);
var unpackURN = UtilURN.packer.decode.bind(UtilURN.packer);
var randNum = function(upTo) {return Math.floor(Math.random() * upTo)};
var randId = function() {return ('00000000' + randNum(100000000000000000)).slice(-18)}

var ids = [
  "pbk:ec:secp256r1:0260fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29fb6",
  "ble:1.0:0a153c993d9c",
  "pbk:rsa:2048:8c33d1bafbb20a80f0f95ac8cb9f060d39b5744790aa7d96cd2977398257b2ac1396aebb62182c5c6f8a8527e62af27e8853187e1d7962f0ef030129bc334e8471b4352c594c8b413835f882779038a56f44c9a4d189f8e0702087ee04a50a1e84f52443c48c3176be3be17509bf142477e5eeeaf4a41dd87e9b6ca5cea62342dc0e08ae5ab701a4016bd723113a0cd3cf0be5b472f23355981be5191c6c84429cc4bb4270d18bb923ca373a0950d74b83545bf40d9283b3a2cbe0173ee224c155d8615de38cb58cb5e23f30b7edf4be2ccd7a30184aa700ffcbf1f31ea9ef1961b89bc58bc6d4749099fa0a5503fd6e5cbdd42357002be28564663b305fd6db",
];
var newId = "nfc:1.0:20153c913d9c4a";
var thingData = ["0x1200000000000000000000000000000000000000000000000000000000000000","0x1400000000000000000000000000000000000000000000000000000000000000"];

contract('Registry', {reset_state: true}, function(accounts) {
  describe.skip('OPENSRC-80: Adding new identities to a Thing', function() {
    it('should add a new identity to a Thing', function(done) {
      var registry = Registry.deployed();
      var registrar = Registrar.deployed();

      var chunkedIds = UtilURN.packer.encodeAndChunk(ids);
      var createThingParams = [chunkedIds, thingData, 1];
      var lookupId = packURN(ids[randNum(ids.length)]);

      registry.configure(registrar.address).then(function(txHash) {
        assert.notEqual(txHash, null);
        return registry.createSchema('This is a test');
      })
      .then(function(txHash) {
        assert.notEqual(txHash, null);
        return registrar.add(accounts[0], "");
      })
      .then(function(txHash) {
        assert.notEqual(txHash, null);
        return registry.createThing.call.apply(null, createThingParams);
      })
      .then(function(result) {
        assert.equal(result, true);
        return registry.createThing.apply(null, createThingParams);
      })
      .then(function(txHash) {
        assert.notEqual(txHash, null);
        return registry.addIdentities.call(lookupId, packURN(newId));
      })
      .then(function(result) {
        assert.equal(result, true);
        return registry.addIdentities(lookupId, packURN(newId));
      })
      .then(function(txHash) {
        assert.notEqual(txHash, null);
        return registry.getThing(packURN(newId));
      })
      .then(function(result) {
        assert.notEqual(result, null);
        assert.notEqual(result[0].indexOf(packURN(newId)[0]), -1);
        return;
      })
      .then(done).catch(done);
    });

    it('should add multiple identities to a Thing', function(done) {
      var registry = Registry.deployed();
      var registrar = Registrar.deployed();

      var chunkedIds = UtilURN.packer.encodeAndChunk(ids);
      var createThingParams = [chunkedIds, thingData, 1];
      var lookupId = packURN(ids[randNum(ids.length)]);

      var manyNewIds = [
        "pbk:ec:secp256r1:0260fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29f00",
        "ble:1.0:0a153c993d00",
        "pbk:rsa:2048:8c33d1bafbb20a80f0f95ac8cb9f060d39b5744790aa7d96cd2977398257b2ac1396aebb62182c5c6f8a8527e62af27e8853187e1d7962f0ef030129bc334e8471b4352c594c8b413835f882779038a56f44c9a4d189f8e0702087ee04a50a1e84f52443c48c3176be3be17509bf142477e5eeeaf4a41dd87e9b6ca5cea62342dc0e08ae5ab701a4016bd723113a0cd3cf0be5b472f23355981be5191c6c84429cc4bb4270d18bb923ca373a0950d74b83545bf40d9283b3a2cbe0173ee224c155d8615de38cb58cb5e23f30b7edf4be2ccd7a30184aa700ffcbf1f31ea9ef1961b89bc58bc6d4749099fa0a5503fd6e5cbdd42357002be28564663b305fd600",
      ];

      var chunkedNewIds = UtilURN.packer.encodeAndChunk(manyNewIds);

      registry.configure(registrar.address).then(function(txHash) {
        assert.notEqual(txHash, null);
        return registry.createSchema('This is a test');
      })
      .then(function(txHash) {
        assert.notEqual(txHash, null);
        return registrar.add(accounts[0], "");
      })
      .then(function(txHash) {
        assert.notEqual(txHash, null);
        return registry.createThing.apply(null, createThingParams);
      })
      .then(function(txHash) {
        assert.notEqual(txHash, null);
        return registry.addIdentities(lookupId, packURN(newId));
      })
      .then(function(txHash) {
        assert.notEqual(txHash, null);
        return registry.addIdentities.call(lookupId, chunkedNewIds);
      })
      .then(function(result) {
        assert.equal(result, true);
        return registry.addIdentities(lookupId, chunkedNewIds);
      })
      .then(function(txHash) {
        assert.notEqual(txHash, null);
        return registry.getThing(packURN(newId));
      })
      .then(function(result) {
        assert.notEqual(result, null);
        assert.notEqual(result[0].indexOf(packURN(newId)[0]), -1);
        assert(result[0].length > chunkedIds.length && result[0].length > chunkedNewIds.length)
        return;
      })
      .then(done).catch(done);      
    });

    it('should fail to add new identities from a failed lookup identity', function(done) {
      var registry = Registry.deployed();
      var registrar = Registrar.deployed();

      var chunkedIds = UtilURN.packer.encodeAndChunk(ids);
      var createThingParams = [chunkedIds, thingData, 1];
      var lookupId = packURN(ids[randNum(ids.length)]);

      var newTempId = "ble:1.0:0a153c993d00";

      registry.configure(registrar.address).then(function(txHash) {
        assert.notEqual(txHash, null);
        return registry.createSchema('This is a test');
      })
      .then(function(txHash) {
        assert.notEqual(txHash, null);
        return registrar.add(accounts[0], "");
      })
      .then(function(txHash) {
        assert.notEqual(txHash, null);
        return registry.createThing.apply(null, createThingParams);
      })
      .then(function(txHash) {
        assert.notEqual(txHash, null);
        return registry.addIdentities.call(packURN(newTempId), packURN(newId));
      })
      .then(function(result) {
        assert.equal(result, false);
        return;
      })
      .then(done).catch(done);
    });
  });
  
  describe('OPENSRC-96: Dev can add new identity to a Thing in Open Registry (Registrant SDK)', function() {
    var registrantSdk;
    var registrarSdk;
    var consumerSdk;
    var provider;

    it('should add a new thing to the registry through SDK', function(done) {
      var registry = Registry.deployed();
      var registrar = Registrar.deployed();
      
      provider = new Provider("http://localhost:8545", secretSeed, function() {
        registrantSdk = new RegistrantSdk(provider, registry.address);
        registrarSdk = new RegistrarSdk(provider, registry.address, registrar.address);
        consumerSdk = new ConsumerSdk(provider, registry.address, registrar.address);
      
        var chunkedIds = UtilURN.packer.encodeAndChunk(ids);
        var createThingParams = [chunkedIds, thingData, 1];
        var lookupId = packURN(ids[randNum(ids.length)]);

        return registry.configure(registrar.address).then(function(txHash) {
          assert.notEqual(txHash, null);
          return registry.createSchema('This is a test');
        })
        .then(function(txHash) {
          assert.notEqual(txHash, null);
          return registrar.add(address, "Registrant data");
        })
        .then(function(txHash) {
          assert.notEqual(txHash, null);
          return registrantSdk.createThing([singleId], {service_url: serviceUrl}, 1);
        })
        .then(function(txHash) {
          return waitForTransaction(txHash);
        }).then(done).catch(done);
      });
    });
  });
});

var waitForTransaction = function (hash) {
  return new Promise(function(resolve, reject) {
    var interval = setInterval(function() {
      web3.eth.getTransactionReceipt(hash, function(err, receipt) {
        if (err != null) {
          clearInterval(interval);

          return reject(err);
        }
        if (receipt != null) {
          clearInterval(interval);
          resolve(receipt);
        }
      });
    }, 500);
  });
};
