var expect = require('chai').expect;
var Recovery = require('./lib/registrant');
var ProtoBuf = require("protobufjs");


describe('protobuf test', function() {

  it('should allow to serialize and deserialize identities.', function(done) {
    var builder = ProtoBuf.loadProtoFile("./identities.proto");
    var Identities = builder.build("Identities");
    var ids = new Identities({ 
      identities: [ { uri: 'uri' } ],
      data: null
    });
    expect(ids).to.eql(Identities.decodeHex('0a050a03757269'));
    done();
  });
});