var expect = require('chai').expect;
var Registrant = require('./lib/registrant');
var ProtoBuf = require("protobufjs");
var sinon = require('sinon');
require('chai').use(require('sinon-chai'));


var slice1 = '0x1234000000000000000000000000000000000000000000000000000000004321';
var slice2 = '0x5678000000000000000000000000000000000000000000000000000000004321';
var total = '0x12340000000000000000000000000000000000000000000000000000000043215678000000000000000000000000000000000000000000000000000000004321';

var proto = "message Identities {    \
  repeated Identity identities = 1; \
  optional Data data = 2;           \
}                                   \
                                    \
message Identity {                  \
  required string uri = 1;          \
}                                   \
                                    \
message Data {                      \
  optional string MymeType = 1;     \
  optional string brandName = 2;    \
}";
var builder = ProtoBuf.loadJson(ProtoBuf.DotProto.Parser.parse(proto));
var Identities = builder.build("Identities");

describe('protobuf test', function() {

  it('should allow to serialize and deserialize identities.', function(done) {

    var ids = new Identities({ 
      identities: [ { uri: 'uri' } ],
      data: null
    });
    expect(ids).to.eql(Identities.decodeHex('0a050a03757269'));
    done();
  });

  it('should allow to split protobuf into 32byte parts.', function(done) {
    var registrant = new Registrant();
    var slices = registrant.slice(total);
    expect(slices[0]).to.eql(slice1);
    expect(slices[1]).to.eql(slice2);
    done();
  });

  it('should allow to concatenate parts back together', function(done) {
    var registrant = new Registrant();
    var merged = registrant.merge([slice1, slice2]);
    expect(merged).to.eql(total);
    done();
  });
});


describe('registrant sdk', function() {

  it('should parse protobuf according to schema.', function(done) {

    var contract = { getAsset: { call: function() {} } };
    sinon.stub(contract.getAsset, 'call').yields(null, [
      proto,
      ['0x0a050a0375726900000000000000000000000000000000000000000000000000'],
      true
    ]);

    var registrant = new Registrant(contract);


    registrant.getAsset('0x1234').then(function(rv) {
      expect(JSON.stringify(rv)).to.eql(JSON.stringify(Identities.decodeHex('0a050a03757269')));
      done();
    }).catch(done);
  });
});