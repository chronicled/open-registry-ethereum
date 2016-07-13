import "Registrar.sol";

contract Registry {
    
    address public registrarAddress;
    
    event Creation(bytes32 indexed identity, address indexed owner, uint position);
    event Alternation(bytes32 indexed identity, address indexed owner, bool isValid, uint position);
    // 1: conflict, identity already registered
    // 2: not found, identity does not exist
    // 3: unauthorzied, modification only by owner
    event Error(uint code, bytes32 reference);
    
    struct Thing {
        address ownerAddress;
        uint schemaReference;
        bytes32[] data;
        bool isValid;
    }

    mapping(bytes32 => uint) public identities;
    
    Thing[] public things;
    string[] public schemas;

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
    
    
    function _create(address _owner, uint _schemaIndex, bytes32[] _data, bytes32[] _identities) internal returns (bool) {
        for (uint i = 0; i < _identities.length; i++) {
            if (identities[_identities[i]] > 0) {
                Error(1, _identities[i]);
                return false;
            }
        }
        uint pos = things.length++;
        //todo: validate schema version
        things[pos] = Thing(_owner, _schemaIndex, _data, true);
        for (uint k = 0; k < _identities.length; k++) {
            identities[_identities[k]] = pos;
            Creation(_identities[k], _owner, pos);
        }
        return true;
    }
    
    //same call like create, but data size can only be 1 time 32 bytes
    function _create1(address _owner, uint _schemaIndex, bytes32 _data, bytes32[] _identities) internal returns (uint) {
        bytes32[] memory datas = new bytes32[](1);
        datas[0] = _data;
        _create(_owner, _schemaIndex, datas, _identities);
    }
    
    function _setValid(bytes32 _identity, bool _isValid) internal returns (bool) {
        uint pos = identities[_identity];
        if (pos == 0) {
            Error(2, _identity);
            return false;
        }
        things[pos].isValid = _isValid;
        return true;
    }
    
    function _linkIdentity(address _owner, uint _pos, bytes32 _identity) internal returns (bool) {
        if (_pos > things.length || identities[_identity] > 0) {
            Error(2, _identity);
            return false;
        }
        Thing thing = things[_pos];
        if (things[_pos].ownerAddress != _owner) {
            Error(3, _identity);
            return false;
        }
        identities[_identity] = _pos;
        return true;
    }
    
    //################# PUBLIC FUNCTIONS

    function configure(address _registrarAddress) returns (bool) {
        if (registrarAddress != 0x0) {
            Error(3, bytes32(registrarAddress));
            return false;
        }
        registrarAddress = _registrarAddress;
    }
    
    //this function allows entries with _data of 1 times 32bytes only;
    function createMany(uint _schemaIndex, bytes32[] _data, uint8[] _idLength, bytes32[] _identities) isRegistrant(msg.sender) returns (uint, uint) {
        uint startPosition = things.length;
        uint thingPosition = 0;
        for (uint i = 0; i < _data.length; i++) {
            uint8 length = _idLength[i];
            bytes32[] memory ids = new bytes32[](length);
            for (uint j = 0; j < length; j++) {
                ids[j] = _identities[thingPosition + j];
            }
            thingPosition += length;
            _create1(msg.sender, _schemaIndex, _data[i], ids);
        }
        return (startPosition, startPosition + _data.length);
    }
    
    function create(uint _schemaIndex, bytes32[] _data, bytes32[] _identities) isRegistrant(msg.sender) returns (bool) {
        return _create(msg.sender, _schemaIndex, _data, _identities);
    }
    
    function linkIdentity(uint _pos, bytes32 _identity) isRegistrant(msg.sender) returns (bool) {
        return _linkIdentity(msg.sender, _pos, _identity);
    }
    
    function setValid(bytes32 _identity, bool _isValid) isRegistrant(msg.sender) returns (bool) {
        return _setValid(_identity, _isValid);
    }
    
    function addSchema(string _schema) isCertificationAuthority(msg.sender) returns (uint) {
        uint pos = schemas.length++;
        schemas[pos] = _schema;
        return pos;
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
    
    function checkIdentities(bytes32[] _identities) constant returns (bool isFound) {
        isFound = false;
        for (uint k = 0; k < _identities.length; k++) {
            if (identities[_identities[k]] > 0)
            isFound = true;
        }
        return isFound;
    }
    
}