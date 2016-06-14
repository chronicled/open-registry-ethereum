import "Registrar.sol";

contract Registry {
    
    address public registrarAddress;
    
    struct Asset {
        address ownerAddress;
        uint schemaReference;
        bytes32[] identities;
        bool isValid;
    }

    mapping(bytes32 => uint) public assetReferences;
    
    Asset[] public assets;
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
        assets.length++;
        schemas.length++;
    }
    
    //################# INTERNAL FUNCTIONS
    
    
    function _create(address _owner, uint _schemaIndex, bytes32[] _identities, bytes32 _assetReference) internal returns (uint) {
        if (assetReferences[_assetReference] > 0) {
            throw;
        }
        uint pos = assets.length++;
        //todo: validate schema version
        assets[pos] = Asset(_owner, _schemaIndex, _identities, true);
        assetReferences[_assetReference] = pos;
        return pos;
    }
    
    function _setValid(bytes32 _assetReference, bool _isValid) internal {
        uint pos = assetReferences[_assetReference];
        if (pos == 0) {
            throw;
        }
        assets[pos].isValid = _isValid;
    }
    
    function _linkAssetReference(address _owner, uint _pos, bytes32 _assetReference) internal {
        if (_pos > assets.length || assetReferences[_assetReference] > 0) {
            throw;
        }
        Asset asset = assets[_pos];
        if (assets[_pos].ownerAddress != _owner) {
            throw;
        }
        assetReferences[_assetReference] = _pos;
    }
    
    //################# PUBLIC FUNCTIONS

    function configure(address _registrarAddress) {
        if (registrarAddress != 0x0) {
            throw;
        }
        registrarAddress = _registrarAddress;
    }
    
    //batch create: open question: how to deal with array of dynamic types?
    function createMany(uint[] _schemaIndex, uint8[] _identityLength, bytes32[] _identities, bytes32[] _references) isRegistrant(msg.sender) returns (uint, uint) {
        uint startPosition = assets.length;
        uint identityPosition = 0;
        for (uint i = 0; i < _schemaIndex.length; i++) {
            uint8 length = _identityLength[i];
            bytes32[] memory ids = new bytes32[](length);
            for (uint j = 0; j < length; j++) {
                ids[j] = _identities[identityPosition + j];
            }
            identityPosition += length;
            _create(msg.sender, _schemaIndex[i], ids, _references[i]);
            // TODO: deal with references
            // for (uint k = 1; k < length; k++) {
            //     _linkAssetReference(msg.sender, pos, _references[identityPosition + k]);
            // }
        }
        return (startPosition, startPosition + _schemaIndex.length);
    }
    
    function create(uint _schemaIndex, bytes32[] _identities, bytes32[] _references) isRegistrant(msg.sender) returns (uint) {
        uint pos = _create(msg.sender, _schemaIndex, _identities, _references[0]);
        for (uint i = 1; i < _references.length; i++) {
            _linkAssetReference(msg.sender, pos, _references[i]);
        }
    }
    
    function linkAssetReference(uint _pos, bytes32 _assetReference) isRegistrant(msg.sender) {
        _linkAssetReference(msg.sender, _pos, _assetReference);
    }
    
    function setValid(bytes32 _reference, bool _isValid) isRegistrant(msg.sender) returns (bool) {
        _setValid(_reference, _isValid);
        //Open question: what if we want to update the record for an item? we can not simply set it inValid, and create a new one, because the references are already taken
    }
    
    function addSchema(string _schema) isCertificationAuthority(msg.sender) returns (uint) {
        uint pos = schemas.length++;
        schemas[pos] = _schema;
        return pos;
    }
    
    //################# CONSTANT FUNCTIONS
    
    
    function getAsset(bytes32 _assetReference) constant returns (string, bytes32[], bool) {
        uint pos = assetReferences[_assetReference];
        if (pos == 0) {
            throw;
        }
        Asset asset = assets[pos];
        return (schemas[asset.schemaReference], asset.identities, asset.isValid);
    }
    
}