import "Registrar.sol";

contract Registry {
    address public registrarAddress;
    
    event Creation(bytes32 indexed identity, address indexed owner, uint position);
    event Alternation(bytes32 indexed identity, address indexed owner, bool isValid, uint position);
    // 1: conflict, identity already registered with another thing
    // 2: not found, identity does not exist
    // 3: unauthorzied, modification only by owner
    // 4: unknown schema
    // 5: bad request, at least one identity needed
    // 6: bad request, at least one data needed
    event Error(uint code, bytes32 reference);
    
    struct Identity {
        bytes16 schema;
        bytes16 idA;
        bytes32 idB;
    }
    
    struct Thing {
        address ownerAddress;
        Identity[] identities;
        uint schemaReference;
        bytes32[] data;
        bool isValid;
    }
    

    mapping(bytes32 => uint) public identities;
    
    Thing[] public things;
    string[] public schemas;
    
    modifier noEther() {
        if (msg.value > 0) throw;
        _
    }

    modifier isRegistrant(address _registrant) {
        Registrar registrar = Registrar(registrarAddress);
        if (registrar.isActiveRegistrant(_registrant)) {
            _
        }
    }
    
    modifier isCertificationAuthority(address _ca) {
        Registrar registrar = Registrar(registrarAddress);
        if (registrar.certificationAuthority() == _ca) {
            _
        }
    }
    
    function Registry() {
        things.length++;
        schemas.length++;
    }
    
    //################# INTERNAL FUNCTIONS
    
    function _create(address _caller, uint _schemaIndex, bytes32[] _data, bytes16[] _schema, bytes16[] _idA, bytes32[] _idB) internal returns (bool) {
        uint pos = things.length++;
        return _update(_caller, pos, _schemaIndex, _data, _schema, _idA, _idB);
    }
    
    function _update(address _caller, uint _pos, uint _schemaIndex, bytes32[] _data, bytes16[] _schema, bytes16[] _idA, bytes32[] _idB) internal returns (bool) {
        if (_schemaIndex > schemas.length) {
            Error(4, 0);
            return false;
        }
        if (_schema.length == 0 || _idA.length == 0 || _idB.length == 0) {
            Error(5, 0);
            return false;
        }
        if (_data.length == 0) {
            Error(6, 0);
            return false;
        }
        if (things[_pos].ownerAddress != 0x0 && things[_pos].ownerAddress != _caller) {
            Error(3, 0);
            return false;
        }
        Identity[] memory ids = new Identity[](_idA.length);
        for (uint i = 0; i < _idA.length; i++) {
            ids[i] = Identity(_schema[i], _idA[i], _idB[i]);
            bytes32 hash = sha3(_schema[i],_idA[i],_idB[i]);
            uint previous = identities[hash];
            if (previous > 0 && previous != _pos) {
                Error(1, hash);
                return false;
            }
        }
        things[_pos] = Thing(_caller, ids, _schemaIndex, _data, true);
        for (uint k = 0; k < _idA.length; k++) {
            hash = sha3(_schema[i],_idA[i],_idB[i]);
            if (identities[hash] == 0) {
                identities[hash] = _pos;
                Creation(hash, _caller, _pos);
            }
        }
        return true;
    }
    
    function _setValid(address _caller, bytes32 _identity, bool _isValid) internal returns (bool) {
        uint pos = identities[_identity];
        if (pos == 0) {
            Error(2, _identity);
            return false;
        }
        Thing thing = things[pos];
        if (things[pos].ownerAddress != _caller) {
            Error(3, _identity);
            return false;
        }
        things[pos].isValid = _isValid;
        return true;
    }
    
    function _linkIdentity(address _caller, uint _pos, bytes16 _schema, bytes16 _idA, bytes32 _idB) internal returns (bool) {
        bytes32 hash = sha3(_schema, _idA, _idB);
        if (_pos > things.length || identities[hash] > 0) {
            Error(2, hash);
            return false;
        }
        Thing thing = things[_pos];
        if (things[_pos].ownerAddress != _caller) {
            Error(3, hash);
            return false;
        }
        things[_pos].identities[things[_pos].identities.length++] = Identity(_schema, _idA, _idB);
        identities[hash] = _pos;
        Alternation(hash, _caller, things[_pos].isValid, _pos);
        return true;
    }
    
    //################# PUBLIC FUNCTIONS

    function configure(address _registrarAddress) noEther returns (bool) {
        if (registrarAddress != 0x0) {
            Error(3, bytes32(registrarAddress));
            return false;
        }
        registrarAddress = _registrarAddress;
        return true;
    }
    
    function create(uint _schemaIndex, bytes32[] _data, bytes16[] _schema, bytes16[] _idA, bytes32[] _idB) isRegistrant(msg.sender) noEther returns (bool) {
        return _create(msg.sender, _schemaIndex, _data, _schema, _idA, _idB);
    }
    
    function update(uint _pos, uint _schemaIndex, bytes32[] _data, bytes16[] _schema, bytes16[] _idA, bytes32[] _idB) isRegistrant(msg.sender) noEther returns (bool) {
        return _update(msg.sender, _pos, _schemaIndex, _data, _schema, _idA, _idB);
    }
    
    // this function allows entries with _identities of 1 times 32bytes only; others have to be added through linkIdentity later
    // Review: user should be aware that if there will be not enough identities transaction will run out of gas.
    // Review: user should be aware that providing too many identities will result in some of them not being used.
    function createMany(uint _schemaIndex, uint8[] _dataLength, bytes32[] _data, bytes16[] _schema, bytes16[] _idA, bytes32[] _idB) isRegistrant(msg.sender) noEther returns (bool) {
        uint thingPosition = 0;
        for (uint i = 0; i < _schema.length; i++) {
            uint8 length = _dataLength[i];
            bytes32[] memory datas = new bytes32[](length);
            for (uint j = 0; j < length; j++) {
                datas[j] = _data[thingPosition + j];
            }
            thingPosition += length;
            bytes16[] memory schemas = new bytes16[](1);
            schemas[0] = _schema[i];
            bytes16[] memory idAs = new bytes16[](1);
            idAs[0] = _idA[i];
            bytes32[] memory idBs = new bytes32[](1);
            idBs[0] = _idB[i];
            _create(msg.sender, _schemaIndex, datas, schemas, idAs, idBs);
        }
        // Review: maybe check if there is identities left and throw if so? => done
        if (thingPosition != _data.length) {
            return false;
        }
        return true;
    }
    
    function linkIdentity(uint _pos, bytes16 _schema, bytes16 _idA, bytes32 _idB) isRegistrant(msg.sender) noEther returns (bool success) {
        return _linkIdentity(msg.sender, _pos, _schema, _idA, _idB);
    }
    
    function setValid(bytes32 _identity, bool _isValid) isRegistrant(msg.sender) noEther returns (bool) {
        return _setValid(msg.sender, _identity, _isValid);
    }
    
    function addSchema(string _schema) isCertificationAuthority(msg.sender) noEther returns (uint) {
        uint pos = schemas.length++;
        schemas[pos] = _schema;
        return pos;
    }
    
    function () noEther {
        throw;
    }
    
    //################# CONSTANT FUNCTIONS
    
    
    function getThing(bytes32 _identity) constant returns (string, bytes32[], bool) {
        uint pos = identities[_identity];
        if (pos == 0) {
            Error(2, _identity);
            return;
        }
        Thing thing = things[pos];
        return (schemas[thing.schemaReference], thing.data, thing.isValid);
    }
    
    function checkAnyIdentity(bytes32[] _identities) constant returns (bool) {
        for (uint k = 0; k < _identities.length; k++) {
            if (identities[_identities[k]] > 0)
            return true;
        }
        return false;
    }
    
}