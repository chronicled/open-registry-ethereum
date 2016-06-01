var ProtoBuf = require("protobufjs");

function Registrant (contract, addr, web3) {
  this.registry = contract;
  this.address = addr;
  this.web3 = web3;
}

//should use buffer to handle this
Registrant.prototype.slice = function (bytes) {
  bytes = bytes.replace('0x','');
  var slices = [];
  while (bytes.length > 64) {
    slices.push('0x' + bytes.substring(0, 64));
    bytes = bytes.substring(64, bytes.length);
  }
  slices.push('0x' + bytes);
  return slices;
}

//should use buffer to handle this
Registrant.prototype.merge = function (bytes32Array) {
  var merged = '0x';
  for (var i = 0; i < bytes32Array.length; i++) {
    merged += bytes32Array[i].replace('0x','');
  }
  return merged;
}

Registrant.prototype.create = function (schemaIndex, identities, reference) {
  var self = this;
  return new Promise(function (fulfill, reject) {
    self.registry.schemas.call(schemaIndex, function(error, proto) {
      if (error) {
        reject(error);
      }
      var builder = ProtoBuf.loadJson(ProtoBuf.DotProto.Parser.parse(proto));
      var Identities = builder.build("Identities");
      var ids = new Identities(identities);
      var slices = self.slice(ids.encodeHex());
      self.registry.create(schemaIndex, slices, reference, {from: self.address}, function(err, data) {
        if (err) {
          reject(err);
        }
        fulfill(data);
      });
    });
  });
}

Registrant.prototype.getAsset = function (reference) {
  var self = this;
  return new Promise(function (fulfill, reject) {
    self.registry.getAsset.call(reference, function(err, data) {
      if (err) {
        reject(err);
      }
      var schema = data[0];
      var identities = data[1];
      var isValid = data[2];
      if (!isValid) {
        reject('Error: record marked as invalid.');
      }
      var builder = ProtoBuf.loadJson(ProtoBuf.DotProto.Parser.parse(schema));
      var Identities = builder.build("Identities");
      var merged = self.merge(identities);
      var decoded = Identities.decodeHex(merged.replace('0x',''));
      fulfill(decoded);
    });
  });
}

module.exports = Registrant;