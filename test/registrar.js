// Copyright (c) 2016 Chronicled, Inc. All rights reserved.

'use strict';

var eventsHelper = require('../truffle-helpers/eventsHelper.js');

contract('Registrar', function(accounts) {
  var registrar;

  var createdEvent;
  var updatedEvent;
  var errorEvent;

  it('Should not allow to add Regitrant to non-Registrar', function(done) {
    var registrar = Registrar.deployed();

    eventsHelper.setupEvents(registrar);
    createdEvent = registrar.Created();
    updatedEvent = registrar.Updated();
    errorEvent = registrar.Error();

    registrar.add(accounts[1], '0x0001', {from: accounts[1]})
    .then(function(txHash) {
      return eventsHelper.getEvents(txHash, errorEvent);
    }).then(function(events) {
      var eventParams = events[0].args;
      assert(eventParams.code.equals(1));
      // Same Ids as provided
      done();
    });

  });
});

contract('Registrar', {reset_state: true}, function(accounts) {
  it('should be possible to add registrant', function(done) {
    var registrar = Registrar.deployed();
    var data = "0x" + (Array(1025).join('af'));
    registrar.add(accounts[1], data).then(function() {
      return registrar.registrants.call(1);
    }).then(function(result) {
      assert.equal(result[1], data);
      assert.equal(result[0], accounts[1]);
    }).then(done).catch(done);
  });
  it('should be possible to add multiple registrants', function(done) {
    var registrar = Registrar.deployed();
    registrar.add(accounts[1], "").then(function() {
    }).then(function() {
      return registrar.add(accounts[2], "");
    }).then(function() {
      return registrar.getRegistrants.call();
    }).then(function(result) {
      assert.equal(result.length, 2);
    }).then(done).catch(done);
  });
  it('should allow to disable registrants', function(done) {
    var registrar = Registrar.deployed();
    registrar.add(accounts[1], "").then(function() {
    }).then(function() {
      return registrar.add(accounts[2], "");
    }).then(function() {
      return registrar.edit(accounts[2], "", false);
    }).then(function() {
      return registrar.registrants.call(1);
    }).then(function(result) {
      assert.isTrue(result[2]);
      return registrar.registrants.call(2);
    }).then(function(result) {
      assert.isFalse(result[2]);
    }).then(done).catch(done);
  });
  it('should allow to get list of registrants', function(done) {
    var registrar = Registrar.deployed();
    registrar.add(accounts[1], "").then(function() {
    }).then(function() {
      return registrar.add(accounts[2], "");
    }).then(function() {
      return registrar.edit(accounts[2], "", false);
    }).then(function() {
      return registrar.getRegistrants.call();
    }).then(function(result) {
      assert.equal(result.length, 2);
    }).then(done).catch(done);
  });
});

