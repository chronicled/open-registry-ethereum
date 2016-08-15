contract('Registrar', function(accounts) {
  var eventsHelper = require('../truffle-helpers/eventsHelper.js');
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
  it('should allow to disable registrants');

  it('should allow to get list of active registrants', function(done) {
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
