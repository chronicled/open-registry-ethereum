import "Registrar.sol";

contract Registry {
    
    address public registrarAddress;
    
    struct Asset {
        address owner;
        uint version;
        string data;
        bool isValid;
    }

    mapping(bytes32 => uint) public referenceToIndex;
    Asset[] public assets;

    modifier isAuthenticator(address _authenticator) {
        Registrar registrar = Registrar(registrarAddress);
        if (registrar.isAuthenticator(_authenticator)) {
            _
        }
    }

    modifier isDelegate(address _authenticator, address _delegate) {
        Registrar registrar = Registrar(registrarAddress);
        if (registrar.isDelegate(_authenticator, _delegate)) {
            _
        }
    }

    modifier hasPermission(bytes32 _reference) {
        uint pos = referenceToIndex[_reference];
        if (pos == 0) {
            throw;
        }
        address owner = assets[pos].owner;
        
        bool hasPermission = false;
        if (msg.sender == owner){
            hasPermission = true;
        }
        
        if (!hasPermission) {
            Registrar registrar = Registrar(registrarAddress);
            hasPermission = registrar.isDelegate(owner, msg.sender);
        }
        
        if (hasPermission) {
            _
        }
    }
    
    function Registry(address _registrarAddress) {
        registrarAddress = _registrarAddress;
        assets.length++;
    }
    
    function _create(address _owner, string _data, uint _version, bytes32 _reference) internal returns (uint) {
        if (referenceToIndex[_reference] > 0) {
            throw;
        }
        uint pos = assets.length++;
        assets[pos] = Asset(_owner, _version, _data, true);
        referenceToIndex[_reference] = pos;
        return pos;
    }
    
    function _setValid(bytes32 _reference, bool _isValid) internal {
        uint pos = referenceToIndex[_reference];
        if (pos == 0) {
            throw;
        }
        assets[pos].isValid = _isValid;
    }
    
    //batch create
    
    function create(string _data, uint _version, bytes32 _reference) isAuthenticator(msg.sender) returns (uint) {
        return _create(msg.sender, _data, _version, _reference);
    }

    function createFor(string _data, uint _version, bytes32 _reference, address _owner) isDelegate(_owner, msg.sender) {
        _create(_owner, _data, _version, _reference);
    }
    
    function setValid(bytes32 _reference, bool _isValid) hasPermission(_reference) returns (bool) {
        _setValid(_reference, _isValid);
    }
    
    function getRecord(bytes32 _reference) constant returns (uint, string) {
        uint pos = referenceToIndex[_reference];
        if (pos == 0) {
            throw;
        }
        return (assets[pos].version, assets[pos].data);
    }
    
}