contract('Registrar', function(accounts) {
  var UtilURN = require('open-registry-utils').urn;
  var packURN = UtilURN.packer.encodeAndChunk.bind(UtilURN.packer);
  var unpackURN = UtilURN.packer.decode.bind(UtilURN.packer);
  var randNum = function(upTo) {return Math.floor(Math.random() * upTo)};
  var randId = function() {return ('00000000' + randNum(100000000000000000)).slice(-18)}

  var schemaContent = "message Thing {" +
                      "required string service_url = 1;" +
                      "}";
  var schemaContentHex = '0x' + toHex(schemaContent);

  var ids = [
    "pbk:ec:secp256r1:0260fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29fb6",
    "ble:1.0:0a153c993d9c"
  ];

  var thingData = [
    "0x1200000000000000000000000000000000000000000000000000000000000000",
    "0x1400000000000000000000000000000000000000000000000000000000000000"
  ];

  var newIds = [
    "pbk:rsa:2048:8c33d1bafbb20a80f0f95ac8cb9f060d39b5744790aa7d96cd2977398257b2ac1396aebb62182c5c6f8a8527e62af27e8853187e1d7962f0ef030129bc334e8471b4352c594c8b413835f882779038a56f44c9a4d189f8e0702087ee04a50a1e84f52443c48c3176be3be17509bf142477e5eeeaf4a41dd87e9b6ca5cea62342dc0e08ae5ab701a4016bd723113a0cd3cf0be5b472f23355981be5191c6c84429cc4bb4270d18bb923ca373a0950d74b83545bf40d9283b3a2cbe0173ee224c155d8615de38cb58cb5e23f30b7edf4be2ccd7a30184aa700ffcbf1f31ea9ef1961b89bc58bc6d4749099fa0a5503fd6e5cbdd42357002be28564663b305fd6db",
    "nfc:1.0:20153c913d9c4a"
  ];

  var newThingData = [
    "0x1500000000000000000000000000000000000000000000000000000000000000",
    "0x1600000000000000000000000000000000000000000000000000000000000000"
  ];

  var chunkedIds = UtilURN.packer.encodeAndChunk(ids);
  var createThingParams = [chunkedIds, thingData, 0];
  var lookUpId = ids[randNum(ids.length)];

  var newChunkedIds = UtilURN.packer.encodeAndChunk(newIds);
  var newCreateThingParams = [newChunkedIds, newThingData, 0];
  var newLookUpId = ids[randNum(newIds.length)];

  it('should add a new registrant and configure the registrar', function(done) {
    var registrar = Registrar.deployed();
    var registry = Registry.deployed();

    return registrar.add(accounts[1], '')
    .then(function(txHash) {
      assert.notEqual(txHash, null);
      return registry.configure(registrar.address, {from: accounts[0]});
    })
    .then(function(txHash) {
      assert.notEqual(txHash, null);
      done();
    })
    .catch(done);
  });

  it('should allow new registrant to add a thing', function(done) {
    var registrar = Registrar.deployed();
    var registry = Registry.deployed();

    return registry.createStandardSchema('Name', 'Descr', '')
    .then(function(txHash) {
      assert.notEqual(txHash, null);
      return registry.createSchema('Name', 'Descr', schemaContent, {from: accounts[1]});
    }).then(function(txHash) {
      assert.notEqual(txHash, null);
      return registry.createThing(createThingParams[0], createThingParams[1], createThingParams[2], {from: accounts[1]});
    })
    .then(function(txHash) {
      assert.notEqual(txHash, null);
      done();
    })
    .catch(done);
  });

  it('should allow registrant to add new identities to created thing', function(done) {
    var registrar = Registrar.deployed();
    var registry = Registry.deployed();

    return registry.addIdentities.call(packURN(lookUpId), packURN(newIds[1]), {from: accounts[1]})
    .then(function(result) {
      assert(result);
      done();
    })
    .catch(done);
  });

  it('should allow registrant to update identities to created thing', function(done) {
    var registrar = Registrar.deployed();
    var registry = Registry.deployed();

    return registry.updateThingData.call(packURN(lookUpId), newIds, 0, {from: accounts[1]})
    .then(function(result) {
      assert(result);
      done();
    })
    .catch(done);
  });

  it('should remove the registrant and prevent new thing creations', function(done) {
    var registrar = Registrar.deployed();
    var registry = Registry.deployed();

    return registrar.edit.call(accounts[1], '', false)
    .then(function(result) {
      assert(result);
      return registrar.edit(accounts[1], '', false);
    })
    .then(function(txHash) {
      assert.notEqual(txHash, null);
      return registry.createThing.call(newCreateThingParams[0], newCreateThingParams[1], newCreateThingParams[2], {from: accounts[1]});
    })
    .then(function(result) {
      assert(!result);
      done();
    })
    .catch(done);
  });

  it('should not allow registrant to add new identities to created thing', function(done) {
    var registrar = Registrar.deployed();
    var registry = Registry.deployed();

    return registry.addIdentities.call(packURN(lookUpId), packURN(newIds[1]), {from: accounts[1]})
    .then(function(result) {
      assert(!result);
      done();
    })
    .catch(done);
  });

  it('should not allow registrant to update identities to created thing', function(done) {
    var registrar = Registrar.deployed();
    var registry = Registry.deployed();

    return registry.updateThingData.call(packURN(lookUpId), newIds, 1, {from: accounts[1]})
    .then(function(result) {
      assert(!result);
      done();
    })
    .catch(done);
  }); 

  it('should allow the registrant to be re-added through an edit and not an add op', function(done) {
    var registrar = Registrar.deployed();
    var registry = Registry.deployed();

    return registrar.add.call(accounts[1], '')
    .then(function(result) {
      assert(!result);
      return registrar.edit.call(accounts[1], '', true);
    })
    .then(function(result) {
      assert(result);
      return registrar.edit(accounts[1], '', true);
    })
    .then(function(txHash) {
      assert.notEqual(txHash, null);
      return registry.createThing.call(newCreateThingParams[0], newCreateThingParams[1], newCreateThingParams[2], {from: accounts[1]});
    })
    .then(function(result) {
      assert(result);
      done();
    })
    .catch(done);
  });

  it('should set the next registrar and prevent old registrar from performing any action', function(done) {
    var registrar = Registrar.deployed();
    var registry = Registry.deployed();

    return registrar.setNextRegistrar.call(accounts[1], {from: accounts[0]})
    .then(function(result) {
      assert(result);
      return registrar.setNextRegistrar(accounts[1], {from: accounts[0]});
    })
    .then(function(txHash) {
      assert.notEqual(txHash, null);
      return registrar.add.call(accounts[2], '', {from: accounts[0]});
    })
    .then(function(result) {
      assert(!result);
      return registry.createThing.call(newCreateThingParams[0], newCreateThingParams[1], newCreateThingParams[2], {from: accounts[0]});
    })
    .then(function(result) {
      assert(!result);
      done();
    })
    .catch(done);
  });

  it('should allow new registrar to add new registrant', function(done) {
    var registrar = Registrar.deployed();
    var registry = Registry.deployed();

    return registrar.add.call(accounts[0], '', {from: accounts[1]})
    .then(function(result) {
      assert(result);
      return registrar.add(accounts[0], '', {from: accounts[1]});
    })
    .then(function(txHash) {
      assert.notEqual(txHash, null);
      return registry.createThing.call(newCreateThingParams[0], newCreateThingParams[1], newCreateThingParams[2], {from: accounts[0]});
    })
    .then(function(result) {
      assert(result);
      return registry.createThing(newCreateThingParams[0], newCreateThingParams[1], newCreateThingParams[2], {from: accounts[0]});
    })
    .then(function(txHash) {
      assert.notEqual(txHash, null);
      done();
    })
    .catch(done);
  });

  it('should fail to edit a registrant that doesn\'t exist', function(done) {
    var registrar = Registrar.deployed();

    return registrar.edit.call(accounts[2], '', false, {from: accounts[1]})
    .then(function(result) {
      assert(!result);
      done();
    })
    .catch(done);
  });

  it('should add a new registrant and then remove that registrant', function(done) {
    var registrar = Registrar.deployed();
    
    return registrar.isActiveRegistrant.call(accounts[1])
    .then(function(result) {
      assert(result);
      return registrar.edit(accounts[1], '', false, {from: accounts[1]});
    })
    .then(function(txHash) {
      assert.notEqual(txHash, null);
      return registrar.isActiveRegistrant(accounts[1]);
    })
    .then(function(result) {
      assert(!result);
      return registrar.add.call(accounts[1], '', {from: accounts[1]});
    })
    .then(function(result) {
      assert(!result);
      return registrar.edit(accounts[1], '', true, {from: accounts[1]});
    })
    .then(function(txHash) {
      assert.notEqual(txHash, null);
      return registrar.isActiveRegistrant(accounts[1]);
    })
    .then(function(result) {
      assert(result);
      done();
    })
    .catch(done);
  });

  it('should assert the number of registrants updates correctly', function(done) {
    var registrar = Registrar.deployed();

    return registrar.getRegistrants()
    .then(function(registrants) {
      assert(registrants.length === 2);
      return registrar.add(accounts[2], '', {from: accounts[1]});
    })
    .then(function(txHash) {
      assert.notEqual(txHash, null);
      return registrar.getRegistrants();
    })
    .then(function(registrants) {
      assert(registrants.length === 3);
      return registrar.add(accounts[3], '', {from: accounts[1]});
    })
    .then(function(txHash) {
      assert.notEqual(txHash, null);
      return registrar.getRegistrants();
    })
    .then(function(registrants) {
      assert(registrants.length === 4);
      return registrar.add(accounts[4], '', {from: accounts[1]});
    })
    .then(function(txHash) {
      assert.notEqual(txHash, null);
      return registrar.getRegistrants();
    })
    .then(function(registrants) {
      assert(registrants.length === 5);
      return registrar.add(accounts[5], '', {from: accounts[1]});
    })
    .then(function(txHash) {
      assert.notEqual(txHash, null);
      return registrar.getRegistrants();
    })
    .then(function(registrants) {
      assert(registrants.length === 6);
      done();
    })     
    .catch(done);
  });

  it('should not all other users to discontinue the registrar', function(done) {
    var registrar = Registrar.deployed();

    return registrar.discontinue({from: accounts[0]})
    .then(function(txHash) {
      assert.notEqual(txHash, null);
      return registrar.setNextRegistrar(accounts[0], {from: accounts[1]});
    })
    .then(function(txHash) {
      assert.notEqual(txHash, null);
      done();
    })
    .catch(done);
  });

  it('should discontinue the registrar from the current registrar', function(done) {
    var registrar = Registrar.deployed();

    return registrar.discontinue({from: accounts[0]})
    .then(function(txHash) {
      assert.notEqual(txHash);
      return registrar.isActiveRegistrant(accounts[0]);
    })
    .then(function(result) {
      assert(!result);
      return registrar.getRegistrants();
    })
    .then(function(registrants) {
      assert.equal(registrants.length, 0);
      done();
    })
    .catch(done);
  });
});

contract('Registrar', {reset_state: true}, function(accounts) {
  it('should not be possible to send value to contract', function(done) {
    return Registrar.new({from: accounts[0], value: 1000})
    .then(function(contract) {
      return contract.add(accounts[1], '', {from: accounts[0], value: 1});
    })
    .then(function(result) {
      done();
    })
    .catch(function(err) {
      var error = err.toString().split('\n')[0];
      assert.equal(error, 'Error: Error: VM Exception while executing transaction: invalid JUMP');      
      done();
    });
  });
});

function toHex(str) {
  var result = '';
  for (var i=0; i<str.length; i++) {
    result += str.charCodeAt(i).toString(16);
  }
  return result;
}
