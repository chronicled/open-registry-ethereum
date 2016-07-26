// Set testrpc --gasLimit=3700000, so contract can be deployed

contract('Registry', {reset_state: true}, function(accounts) {
    var eventsHelper = require('../truffle-helpers/eventsHelper.js');
    // Todo: replace to utils component when deployed
    var UtilURN = require('../../open-registry-utils/lib/urn.js');
    var packURN = UtilURN.packer.encodeAndChunk.bind(UtilURN.packer);
    var unpackURN = UtilURN.packer.decode.bind(UtilURN.packer);
    var randNum = function(upTo) {return Math.floor(Math.random() * upTo)};
    var randId = function() {return ('00000000' + randNum(100000000000000000)).slice(-18)}

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

    var thingData = ["0x1200000000000000000000000000000000000000000000000000000000000000","0x1400000000000000000000000000000000000000000000000000000000000000"];

    it('Basic workflow', function(done) {
      var registrar = Registrar.deployed();
      var registry = Registry.deployed();

      eventsHelper.setupEvents(registry);
      var createdEvent = registry.Created();
      var updatedEvent = registry.Updated();
      var deletedEvent = registry.Deleted();
      var errorEvent = registry.Error();


      var chunkedIds = UtilURN.packer.encodeAndChunk(ids);
      var createThingParams = [chunkedIds, thingData, 1];
      var schemaContent = "Schema";

      var lookUpId = ids[randNum(ids.length)];

      var shared = {};

      registry.configure(registrar.address).then(function(txHash) {
        assert.notEqual(txHash, null);

        // Add Schema
        // Todo: pass real schema
        return registry.createSchema(schemaContent);
      }).then(function(txHash) {
        assert.notEqual(txHash, null);

        // Add Registrant
        return registrar.add(accounts[0], "");
      }).then(function(txHash){
          assert.notEqual(txHash, null);
          // Check return value
          return registry.createThing.call.apply(null, createThingParams);
      }).then(function(result) {
        assert.equal(result, true);

        // Creating Thing through transaction
        return registry.createThing.apply(null, createThingParams);
      }).then(function(txHash) {
        // Transaction should succeed
        assert.notEqual(txHash, null);

        // Created Event should be generated
        return eventsHelper.getEvents(txHash, createdEvent);
      }).then(function(events) {
        var eventParams = events[0].args;
        // Same Ids as provided
        assert.deepEqual(eventParams.ids, chunkedIds);

        // Can add Identity using any of the previously added IDs as parameter
        return registry.addIdentities.call(packURN(lookUpId), packURN(newId));
      }).then(function(result) {
        assert.equal(result, true);

        // Can add Identity to existing Thing.
        return registry.addIdentities(packURN(lookUpId), packURN(newId));
      }).then(function(txHash) {
        assert.notEqual(txHash, null);
        // Verify Updated event
        return eventsHelper.getEvents(txHash, updatedEvent);
      }).then(function(events) {
        assert.deepEqual(events[0].args.ids, packURN(lookUpId));

        // Can lookup Thing by any of the IDs
        return new Promise(function(resolve, reject) {
          var liveCalls = 0;
          var currentIds = ids.concat(newId);
          currentIds.forEach(function(id) {
            liveCalls++;
            registry.getThing.call(packURN(id)).then(function(thing) {
              assert.deepEqual(thing[0], packURN(currentIds));
              // Is data equal to original
              assert.deepEqual(thing[1], thingData);
              assert.equal(thing[3], schemaContent);

              if (--liveCalls == 0) resolve();
            });
          });
        });
      }).then(function() {

        // Check maximum possible Identity schema length, with really big identity
        shared.maxId = Array(256).join('s') + ":" + Array(3500 * 2 + 1).join('f');
        return registry.createThing(packURN(shared.maxId), ["0x1","0x2"], 1);
      }).then(function(txHash) {
        assert.notEqual(txHash, null);
        // Created Event contains whole id
        return eventsHelper.getEvents(txHash, createdEvent);
      }).then(function(events) {
        assert.deepEqual(events[0].args.ids, packURN(shared.maxId));

        // Duplication is prevented. Total
        return registry.createThing.apply(null, createThingParams);
      }).then(function(txHash) {
        assert.notEqual(txHash, null);
        return eventsHelper.getEvents(txHash, errorEvent);
      }).then(function(events) {
        var args = events[0].args;
        assert.equal(args.code, 1);
        assert.deepEqual(args.reference, chunkedIds);

        // Duplication is prevented. Overlapping
        var params = createThingParams;
        shared.overlappingIds = packURN(['sn:' + randId(), 'isbn:' + randId(), ids[randNum(ids.length)]]);
        params[0] = shared.overlappingIds;
        return registry.createThing.apply(null, params);
      }).then(function(txHash) {
        assert.notEqual(txHash, null);
        return eventsHelper.getEvents(txHash, errorEvent);
      }).then(function(events) {
        var args = events[0].args;
        assert.equal(args.code, 1);
        assert.deepEqual(args.reference, shared.overlappingIds);


        // Can delete record, all others are still accessible
        return registry.deleteThing(packURN(ids[randNum(ids.length)]));
      }).then(function(txHash) {
        assert.notEqual(txHash, null);

        // - Deleted Event is generated
        return eventsHelper.getEvents(txHash, deletedEvent);
      }).then(function(events) {
        var event = events[0];
        assert.equal(event.event, 'Deleted');
        assert.deepEqual(event.args.ids, packURN(ids.concat(newId)));

        return new Promise(function(resolve, reject) {
          var liveCalls = 0;
          var currentIds = ids.concat(newId);
          currentIds.forEach(function(id) {
            liveCalls++;
            registry.thingExist.call(packURN(id)).then(function(thing) {
              assert.equal(thing, false);

              if (--liveCalls == 0) resolve();
            });
          });
        });
      }).then(function() {

        // Can create multiple Things in one call
        shared.multiRandId = 'custom:' + randId();
        return registry.createThings(
          packURN(ids.concat(newId).concat(shared.multiRandId)), // ids
          [2,2,1], // ids per Thing
          ["0x1","0x2","0x3","0x4","0x5","0x6","0x7"], // data
          [2,1,3],// data cells per Thing
          1// Schema
        );
      }).then(function(txHash) {
        assert.notEqual(txHash, null);

        return eventsHelper.getEvents(txHash, createdEvent);
      }).then(function(events) {
        // Check all events
        assert.deepEqual(events[0].args.ids, packURN(ids.slice(0,2)));
        assert.deepEqual(events[1].args.ids, packURN(ids.slice(-1).concat(newId)));
        assert.deepEqual(events[2].args.ids, packURN(shared.multiRandId));

        // Todo try access all the created Things
        done();
      }).catch(console.log);

    });


    // Todo:
    // All identities of deleted item is inaccessible
    // Can create Thing with previously deleted Identity.
    // Others cannot delete my records
    // All the edge cases




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

  describe('Creating', function() {
    it('Creating Thing', function(done) {
      var registry = Registry.deployed();
      var registrar = Registrar.deployed();

      var chunkedIds = UtilURN.packer.encodeAndChunk(ids);
      var params = [chunkedIds, ["0x1","0x2"], 1];

      var selection;
      // Check method return value
      registry.configure(registrar.address).then(function(txHash) {
        return registry.createSchema('This is a test');
      }).then(function(txHash) {
        return registrar.add(accounts[0], "");
      }).then(function(txHash) {
        return registry.createThing.call.apply(null, params);
      }).then(function(result) {
        assert.equal(result, true);
        return registry.createThing.apply(null, params);
      }).then(function(txHash) {
        return registry.getThingByIndexDEBUG.call(1);
      }).then(function(res) {
        selection = packURN(ids[randNum(ids.length)])
        return registry.addIdentities.call(selection, packURN(newId));
      }).then(function(result) {
        assert.equal(result, true);
        return registry.addIdentities(selection, packURN(newId));
      }).then(function(txHash) {
        assert.notEqual(txHash, null);
        return registry.getThingByIndexDEBUG.call(1);
      }).then(function(res) {
        assert(chunkedIds.length < res[0].length);
        return done();
      }).catch(console.log);
    });

    it('Creating Thing Failure: Schema index out of range', function(done) {
      var registry = Registry.deployed();
      var registrar = Registrar.deployed();

      var chunkedIds = UtilURN.packer.encodeAndChunk(ids);
      var params = [chunkedIds, ["0x1","0x2"], 3];

      var selection;
      // Check method return value
      // 
      registry.configure(registrar.address).then(function(txHash) {
        return registry.createSchema('This is a test');
      }).then(function(txHash) {
        return registrar.add(accounts[0], "");
      }).then(function() {
        return registry.createThing.call.apply(null, params)
      }).then(function(result) {
        assert.equal(result, false);
        return;
      }).then(function() {
        done();
      }).catch(done);
    });

    it('Creating Things', function(done) {
      var registry = Registry.deployed();
      var registrar = Registrar.deployed();

      var ids1 = [
        "pbk:ec:secp256r1:0260fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29f00",
        "ble:1.0:0a153c993d00",
        "pbk:rsa:2048:8c33d1bafbb20a80f0f95ac8cb9f060d39b5744790aa7d96cd2977398257b2ac1396aebb62182c5c6f8a8527e62af27e8853187e1d7962f0ef030129bc334e8471b4352c594c8b413835f882779038a56f44c9a4d189f8e0702087ee04a50a1e84f52443c48c3176be3be17509bf142477e5eeeaf4a41dd87e9b6ca5cea62342dc0e08ae5ab701a4016bd723113a0cd3cf0be5b472f23355981be5191c6c84429cc4bb4270d18bb923ca373a0950d74b83545bf40d9283b3a2cbe0173ee224c155d8615de38cb58cb5e23f30b7edf4be2ccd7a30184aa700ffcbf1f31ea9ef1961b89bc58bc6d4749099fa0a5503fd6e5cbdd42357002be28564663b305fd600",
      ];

      var ids2 = [
        "pbk:ec:secp256r1:0260fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29f01",
        "ble:1.0:0a153c993d01",
        "pbk:rsa:2048:8c33d1bafbb20a80f0f95ac8cb9f060d39b5744790aa7d96cd2977398257b2ac1396aebb62182c5c6f8a8527e62af27e8853187e1d7962f0ef030129bc334e8471b4352c594c8b413835f882779038a56f44c9a4d189f8e0702087ee04a50a1e84f52443c48c3176be3be17509bf142477e5eeeaf4a41dd87e9b6ca5cea62342dc0e08ae5ab701a4016bd723113a0cd3cf0be5b472f23355981be5191c6c84429cc4bb4270d18bb923ca373a0950d74b83545bf40d9283b3a2cbe0173ee224c155d8615de38cb58cb5e23f30b7edf4be2ccd7a30184aa700ffcbf1f31ea9ef1961b89bc58bc6d4749099fa0a5503fd6e5cbdd42357002be28564663b305fd601",
      ];

      var ids3 = [
        "pbk:ec:secp256r1:0260fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29f02",
        "ble:1.0:0a153c993d02",
        "pbk:rsa:2048:8c33d1bafbb20a80f0f95ac8cb9f060d39b5744790aa7d96cd2977398257b2ac1396aebb62182c5c6f8a8527e62af27e8853187e1d7962f0ef030129bc334e8471b4352c594c8b413835f882779038a56f44c9a4d189f8e0702087ee04a50a1e84f52443c48c3176be3be17509bf142477e5eeeaf4a41dd87e9b6ca5cea62342dc0e08ae5ab701a4016bd723113a0cd3cf0be5b472f23355981be5191c6c84429cc4bb4270d18bb923ca373a0950d74b83545bf40d9283b3a2cbe0173ee224c155d8615de38cb58cb5e23f30b7edf4be2ccd7a30184aa700ffcbf1f31ea9ef1961b89bc58bc6d4749099fa0a5503fd6e5cbdd42357002be28564663b305fd602",
      ];

      var batch_ids = [
        ids[0], ids[1], ids[2],
        ids1[0], ids1[1], ids1[2],
        ids2[0], ids2[1], ids2[2],
        ids3[0], ids3[1], ids3[2]
      ];
      var ids_count = [
        3, 
        3
        // 3, 
        // 3
      ];
      var data_array = [
        "0x1", "0x2", 
        "0x3", "0x4",
        "0x5", "0x6", 
        "0x7", "0x8"
      ];
      var data_lengths = [
        2, 
        2,
        2, 
        2
      ];

      var chunkedIds = UtilURN.packer.encodeAndChunk(batch_ids);
      var batch = [chunkedIds, ids_count, data_array, data_lengths, 1];
      registry.configure(registrar.address).then(function(txHash) {
        return registry.createSchema('This is a test');
      }).then(function(txHash) {
        return registrar.add(accounts[0], "");
      }).then(function() {
        return registry.createThings.apply(null, batch);  
      }).then(function(result) {
        return registry.getThing(packURN(ids[0]));
      }).then(function(thing) {
        assert(thing);
        console.log(thing);
        return;
      }).then(function() {
        done();
      }).catch(done);
    });
  });

  describe('Updating', function() {
    it('Updating Thing Data', function(done) {
      var registry = Registry.deployed();
      var registrar = Registrar.deployed();

      var chunkedIds = UtilURN.packer.encodeAndChunk(ids);
      var params = [chunkedIds, ["0x1","0x2"], 1];

      var selection;
      // Check method return value
      
      registry.configure(registrar.address).then(function(txHash) {
        return registry.createSchema('This is a test');
      }).then(function(txHash) {
        return registrar.add(accounts[0], "");
      }).then(function() {
        return registry.createThing.apply(null, params);
      }).then(function(txHash) {
        selection = packURN(ids[randNum(ids.length)]);
        return registry.addIdentities(selection, packURN(newId));
      }).then(function(txHash) {
        return registry.updateThingData.call(selection, ['0x09128049214'], 1);
      }).then(function(result) {
        assert.equal(result, true);
        return registry.updateThingData(selection, ['0x09128049214'], 1);
      }).then(function(txHash) {
        assert.notEqual(txHash, null);
        return registry.getThingByIndexDEBUG.call(1);
      }).then(function(res) {
        assert.equal(res[1].length, 1);
        assert.equal(res[2].toNumber(), 1);
        return;
      }).then(function() {
        done();
      }).catch(done);
    });

    it('Update Thing Data with new identity', function(done) {
      var registry = Registry.deployed();
      var registrar = Registrar.deployed();

      var chunkedIds = UtilURN.packer.encodeAndChunk(ids);
      var params = [chunkedIds, ["0x1","0x2"], 1];

      var selection;

      registry.configure(registrar.address).then(function(txHash) {
        return registry.createSchema('This is a test');
      }).then(function(txHash) {
        return registrar.add(accounts[0], "");
      }).then(function() {
        return registry.createThing.apply(null, params);
      }).then(function(txHash) {
        selection = packURN(ids[randNum(ids.length)]);
        return registry.addIdentities(selection, packURN(newId));
      }).then(function(txHash) {
        return registry.updateThingData.call(packURN(newId), ['0xDEADBEEF'], 1);
      }).then(function(result) {
        assert.equal(result, true);
        return registry.updateThingData(packURN(newId), ['0xdeadbeef'], 1);
      }).then(function(txHash) {
        assert.notEqual(txHash, null);
        return registry.getThingByIndexDEBUG.call(1);
      }).then(function(res) {
        assert(res[0].length > chunkedIds.length);
        assert.equal(res[1].length, 1);
        assert.equal(res[1][0], '0xdeadbeef'.concat(Array(57).join('0')))
        assert.equal(res[2].toNumber(), 1);
        return;
      }).then(function() {
        done();
      }).catch(done);
    })

    it('Updating Thing Failure: Schema index out of range', function(done) {
      var registry = Registry.deployed();
      var registrar = Registrar.deployed();

      var chunkedIds = UtilURN.packer.encodeAndChunk(ids);
      var params = [chunkedIds, ["0x1","0x2"], 1];

      var selection;
      // Check method return value
      
      registry.configure(registrar.address).then(function(txHash) {
        return registry.createSchema('This is a test');
      }).then(function(txHash) {
        return registrar.add(accounts[0], "");
      }).then(function() {
        return registry.createThing.apply(null, params);
      }).then(function(txHash) {
        selection = packURN(ids[randNum(ids.length)]);
        return registry.addIdentities(selection, packURN(newId));
      }).then(function(txHash) {
        return registry.updateThingData.call(selection, ['0x09128049214'], 5);
      }).then(function(result) {
        assert.equal(result, false);
        return;
      }).then(function() {
        done();
      }).catch(done);
    });
  });

  describe('Deleting', function() {
    it ('Deleting Thing', function(done) {
      var registry = Registry.deployed();
      var registrar = Registrar.deployed();

      var chunkedIds = UtilURN.packer.encodeAndChunk(ids);
      var params = [chunkedIds, ["0x1","0x2"], 1];

      var selection;
      // Check method return value
      
      registry.configure(registrar.address).then(function(txHash) {
        return registry.createSchema('This is a test');
      }).then(function(txHash) {
        return registrar.add(accounts[0], "");
      }).then(function() {
        registry.createThing.apply(null, params);
      }).then(function(txHash) {
        selection = packURN(ids[randNum(ids.length)]);
        return registry.getThing.call(selection);
      }).then(function(result) {
        assert(result[0].length > 0);
        return registry.deleteThing.call(selection);
      }).then(function(result) {
        assert.equal(result, true);
        return registry.deleteThing(selection);
      }).then(function(txHash) {
        return registry.getThing.call(selection);
      }).then(function(result) {
        assert.equal(result[0].length, 0);
        return;
      }).then(function() {
        done();
      }).catch(done);
    });

    it ('Deleting Thing Failure: Not owner of Thing', function(done) {
      var registry = Registry.deployed();
      var registrar = Registrar.deployed();

      var chunkedIds = UtilURN.packer.encodeAndChunk(ids);
      var params = [chunkedIds, ["0x1","0x2"], 1];

      var selection;
      // Check method return value
      

      registry.configure(registrar.address).then(function(txHash) {
        return registry.createSchema('This is a test');
      }).then(function(txHash) {
        return registrar.add(accounts[0], "");
      }).then(function() {
        registry.createThing.apply(null, params);
      }).then(function(txHash) {
        selection = packURN(ids[randNum(ids.length)]);
        return registry.getThing.call(selection);
      }).then(function(result) {
        assert(result[0].length > 0);
        return registry.deleteThing.call(selection, {from: accounts[1]});
      }).then(function(result) {
        assert.equal(result, false);
        return registry.deleteThing(selection, {from: accounts[1]});
      }).then(function(txHash) {
        return registry.getThing.call(selection);
      }).then(function(thing) {
        assert(thing);
        return;
      }).then(function() {
        done();
      }).catch(done);
    });
  });
});
