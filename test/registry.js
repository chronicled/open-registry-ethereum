contract('Registry', {reset_state: true}, function(accounts) {
  it('should be possible to configure registry', function(done) {
    var registrar = Registrar.deployed();
    var registry = Registry.deployed();
    registry.configure(registrar.address).then(function() {
    }).then(function() {
      return registry.registrarAddress.call();
    }).then(function(result) {
      assert.equal(result, registrar.address);
    }).then(done).catch(done);
  });
  it('should be possible to add schema', function(done) {
    var registrar = Registrar.deployed();
    var registry = Registry.deployed();
    registrar.add(accounts[0], "").then(function() {
    }).then(function() {
      return registry.configure(registrar.address);
    }).then(function() {
      return registry.addSchema('test');
    }).then(function() {
      return registry.schemas.call(1);
    }).then(function(result) {
      assert.equal(result, 'test');
    }).then(done).catch(done);
  });
  it('should be possible to register Thing', function(done) {
    var registrar = Registrar.deployed();
    var registry = Registry.deployed();
    registrar.add(accounts[0], "").then(function() {
    }).then(function() {
      return registry.configure(registrar.address);
    }).then(function() {
      return registry.addSchema('test');
    }).then(function() {
      return registry.create(1, ['0x0012340000000000000000000000000000000000000000000000000000000000'], ['0x1234']);
    }).then(function() {
      return registry.getThing.call('0x1234');
    }).then(function(result) {
      assert.equal(result[1][0], '0x0012340000000000000000000000000000000000000000000000000000000000');
    }).then(done).catch(done);
  });
  it('should prohibit to register Thing for unknown schema', function(done) {
    var registrar = Registrar.deployed();
    var registry = Registry.deployed();
    registrar.add(accounts[0], "").then(function() {
    }).then(function() {
      return registry.configure(registrar.address);
    }).then(function() {
      return registry.addSchema('test');
    }).then(function() {
      return registry.create.call(2, ['0x0012340000000000000000000000000000000000000000000000000000000000'], ['0x1234']);
    }).then(function(result) {
      assert.isFalse(result);
      return registry.create.call(3, ['0x0012340000000000000000000000000000000000000000000000000000000000'], ['0x1234']);
    }).then(function(result) {
      assert.isFalse(result);
      return registry.create.call(0, ['0x0012340000000000000000000000000000000000000000000000000000000000'], ['0x1234']);
    }).then(function(result) {
      assert.isFalse(result);
    }).then(done).catch(done);
  });
  it('should be possible to batch-register Thing', function(done) {
    var registrar = Registrar.deployed();
    var registry = Registry.deployed();
    registrar.add(accounts[0], "").then(function() {
    }).then(function() {
      return registry.configure(registrar.address);
    }).then(function() {
      return registry.addSchema('test');
    }).then(function() {
      return registry.createMany(1, [1, 1], ['0x0012340000000000000000000000000000000000000000000000000000000000', '0x0091230000000000000000000000000000000000000000000000000000000000'], ['0x1234', '0x4321']);
    }).then(function() {
      return registry.getThing.call('0x4321');
    }).then(function(result) {
      assert.equal(result[1][0], '0x0091230000000000000000000000000000000000000000000000000000000000');
    }).then(done).catch(done);
  });
});
