contract('MultiAccess', {reset_state: true}, function(accounts) {
  var eventsHelper = require('../truffle-helpers/eventsHelper.js');
  var multiAccess = undefined;

  beforeEach(function(done) {
    multiAccess = MultiAccessTestable.deployed();
    done();
  });

  it('should deploy and have all nececcary getters', function(done) {
    multiAccess.multiAccessRequired.call().then(function(required) {
      assert.equal(required.valueOf(), 1);
      return multiAccess.multiAccessOwners.call(0);
    }).then(function(owner0) {
      assert.equal(owner0, 0);
      return multiAccess.multiAccessOwners.call(1);
    }).then(function(owner1) {
      assert.equal(owner1, accounts[0]);
      return multiAccess.multiAccessIsOwner.call(accounts[0]);
    }).then(function(result) {
      assert.isTrue(result);
    }).then(done).catch(done);
  });
  it('should be possible to set recipient with single owner', function(done) {
    var multiAccessTester = MultiAccessTester.deployed();
    multiAccessTester.calls.call().then(function(calls) {
      assert.equal(calls.valueOf(), 0);
      return multiAccess.multiAccessSetRecipient(multiAccessTester.address);
    }).then(function() {
      return multiAccess.callTester();
    }).then(function() {
      return multiAccessTester.calls.call();
    }).then(function(calls) {
      assert.equal(calls.valueOf(), 1);
    }).then(done).catch(done);
  });
  it('should be possible to set recipient with multiple owners', function(done) {
    var multiAccessTester = MultiAccessTester.deployed();
    var newOwner = accounts[1];
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessChangeRequirement(2);
    }).then(function() {
      return multiAccess.multiAccessSetRecipient(multiAccessTester.address);
    }).then(function() {
      return multiAccess.callTester();
    }).then(function() {
      return multiAccessTester.calls.call();
    }).then(function(calls) {
      assert.equal(calls.valueOf(), 0);
      return multiAccess.multiAccessSetRecipient(multiAccessTester.address, {from: newOwner});
    }).then(function() {
      return multiAccess.callTester();
    }).then(function() {
      return multiAccessTester.calls.call();
    }).then(function(calls) {
      assert.equal(calls.valueOf(), 1);
    }).then(done).catch(done);
  });
  it('should clear pending opertaions when setting new recipient', function(done) {
    var multiAccessTester = MultiAccessTester.deployed();
    var newOwner = accounts[1];
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessChangeRecipientRequirement(2);
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(2);
    }).then(function() {
      return multiAccess.multiAccessSetRecipient(multiAccessTester.address);
    }).then(function() {
      return multiAccess.callTester();
    }).then(function() {
      return multiAccess.multiAccessSetRecipient(multiAccessTester.address, {from: newOwner});
    }).then(function() {
      return multiAccess.callTester({from: newOwner});
    }).then(function() {
      return multiAccessTester.calls.call();
    }).then(function(calls) {
      assert.equal(calls.valueOf(), 0);
    }).then(done).catch(done);
  });

  it('should not be possible to remove the only owner', function(done) {
    var owner = accounts[0];
    multiAccess.multiAccessRemoveOwner(owner).then(function() {
      return multiAccess.multiAccessIsOwner.call(owner);
    }).then(function(result) {
      assert.isTrue(result);
    }).then(done).catch(done);
  });
  it('should not be possible to leave less owners than required', function(done) {
    var owner = accounts[0];
    var newOwner = accounts[1];
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessRemoveOwner(newOwner);
    }).then(function() {
      return multiAccess.multiAccessRemoveOwner(owner);
    }).then(function() {
      return multiAccess.multiAccessIsOwner.call(owner);
    }).then(function(result) {
      assert.isTrue(result);
    }).then(done).catch(done);
  });
  it('should be possible to remove last owner', function(done) {
    var watcher = multiAccess.OwnerRemoved();
    var owner = accounts[0];
    var lastOwner = accounts[1];
    multiAccess.multiAccessAddOwner(lastOwner).then(function() {
      eventsHelper.setupEvents(multiAccess);
      return multiAccess.multiAccessRemoveOwner(lastOwner);
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.oldOwner.valueOf(), lastOwner);
      return multiAccess.multiAccessIsOwner.call(owner);
    }).then(function(result) {
      assert.isTrue(result);
      return multiAccess.multiAccessIsOwner.call(lastOwner);
    }).then(function(result) {
      assert.isFalse(result);
    }).then(done).catch(done);
  });
  it('should be possible to remove not last owner', function(done) {
    var notLastOwner = accounts[0];
    var owner = accounts[1];
    multiAccess.multiAccessAddOwner(owner).then(function() {
      return multiAccess.multiAccessRemoveOwner(notLastOwner);
    }).then(function() {
      return multiAccess.multiAccessIsOwner.call(notLastOwner);
    }).then(function(result) {
      assert.isFalse(result);
      return multiAccess.multiAccessIsOwner.call(owner);
    }).then(function(result) {
      assert.isTrue(result);
    }).then(done).catch(done);
  });
  it('should be possible to remove owner with multiple owners', function(done) {
    var owner = accounts[0];
    var owner1 = accounts[1];
    var owner2 = accounts[2];
    multiAccess.multiAccessAddOwner(owner1).then(function() {
      return multiAccess.multiAccessAddOwner(owner2);
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(2);
    }).then(function() {
      return multiAccess.multiAccessRemoveOwner(owner1);
    }).then(function() {
      return multiAccess.multiAccessIsOwner.call(owner1);
    }).then(function(result) {
      assert.isTrue(result);
      return multiAccess.multiAccessRemoveOwner(owner1, {from: owner2});
    }).then(function() {
      return multiAccess.multiAccessIsOwner.call(owner1);
    }).then(function(result) {
      assert.isFalse(result);
      return multiAccess.multiAccessIsOwner.call(owner);
    }).then(function(result) {
      assert.isTrue(result);
      return multiAccess.multiAccessIsOwner.call(owner2);
    }).then(function(result) {
      assert.isTrue(result);
    }).then(done).catch(done);
  });
  it('should clear pending after owner removal', function(done) {
    var owner = accounts[0];
    var pending = accounts[1];
    var owner2 = accounts[2];
    multiAccess.multiAccessAddOwner(pending).then(function() {
      return multiAccess.multiAccessAddOwner(owner2);
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(2);
    }).then(function() {
      return multiAccess.multiAccessRemoveOwner(pending);
    }).then(function() {
      return multiAccess.multiAccessRemoveOwner(accounts[3]);
    }).then(function() {
      return multiAccess.multiAccessRemoveOwner(accounts[4]);
    }).then(function() {
      return multiAccess.multiAccessRemoveOwner(accounts[5]);
    }).then(function() {
      return multiAccess.multiAccessRemoveOwner(accounts[6]);
    }).then(function() {
      return multiAccess.multiAccessRemoveOwner(accounts[7]);
    }).then(function() {
      return multiAccess.multiAccessRemoveOwner(accounts[8]);
    }).then(function() {
      return multiAccess.multiAccessRemoveOwner(owner2);
    }).then(function() {
      return multiAccess.multiAccessRemoveOwner(owner2, {from: owner2});
    }).then(function() {
      return multiAccess.multiAccessRemoveOwner(pending, {from: pending});
    }).then(function() {
      return multiAccess.multiAccessIsOwner.call(pending);
    }).then(function(result) {
      assert.isTrue(result);
    }).then(done).catch(done);
  });

  it('should not be possible to change recipient requirement to 0', function(done) {
    multiAccess.multiAccessChangeRecipientRequirement(0).then(function() {
      return multiAccess.multiAccessRecipientRequired.call();
    }).then(function(required) {
      assert.equal(required.valueOf(), 1);
    }).then(done).catch(done);
  });
  it('should be possible to change recipient requirement to 2 with single owner', function(done) {
    multiAccess.multiAccessChangeRecipientRequirement(2).then(function() {
      return multiAccess.multiAccessRecipientRequired.call();
    }).then(function(required) {
      assert.equal(required.valueOf(), 2);
    }).then(done).catch(done);
  });
  it('should be possible to change recipient requirement from 1 to 1 with single owner', function(done) {
    var watcher = multiAccess.RecipientRequirementChanged();
    eventsHelper.setupEvents(multiAccess);
    multiAccess.multiAccessChangeRecipientRequirement(1).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.newRecipientRequirement.valueOf(), 1);
      return multiAccess.multiAccessRecipientRequired.call();
    }).then(function(required) {
      assert.equal(required.valueOf(), 1);
    }).then(done).catch(done);
  });
  it('should not be possible to change requirement to 0', function(done) {
    multiAccess.multiAccessChangeRequirement(0).then(function() {
      return multiAccess.multiAccessRequired.call();
    }).then(function(required) {
      assert.equal(required.valueOf(), 1);
    }).then(done).catch(done);
  });
  it('should not be possible to change requirement to 2 with single owner', function(done) {
    multiAccess.multiAccessChangeRequirement(2).then(function() {
      return multiAccess.multiAccessRequired.call();
    }).then(function(required) {
      assert.equal(required.valueOf(), 1);
    }).then(done).catch(done);
  });
  it('should not be possible to change requirement to 3 with 2 owners', function(done) {
    var newOwner = accounts[1];
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessChangeRequirement(3);
    }).then(function() {
      return multiAccess.multiAccessRequired.call();
    }).then(function(required) {
      assert.equal(required.valueOf(), 1);
    }).then(done).catch(done);
  });
  it('should not be possible to change requirement to 2 after removing second owner', function(done) {
    var newOwner = accounts[1];
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessRemoveOwner(newOwner);
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(2);
    }).then(function() {
      return multiAccess.multiAccessRequired.call();
    }).then(function(required) {
      assert.equal(required.valueOf(), 1);
    }).then(done).catch(done);
  });
  it('should be possible to change requirement from 1 to 1 with single owner', function(done) {
    var watcher = multiAccess.RequirementChanged();
    eventsHelper.setupEvents(multiAccess);
    multiAccess.multiAccessChangeRequirement(1).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.newRequirement.valueOf(), 1);
      return multiAccess.multiAccessRequired.call();
    }).then(function(required) {
      assert.equal(required.valueOf(), 1);
    }).then(done).catch(done);
  });
  it('should be possible to change requirement with multiple owners', function(done) {
    var newOwner = accounts[1];
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessChangeRequirement(2);
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(1);
    }).then(function() {
      return multiAccess.multiAccessRequired.call();
    }).then(function(required) {
      assert.equal(required.valueOf(), 2);
      return multiAccess.multiAccessChangeRequirement(1, {from: newOwner});
    }).then(function() {
      return multiAccess.multiAccessRequired.call();
    }).then(function(required) {
      assert.equal(required.valueOf(), 1);
    }).then(done).catch(done);
  });
  it('should be possible to change requirement from 1 to 2 with 2 owners', function(done) {
    var watcher = multiAccess.RequirementChanged();
    var newOwner = accounts[1];
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      eventsHelper.setupEvents(multiAccess);
      return multiAccess.multiAccessChangeRequirement(2);
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.newRequirement.valueOf(), 2);
      return multiAccess.multiAccessRequired.call();
    }).then(function(required) {
      assert.equal(required.valueOf(), 2);
    }).then(done).catch(done);
  });
  it('should be possible to change requirement from 2 to 1 with 3 owners', function(done) {
    var newOwner = accounts[1];
    var newOwner2 = accounts[2];
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessChangeRequirement(2);
    }).then(function() {
      return multiAccess.multiAccessAddOwner(newOwner2);
    }).then(function() {
      return multiAccess.multiAccessAddOwner(newOwner2, {from: newOwner});
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(1, {from: newOwner});
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(1);
    }).then(function() {
      return multiAccess.multiAccessRequired.call();
    }).then(function(required) {
      assert.equal(required.valueOf(), 1);
    }).then(done).catch(done);
  });
  it('should be possible to change requirement from 1 to 2 with 3 owners', function(done) {
    var newOwner = accounts[1];
    var newOwner2 = accounts[2];
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessAddOwner(newOwner2);
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(2);
    }).then(function() {
      return multiAccess.multiAccessRequired.call();
    }).then(function(required) {
      assert.equal(required.valueOf(), 2);
    }).then(done).catch(done);
  });
  it('should be possible to change requirement from 2 to 3 with 3 owners', function(done) {
    var newOwner = accounts[1];
    var newOwner2 = accounts[2];
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessAddOwner(newOwner2);
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(2);
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(3);
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(3, {from: newOwner});
    }).then(function() {
      return multiAccess.multiAccessRequired.call();
    }).then(function(required) {
      assert.equal(required.valueOf(), 3);
    }).then(done).catch(done);
  });
  it('should clear pending after requirement change', function(done) {
    var newOwner = accounts[1];
    var newOwner2 = accounts[2];
    var pendingReq = 1;
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessAddOwner(newOwner2);
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(2);
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(3);
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(pendingReq);
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(3, {from: newOwner});
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(pendingReq, {from: newOwner});
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(pendingReq, {from: newOwner2});
    }).then(function() {
      return multiAccess.multiAccessRequired.call();
    }).then(function(required) {
      assert.equal(required.valueOf(), 3);
    }).then(done).catch(done);
  });

  it('should be possible to add new owner with single owner', function(done) {
    var watcher = multiAccess.OwnerAdded();
    var newOwner = accounts[1];
    eventsHelper.setupEvents(multiAccess);
    multiAccess.multiAccessAddOwner(newOwner).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.newOwner.valueOf(), newOwner);
      return multiAccess.multiAccessOwners.call(0);
    }).then(function(emptyOwner) {
      assert.equal(emptyOwner, 0);
      return multiAccess.multiAccessIsOwner.call(accounts[0]);
    }).then(function(result) {
      assert.isTrue(result);
      return multiAccess.multiAccessIsOwner.call(newOwner);
    }).then(function(result) {
      assert.isTrue(result);
    }).then(done).catch(done);
  });
  it('should be possible to add new owner with multiple owners', function(done) {
    var newOwner = accounts[1];
    var newOwner2 = accounts[2];
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessChangeRequirement(2);
    }).then(function() {
      return multiAccess.multiAccessAddOwner(newOwner2);
    }).then(function() {
      return multiAccess.multiAccessIsOwner.call(newOwner2);
    }).then(function(result) {
      assert.isFalse(result);
      return multiAccess.multiAccessAddOwner(newOwner2, {from: newOwner});
    }).then(function() {
      return multiAccess.multiAccessIsOwner.call(newOwner2);
    }).then(function(result) {
      assert.isTrue(result);
    }).then(done).catch(done);
  });
  it('should not be possible to add an existing owner', function(done) {
    var watcher = multiAccess.OwnerAdded();
    var owner = accounts[0];
    eventsHelper.setupEvents(multiAccess);
    multiAccess.multiAccessAddOwner(owner).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 0);
    }).then(done).catch(done);
  });
  it('should not clear pending after new owner added', function(done) {
    var newOwner = accounts[1];
    var newOwner2 = accounts[2];
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessChangeRequirement(2);
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(1);
    }).then(function() {
      return multiAccess.multiAccessAddOwner(newOwner2);
    }).then(function() {
      return multiAccess.multiAccessAddOwner(newOwner2, {from: newOwner});
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(1, {from: newOwner2});
    }).then(function() {
      return multiAccess.multiAccessRequired.call();
    }).then(function(required) {
      assert.equal(required.valueOf(), 1);
    }).then(done).catch(done);
  });

  it('should not be possible to change owner to the existing owner', function(done) {
    var watcher = multiAccess.OwnerChanged();
    var owner1 = accounts[0];
    var owner2 = accounts[1];
    multiAccess.multiAccessAddOwner(owner2).then(function() {
      eventsHelper.setupEvents(multiAccess);
      return multiAccess.multiAccessChangeOwner(owner1, owner2);
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 0);
      return multiAccess.multiAccessIsOwner.call(owner1);
    }).then(function(result) {
      assert.isTrue(result);
    }).then(done).catch(done);
  });
  it('should not be possible to change owner from the non-owner', function(done) {
    var nonOwner = accounts[2];
    var newOwner = accounts[1];
    multiAccess.multiAccessChangeOwner(nonOwner, newOwner).then(function() {
      return multiAccess.multiAccessIsOwner.call(nonOwner);
    }).then(function(result) {
      assert.isFalse(result);
      return multiAccess.multiAccessIsOwner.call(newOwner);
    }).then(function(result) {
      assert.isFalse(result);
    }).then(done).catch(done);
  });
  it('should emit OwnerChanged event', function(done) {
    var watcher = multiAccess.OwnerChanged();
    var owner = accounts[0];
    var newOwner = accounts[1];
    eventsHelper.setupEvents(multiAccess);
    multiAccess.multiAccessChangeOwner(owner, newOwner).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.oldOwner.valueOf(), owner);
      assert.equal(events[0].args.newOwner.valueOf(), newOwner);
    }).then(done).catch(done);
  });
  it('should be possible to change owner with single owner', function(done) {
    var owner = accounts[0];
    var newOwner = accounts[1];
    multiAccess.multiAccessChangeOwner(owner, newOwner).then(function() {
      return multiAccess.multiAccessIsOwner.call(owner);
    }).then(function(result) {
      assert.isFalse(result);
      return multiAccess.multiAccessIsOwner.call(newOwner);
    }).then(function(result) {
      assert.isTrue(result);
    }).then(done).catch(done);
  });
  it('should be possible to change owner with multiple owners', function(done) {
    var owner = accounts[0];
    var owner1 = accounts[1];
    var ownerTo = accounts[2];
    multiAccess.multiAccessAddOwner(owner1).then(function() {
      return multiAccess.multiAccessChangeRequirement(2);
    }).then(function() {
      return multiAccess.multiAccessChangeOwner(owner1, ownerTo);
    }).then(function() {
      return multiAccess.multiAccessIsOwner.call(ownerTo);
    }).then(function(result) {
      assert.isFalse(result);
      return multiAccess.multiAccessChangeOwner(owner1, ownerTo, {from: owner1});
    }).then(function() {
      return multiAccess.multiAccessIsOwner.call(ownerTo);
    }).then(function(result) {
      assert.isTrue(result);
      return multiAccess.multiAccessIsOwner.call(owner1);
    }).then(function(result) {
      assert.isFalse(result);
    }).then(done).catch(done);
  });
  it('should clear pending after owner change', function(done) {
    var owner = accounts[0];
    var pendingFrom = accounts[1];
    var owner2 = accounts[2];
    var pendingTo = accounts[3];
    multiAccess.multiAccessAddOwner(pendingFrom).then(function() {
      return multiAccess.multiAccessChangeRequirement(2);
    }).then(function() {
      return multiAccess.multiAccessChangeOwner(pendingFrom, pendingTo);
    }).then(function() {
      return multiAccess.multiAccessChangeOwner(owner, owner2);
    }).then(function() {
      return multiAccess.multiAccessChangeOwner(owner, owner2, {from: pendingFrom});
    }).then(function() {
      return multiAccess.multiAccessChangeOwner(pendingFrom, pendingTo, {from: pendingFrom});
    }).then(function() {
      return multiAccess.multiAccessIsOwner.call(pendingFrom);
    }).then(function(result) {
      assert.isTrue(result);
      return multiAccess.multiAccessIsOwner.call(pendingTo);
    }).then(function(result) {
      assert.isFalse(result);
    }).then(done).catch(done);
  });

  it('should not be possible to revoke from non-owner address', function(done) {
    var multiAccessTester = MultiAccessTester.deployed();
    var callTester = '0xd0ed7a4dc7b0122d6ec9df8bfd8c6086f4a404b1501918bb29854735bcbdd02d';
    var newOwner = accounts[1];
    var nonOwner = accounts[2];
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessSetRecipient(multiAccessTester.address);
    }).then(function() {
      return multiAccess.multiAccessChangeRecipientRequirement(2);
    }).then(function() {
      return multiAccess.callTester();
    }).then(function() {
      return multiAccess.multiAccessRevoke(callTester, {from: nonOwner});
    }).then(function() {
      return multiAccess.callTester({from: newOwner});
    }).then(function() {
      return multiAccessTester.calls.call();
    }).then(function(calls) {
      assert.equal(calls.valueOf(), 1);
    }).then(done).catch(done);
  });
  it('should not be possible to revoke without confirming first', function(done) {
    var multiAccessTester = MultiAccessTester.deployed();
    var callTester = '0xd0ed7a4dc7b0122d6ec9df8bfd8c6086f4a404b1501918bb29854735bcbdd02d';
    var newOwner = accounts[1];
    var ownerNotConfirmed = accounts[2];
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessAddOwner(ownerNotConfirmed);
    }).then(function() {
      return multiAccess.multiAccessSetRecipient(multiAccessTester.address);
    }).then(function() {
      return multiAccess.multiAccessChangeRecipientRequirement(2);
    }).then(function() {
      return multiAccess.callTester();
    }).then(function() {
      return multiAccess.multiAccessRevoke(callTester, {from: ownerNotConfirmed});
    }).then(function() {
      return multiAccess.callTester({from: newOwner});
    }).then(function() {
      return multiAccessTester.calls.call();
    }).then(function(calls) {
      assert.equal(calls.valueOf(), 1);
    }).then(done).catch(done);
  });
  it('should not be possible to revoke from missing operation', function(done) {
    var newOwner = accounts[1];
    var missingOp = 0x1;
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessChangeRequirement(2);
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(1);
    }).then(function() {
      return multiAccess.multiAccessRevoke(missingOp);
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(1, {from: newOwner});
    }).then(function() {
      return multiAccess.multiAccessRequired.call();
    }).then(function(required) {
      assert.equal(required.valueOf(), 1);
    }).then(done).catch(done);
  });
  it('should be possible to revoke confirmation', function(done) {
    var multiAccessTester = MultiAccessTester.deployed();
    var watcher = multiAccess.Revoke();
    var callTester = '0xd0ed7a4dc7b0122d6ec9df8bfd8c6086f4a404b1501918bb29854735bcbdd02d';
    var newOwner = accounts[1];
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessSetRecipient(multiAccessTester.address);
    }).then(function() {
      return multiAccess.multiAccessChangeRecipientRequirement(2);
    }).then(function() {
      return multiAccess.callTester();
    }).then(function() {
      eventsHelper.setupEvents(multiAccess);
      return multiAccess.multiAccessRevoke(callTester);
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.owner.valueOf(), accounts[0]);
      assert.equal(events[0].args.operation.valueOf(), callTester);
      return multiAccess.callTester({from: newOwner});
    }).then(function() {
      return multiAccessTester.calls.call();
    }).then(function(calls) {
      assert.equal(calls.valueOf(), 0);
    }).then(done).catch(done);
  });
  it('should be possible to confirm same operation after revocation', function(done) {
    var multiAccessTester = MultiAccessTester.deployed();
    var callTester = '0xd0ed7a4dc7b0122d6ec9df8bfd8c6086f4a404b1501918bb29854735bcbdd02d';
    var newOwner = accounts[1];
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessSetRecipient(multiAccessTester.address);
    }).then(function() {
      return multiAccess.multiAccessChangeRecipientRequirement(2);
    }).then(function() {
      return multiAccess.callTester();
    }).then(function() {
      return multiAccess.multiAccessRevoke(callTester);
    }).then(function() {
      return multiAccess.callTester({from: newOwner});
    }).then(function() {
      return multiAccess.callTester();
    }).then(function() {
      return multiAccessTester.calls.call();
    }).then(function(calls) {
      assert.equal(calls.valueOf(), 1);
    }).then(done).catch(done);
  });
  it('should be possible to confirm other operations after revocation', function(done) {
    var callTester = '0xd0ed7a4dc7b0122d6ec9df8bfd8c6086f4a404b1501918bb29854735bcbdd02d';
    var newOwner = accounts[1];
    var newOwner2 = accounts[2];
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessChangeRecipientRequirement(2);
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(2);
    }).then(function() {
      return multiAccess.callTester();
    }).then(function() {
      return multiAccess.multiAccessAddOwner(newOwner2, {from: newOwner});
    }).then(function() {
      return multiAccess.multiAccessRevoke(callTester);
    }).then(function() {
      return multiAccess.multiAccessAddOwner(newOwner2);
    }).then(function() {
      return multiAccess.multiAccessIsOwner.call(newOwner2);
    }).then(function(result) {
      assert.isTrue(result);
    }).then(done).catch(done);
  });

  it('should be possible to check confirmation of missing operation', function(done) {
    var missingOp = 0x1;
    var owner = accounts[0];
    multiAccess.multiAccessHasConfirmed.call(missingOp, owner).then(function(result) {
      assert.isFalse(result);
    }).then(done).catch(done);
  });
  it('should be possible to check confirmation of non-owner', function(done) {
    var callTester = '0xd0ed7a4dc7b0122d6ec9df8bfd8c6086f4a404b1501918bb29854735bcbdd02d';
    var newOwner = accounts[1];
    var nonOwner = accounts[2];
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessChangeRecipientRequirement(2);
    }).then(function() {
      return multiAccess.callTester();
    }).then(function() {
      return multiAccess.multiAccessHasConfirmed.call(callTester, nonOwner);
    }).then(function(result) {
      assert.isFalse(result);
    }).then(done).catch(done);
  });
  it('should be possible to check confirmation existance', function(done) {
    var callTester = '0xd0ed7a4dc7b0122d6ec9df8bfd8c6086f4a404b1501918bb29854735bcbdd02d';
    var owner = accounts[0];
    var newOwner = accounts[1];
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessChangeRecipientRequirement(2);
    }).then(function() {
      return multiAccess.callTester();
    }).then(function() {
      return multiAccess.multiAccessHasConfirmed.call(callTester, owner);
    }).then(function(result) {
      assert.isTrue(result);
    }).then(done).catch(done);
  });
  it('should be possible to check confirmation absence', function(done) {
    var callTester = '0xd0ed7a4dc7b0122d6ec9df8bfd8c6086f4a404b1501918bb29854735bcbdd02d';
    var owner = accounts[0];
    var newOwner = accounts[1];
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessChangeRecipientRequirement(2);
    }).then(function() {
      return multiAccess.callTester();
    }).then(function() {
      return multiAccess.multiAccessHasConfirmed.call(callTester, newOwner);
    }).then(function(result) {
      assert.isFalse(result);
    }).then(done).catch(done);
  });

  it('should emit Confirmation event on each confirmation', function(done) {
    var watcher = multiAccess.Confirmation();
    var callTester = '0xd0ed7a4dc7b0122d6ec9df8bfd8c6086f4a404b1501918bb29854735bcbdd02d';
    var owner1 = accounts[0];
    var owner2 = accounts[1];
    eventsHelper.setupEvents(multiAccess);
    multiAccess.multiAccessAddOwner(owner2).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.owner.valueOf(), owner1);
      eventsHelper.setupEvents(multiAccess);
      return multiAccess.multiAccessChangeRecipientRequirement(2, {from: owner2});
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.owner.valueOf(), owner2);
      eventsHelper.setupEvents(multiAccess);
      return multiAccess.callTester({from: owner2});
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.owner.valueOf(), owner2);
      assert.equal(events[0].args.operation.valueOf(), callTester);
      assert.equal(events[0].args.completed.valueOf(), false);
      eventsHelper.setupEvents(multiAccess);
      return multiAccess.callTester();
    }).then(function(txHash) {
      return eventsHelper.getEvents(txHash, watcher);
    }).then(function(events) {
      assert.equal(events.length, 1);
      assert.equal(events[0].args.owner.valueOf(), owner1);
      assert.equal(events[0].args.operation.valueOf(), callTester);
      assert.equal(events[0].args.completed.valueOf(), true);
    }).then(done).catch(done);
  });
  it('should be possible to confirm operation with >255 owners', function(done) {
    var generateAddress = function(number) {
      var zeros = '0000000000000000000000000000000000000000';
      var hexNumber = number.toString(16);
      return '0x' + (zeros + hexNumber).substring(hexNumber.length - 1);
    };
    var addOwners = function(start, stop) {
      if (start+1 > stop) {
        return multiAccess.multiAccessAddOwner(generateAddress(start));
      }
      return multiAccess.multiAccessAddOwner(generateAddress(start)).then(function() {
        return addOwners(start + 1, stop);
      });
    };
    var owner255 = accounts[1];
    var owner256 = accounts[2];
    var owner257 = accounts[3];
    var owner258 = accounts[4];
    addOwners(2, 254).then(function() {
      return multiAccess.multiAccessAddOwner(owner255);
    }).then(function() {
      multiAccess.multiAccessChangeRequirement(2);
      return multiAccess.multiAccessAddOwner(owner256, {from: owner255});
    }).then(function() {
      return multiAccess.multiAccessAddOwner(owner256, {from: owner255});
    }).then(function() {
      return multiAccess.multiAccessIsOwner.call(owner256);
    }).then(function(result) {
      assert.isFalse(result);
      return multiAccess.multiAccessAddOwner(owner256);
    }).then(function() {
      return multiAccess.multiAccessIsOwner.call(owner256);
    }).then(function(result) {
      assert.isTrue(result);
      return multiAccess.multiAccessAddOwner(owner257, {from: owner256});
    }).then(function() {
      return multiAccess.multiAccessAddOwner(owner257, {from: owner256});
    }).then(function() {
      return multiAccess.multiAccessIsOwner.call(owner257);
    }).then(function(result) {
      assert.isFalse(result);
      return multiAccess.multiAccessAddOwner(owner257);
    }).then(function() {
      return multiAccess.multiAccessIsOwner.call(owner257);
    }).then(function(result) {
      assert.isTrue(result);
      return multiAccess.multiAccessAddOwner(owner258, {from: owner257});
    }).then(function() {
      return multiAccess.multiAccessAddOwner(owner258, {from: owner257});
    }).then(function() {
      return multiAccess.multiAccessIsOwner.call(owner258);
    }).then(function(result) {
      assert.isFalse(result);
      return multiAccess.multiAccessAddOwner(owner258);
    }).then(function() {
      return multiAccess.multiAccessIsOwner.call(owner258);
    }).then(function(result) {
      assert.isTrue(result);
    }).then(done).catch(done);
  });
  it('should remove operation from pending after execution', function(done) {
    var multiAccessTester = MultiAccessTester.deployed();
    var newOwner = accounts[1];
    var newOwner2 = accounts[2];
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessAddOwner(newOwner2);
    }).then(function() {
      return multiAccess.multiAccessSetRecipient(multiAccessTester.address);
    }).then(function() {
      return multiAccess.multiAccessChangeRecipientRequirement(2);
    }).then(function() {
      return multiAccess.callTester();
    }).then(function() {
      return multiAccess.callTester({from: newOwner});
    }).then(function() {
      return multiAccess.callTester({from: newOwner2});
    }).then(function() {
      return multiAccessTester.calls.call();
    }).then(function(calls) {
      assert.equal(calls.valueOf(), 1);
    }).then(done).catch(done);
  });
  it('should leave other pending operations when removing one last after execution', function(done) {
    var newOwner = accounts[1];
    var newOwner2 = accounts[2];
    var newOwner3 = accounts[3];
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessChangeRequirement(2);
    }).then(function() {
      return multiAccess.multiAccessAddOwner(newOwner2);
    }).then(function() {
      return multiAccess.multiAccessAddOwner(newOwner3);
    }).then(function() {
      return multiAccess.multiAccessAddOwner(newOwner3, {from: newOwner});
    }).then(function() {
      return multiAccess.multiAccessAddOwner(newOwner2, {from: newOwner});
    }).then(function() {
      return multiAccess.multiAccessIsOwner.call(newOwner2);
    }).then(function(result) {
      assert.isTrue(result);
    }).then(done).catch(done);
  });
  it('should leave other pending operations when removing one not last after execution', function(done) {
    var newOwner = accounts[1];
    var newOwner2 = accounts[2];
    var newOwner3 = accounts[3];
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessChangeRequirement(2);
    }).then(function() {
      return multiAccess.multiAccessAddOwner(newOwner2);
    }).then(function() {
      return multiAccess.multiAccessAddOwner(newOwner3);
    }).then(function() {
      return multiAccess.multiAccessAddOwner(newOwner2, {from: newOwner});
    }).then(function() {
      return multiAccess.multiAccessAddOwner(newOwner3, {from: newOwner});
    }).then(function() {
      return multiAccess.multiAccessIsOwner.call(newOwner3);
    }).then(function(result) {
      assert.isTrue(result);
    }).then(done).catch(done);
  });
  it('should not be possible to confirm an operation twice with the same owner', function(done) {
    var newOwner = accounts[1];
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessChangeRequirement(2);
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(1);
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(1);
    }).then(function() {
      return multiAccess.multiAccessRequired.call();
    }).then(function(required) {
      assert.equal(required.valueOf(), 2);
    }).then(done).catch(done);
  });
  it('should not be possible to create an operation from non-owner address', function(done) {
    var newOwner = accounts[1];
    var notOwner = accounts[2];
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessChangeRequirement(2);
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(1, {from: notOwner});
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(1);
    }).then(function() {
      return multiAccess.multiAccessRequired.call();
    }).then(function(required) {
      assert.equal(required.valueOf(), 2);
    }).then(done).catch(done);
  });
  it('should not be possible to confirm an operation from non-owner address', function(done) {
    var newOwner = accounts[1];
    var notOwner = accounts[2];
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessChangeRequirement(2);
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(1);
    }).then(function() {
      return multiAccess.multiAccessChangeRequirement(1, {from: notOwner});
    }).then(function() {
      return multiAccess.multiAccessRequired.call();
    }).then(function(required) {
      assert.equal(required.valueOf(), 2);
    }).then(done).catch(done);
  });

  it('should be possible to call arbitrary contract through multiAccessCall', function(done) {
    var multiAccessTester = MultiAccessTester.deployed();
    var multiAccessTesterAbi = web3.eth.contract(multiAccessTester.abi).at(0x0);
    var owner = accounts[0];
    var newOwner = accounts[1];
    multiAccess.multiAccessAddOwner(newOwner).then(function() {
      return multiAccess.multiAccessChangeRequirement(2);
    }).then(function() {
      return multiAccess.multiAccessCall(multiAccessTester.address, 0, multiAccessTesterAbi.callTester.getData());
    }).then(function() {
      return multiAccessTester.calls();
    }).then(function(result) {
      assert.equal(result.valueOf(), 0);
      return multiAccess.multiAccessCall(multiAccessTester.address, 0, multiAccessTesterAbi.callTester.getData(), {from: newOwner});
    }).then(function() {
      return multiAccessTester.calls();
    }).then(function(result) {
      assert.equal(result.valueOf(), 1);
    }).then(done).catch(done);
  });
});
