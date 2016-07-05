import "Registrar.sol";

contract Registry {
    // Review: incoming ether will be stuck and unrecoverable.
    address public registrarAddress;
    
    event Creation(bytes32 indexed identity, address indexed owner, uint position);
    // Review: Alternation event is never used.
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
    
    // Review: it is possible to create Things without identities.
    // Review: it is possible to create Things with empty data.
    function _create(address _owner, uint _schemaIndex, bytes32[] _data, bytes32[] _identities) internal returns (bool) {
        for (uint i = 0; i < _identities.length; i++) {
            if (identities[_identities[i]] > 0) {
                Error(1, _identities[i]);
                return false;
            }
        }
        uint pos = things.length++;
        //todo: validate schema version
        // Review: fulfil the above todo.
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
        // Review: doesn't check the _create result.
        _create(_owner, _schemaIndex, datas, _identities);
        // Review: should return uint but doesn't return anything.
    }
    
    function _setValid(bytes32 _identity, bool _isValid) internal returns (bool) {
        uint pos = identities[_identity];
        if (pos == 0) {
            Error(2, _identity);
            return false;
        }
        // Review: Thing ownership is not checked.
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
        // Review: will always return false.
    }
    
    //this function allows entries with _data of 1 times 32bytes only;
    // Review: user should be aware that if there will be not enough identities transaction will run out of gas.
    // Review: user should be aware that providing too many identities will result in some of them not being used.
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
        // Review: maybe check if there is identities left and throw if so?
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
    
    // Review: will return true in case atleast a single identity found.
    function checkIdentities(bytes32[] _identities) constant returns (bool isFound) {
        isFound = false;
        for (uint k = 0; k < _identities.length; k++) {
            if (identities[_identities[k]] > 0)
            isFound = true;
            // Review: no need to continue the loop if isFound is already true.
        }
        // Review: no need to return, isFound already set.
        return isFound;
    }
    
}