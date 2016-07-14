import "Registrar.sol";

contract Registry {
    address public registrarAddress;

    event Creation(bytes32 indexed identity, address indexed owner, uint position);
    event Alternation(bytes32 indexed identity, address indexed owner, bool isValid, uint position);
    // 1: conflict, identity already registered
    // 2: not found, identity does not exist
    // 3: unauthorzied, modification only by owner
    // 4: unknown schema
    // 5: bad request, at least one identity needed
    // 5: bad request, at least one data needed
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

    function _create(address _owner, uint _schemaIndex, bytes32[] _data, bytes32[] _identities) internal returns (bool) {
        if (_schemaIndex > schemas.length) {
            Error(4, _identities[0]);
            return false;
        }
        if (_identities.length == 0) {
            Error(5, 0);
            return false;
        }
        if (_data.length == 0) {
            Error(6, 0);
            return false;
        }
        for (uint i = 0; i < _identities.length; i++) {
            if (identities[_identities[i]] > 0) {
                Error(1, _identities[i]);
                return false;
            }
        }
        uint pos = things.length++;
        things[pos] = Thing(_owner, _schemaIndex, _data, true);
        for (uint k = 0; k < _identities.length; k++) {
            identities[_identities[k]] = pos;
            Creation(_identities[k], _owner, pos);
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

    function _linkIdentity(address _caller, uint _pos, bytes32 _identity) internal returns (bool) {
        if (_pos > things.length || identities[_identity] > 0) {
            Error(2, _identity);
            return false;
        }
        Thing thing = things[_pos];
        if (things[_pos].ownerAddress != _caller) {
            Error(3, _identity);
            return false;
        }
        identities[_identity] = _pos;
        Alternation(_identity, _caller, things[_pos].isValid, _pos);
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

    function create(uint _schemaIndex, bytes32[] _data, bytes32[] _identities) isRegistrant(msg.sender) noEther returns (bool) {
        return _create(msg.sender, _schemaIndex, _data, _identities);
    }

    //this function allows entries with _identities of 1 times 32bytes only; others have to be added through linkIdentity later
    // Review: user should be aware that if there will be not enough identities transaction will run out of gas.
    // Review: user should be aware that providing too many identities will result in some of them not being used.
    function createMany(uint _schemaIndex, uint8[] _dataLength, bytes32[] _data, bytes32[] _identities) isRegistrant(msg.sender) noEther returns (bool) {
        uint thingPosition = 0;
        for (uint i = 0; i < _identities.length; i++) {
            uint8 length = _dataLength[i];
            bytes32[] memory datas = new bytes32[](length);
            for (uint j = 0; j < length; j++) {
                datas[j] = _data[thingPosition + j];
            }
            thingPosition += length;
            bytes32[] memory ids = new bytes32[](1);
            ids[0] = _identities[i];
            _create(msg.sender, _schemaIndex, datas, ids);
        }
        // Review: maybe check if there is identities left and throw if so? => done
        if (thingPosition != _data.length) {
            return false;
        }
        return true;
    }

    function linkIdentity(uint _pos, bytes32 _identity) isRegistrant(msg.sender) noEther returns (bool success) {
        return _linkIdentity(msg.sender, _pos, _identity);
    }

    function setValid(bytes32 _identity, bool _isValid) isRegistrant(msg.sender) noEther returns (bool) {
        return _setValid(msg.sender, _identity, _isValid);
    }

    function addSchema(string _schema) isCertificationAuthority(msg.sender) noEther returns (uint) {
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

    function checkAnyIdentity(bytes32[] _identities) constant returns (bool) {
        for (uint k = 0; k < _identities.length; k++) {
            if (identities[_identities[k]] > 0)
            return true;
        }
        return false;
    }

    function () noEther {
        throw;
    }

}
