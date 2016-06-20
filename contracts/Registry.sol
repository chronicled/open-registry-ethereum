import "Registrar.sol";

contract Registry {
    
    event Create(address indexed owner, bytes32 indexed identity, uint position);
    
    address public registrarAddress;
    
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
    
    
    function _create(address _owner, uint _schemaIndex, bytes32[] _data, bytes32[] _identities) internal returns (uint) {
        for (uint i = 0; i < _identities.length; i++) {
            if (identities[_identities[i]] > 0) {
                throw;
            }
        }
        uint pos = things.length++;
        //todo: validate schema version
        things[pos] = Thing(_owner, _schemaIndex, _data, true);
        for (uint k = 0; k < _identities.length; k++) {
            identities[_identities[k]] = pos;
            Create(_owner, _identities[k], pos);
        }
        return pos;
    }
    
    //same call like create, but data size can only be 1 time 32 bytes
    function _create1(address _owner, uint _schemaIndex, bytes32 _data, bytes32[] _identities) internal returns (uint) {
        bytes32[] memory datas = new bytes32[](1);
        datas[0] = _data;
        _create(_owner, _schemaIndex, datas, _identities);
    }
    
    function _setValid(bytes32 _thingReference, bool _isValid) internal {
        uint pos = identities[_thingReference];
        if (pos == 0) {
            throw;
        }
        things[pos].isValid = _isValid;
    }
    
    function _linkIdentity(address _owner, uint _pos, bytes32 _identity) internal {
        if (_pos > things.length || identities[_identity] > 0) {
            throw;
        }
        Thing thing = things[_pos];
        if (things[_pos].ownerAddress != _owner) {
            throw;
        }
        identities[_identity] = _pos;
    }
    
    //################# PUBLIC FUNCTIONS

    function configure(address _registrarAddress) {
        if (registrarAddress != 0x0) {
            throw;
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
    
    function create(uint _schemaIndex, bytes32[] _data, bytes32[] _identities) isRegistrant(msg.sender) returns (uint) {
        uint pos = _create(msg.sender, _schemaIndex, _data, _identities);
        return pos;
    }
    
    function linkIdentity(uint _pos, bytes32 _identity) isRegistrant(msg.sender) {
        _linkIdentity(msg.sender, _pos, _identity);
    }
    
    function setValid(bytes32 _identity, bool _isValid) isRegistrant(msg.sender) returns (bool) {
        _setValid(_identity, _isValid);
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
            throw;
        }
        Thing thing = things[pos];
        return (schemas[thing.schemaReference], thing.data, thing.isValid);
    }
    
}