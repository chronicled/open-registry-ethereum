// Set testrpc --gasLimit=3700000 , so contract can be deployed

contract('Registry', {reset_state: true}, function(accounts) {
    var eventsHelper = require('../truffle-helpers/eventsHelper.js');
    // Todo: replace to utils component when deployed
    var UtilURN = require('../../open-registry-utils/lib/urn.js');
    var packURN = UtilURN.packer.encodeAndChunk.bind(UtilURN.packer);
    var unpackURN = UtilURN.packer.decode.bind(UtilURN.packer);
    var randNum = function(upTo) {return Math.floor(Math.random() * upTo)};

    it('should be possible to configure registry', function(done) {
      var registrar = Registrar.deployed();
      var registry = Registry.deployed();

      registry.configure(registrar.address).then(function(txHash) {
        assert.notEqual(txHash, null);
      }).then(function() {
        return registry.registrarAddress.call();
      }).then(function(result) {
        assert.equal(result, registrar.address);
      }).then(done).catch(done);
    });

    var ids = [
      "pbk:ec:secp256r1:0260fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29fb6",
      "ble:1.0:0a153c993d9c",
      "pbk:rsa:2048:8c33d1bafbb20a80f0f95ac8cb9f060d39b5744790aa7d96cd2977398257b2ac1396aebb62182c5c6f8a8527e62af27e8853187e1d7962f0ef030129bc334e8471b4352c594c8b413835f882779038a56f44c9a4d189f8e0702087ee04a50a1e84f52443c48c3176be3be17509bf142477e5eeeaf4a41dd87e9b6ca5cea62342dc0e08ae5ab701a4016bd723113a0cd3cf0be5b472f23355981be5191c6c84429cc4bb4270d18bb923ca373a0950d74b83545bf40d9283b3a2cbe0173ee224c155d8615de38cb58cb5e23f30b7edf4be2ccd7a30184aa700ffcbf1f31ea9ef1961b89bc58bc6d4749099fa0a5503fd6e5cbdd42357002be28564663b305fd6db",
    ];

    var newId = "nfc:1.0:20153c913d9c4a";

    it('Basic workflow', function(done) {
      var registrar = Registrar.deployed();
      var registry = Registry.deployed();

      eventsHelper.setupEvents(registry);
      var createdEvent = registry.Created();
      var updatedEvent = registry.Updated();


      var chunkedIds = UtilURN.packer.encodeAndChunk(ids);
      var params = [chunkedIds, ["0x1","0x2"], 1];

      var lookUpId = ids[randNum(ids.length)];

      registry.configure(registrar.address).then(function(txHash) {
        assert.notEqual(txHash, null);
        // Todo: pass real schema
        return registry.createSchema("0x12");
      }).then(function(txHash) {
        assert.notEqual(txHash, null);
        // Add Registrant
        return registrar.add(accounts[0], "");
      }).then(function(txHash){
          assert.notEqual(txHash, null);
          // Check return value
          return registry.createThing.call.apply(null, params);
      }).then(function(result) {
        assert.equal(result, true);
        return registry.createThing.apply(null, params);
      }).then(function(txHash) {
        // Transaction should succeed
        assert.notEqual(txHash, null);
        return eventsHelper.getEvents(txHash, createdEvent);
      }).then(function(events) {
        // Created Event should be generated
        var eventParams = events[0].args;
        // Same Ids as provided
        assert.deepEqual(eventParams.ids, chunkedIds);
        // Check if thing is there.
        // return registry.getThingByIndexDEBUG.call(1);
        eventsHelper.setupEvents(registry);
        return registry.addIdentities.call(packURN(lookUpId), packURN(newId));
      }).then(function(result) {
        assert.equal(result, true);
        return registry.addIdentities(packURN(lookUpId), packURN(newId));
      }).then(function(txHash) {
        assert.notEqual(txHash, null);
        return eventsHelper.getEvents(txHash, updatedEvent);
      }).then(function(events) {
        assert.deepEqual(events[0].args.ids, packURN(lookUpId));
        done();
      }).catch(console.log);

    });

    // it('Can add new Identity to a thing using any of its existing ids.', function(done) {
    //   var registry = Registry.deployed();
    //   // eventsHelper.setupEvents(registry);
    //
    //
    //
    //
    //
    // });

    // it('Thing can be accessed by any of the IDs', function(done) {
    //   var registry = Registry.deployed();
    //
    //
    //   // Check method return value
    //   registry.getThing.call.apply(null, params).then(function(result) {
    //     assert.equal(result, true);
    //     return registry.create.apply(null, params);
    //   }).then(function(txHash) {
    //     // Transaction should succeed
    //     assert.notEqual(txHash, null);
    //     return eventsHelper.getEvents(txHash, createdEvent);
    //   }).then(function(events) {
    //     // Created Event should be generated
    //     var eventParams = events[0].args;
    //     // Same Ids as provided
    //     assert.deepEqual(eventParams.ids, chunkedIds);
    //     return
    //   }).catch(console.log);
    //
    // });

    // Duplication is prevented. Total or overlapping


    // Can add identity to existing thing. Accessible by all identities.


    // Can delete record, all others are still accessible.


    // Add schema:
    // message Thing {
    // 	optional string uri = 1;
    // 	optional string productName = 2;
    // 	optional Data data = 3;
    // };
    //
    // message Data {
    // 	optional string size = 1;
    // }
});



// contract('Registry', {reset_state: true}, function(accounts) {
//   it('should be possible to configure registry', function(done) {
//     var registrar = Registrar.deployed();
//     var registry = Registry.deployed();
//     registry.configure(registrar.address).then(function() {
//     }).then(function() {
//       return registry.registrarAddress.call();
//     }).then(function(result) {
//       assert.equal(result, registrar.address);
//     }).then(done).catch(done);
//   });
//   it('should be possible to add schema', function(done) {
//     var registrar = Registrar.deployed();
//     var registry = Registry.deployed();
//     registrar.add(accounts[0], "").then(function() {
//     }).then(function() {
//       return registry.configure(registrar.address);
//     }).then(function() {
//       return registry.addSchema('test');
//     }).then(function() {
//       return registry.schemas.call(1);
//     }).then(function(result) {
//       assert.equal(result, 'test');
//     }).then(done).catch(done);
//   });
//   it('should be possible to register Thing', function(done) {
//     var registrar = Registrar.deployed();
//     var registry = Registry.deployed();
//     registrar.add(accounts[0], "").then(function() {
//     }).then(function() {
//       return registry.configure(registrar.address);
//     }).then(function() {
//       return registry.addSchema('test');
//     }).then(function() {
//       return registry.create(1, ['0x0012340000000000000000000000000000000000000000000000000000000000'], ['0x1234']);
//     }).then(function() {
//       return registry.getThing.call('0x1234');
//     }).then(function(result) {
//       assert.equal(result[1][0], '0x0012340000000000000000000000000000000000000000000000000000000000');
//     }).then(done).catch(done);
//   });
//   it('should prohibit to register Thing for unknown schema');
//   it('should be possible to batch-register Thing', function(done) {
//     var registrar = Registrar.deployed();
//     var registry = Registry.deployed();
//     registrar.add(accounts[0], "").then(function() {
//     }).then(function() {
//       return registry.configure(registrar.address);
//     }).then(function() {
//       return registry.addSchema('test');
//     }).then(function() {
//       return registry.createMany(1, [1, 1], ['0x0012340000000000000000000000000000000000000000000000000000000000', '0x0091230000000000000000000000000000000000000000000000000000000000'], ['0x1234', '0x4321']);
//     }).then(function() {
//       return registry.getThing.call('0x4321');
//     }).then(function(result) {
//       assert.equal(result[1][0], '0x0091230000000000000000000000000000000000000000000000000000000000');
//     }).then(done).catch(done);
//   });
// });
