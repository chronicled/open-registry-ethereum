import "Registrar.sol";

contract Registry {
    
    address public registrar;
    
    struct Record {
        address owner;
        uint version;
        string data;
        bool isValid;
    }

    mapping(bytes32 => uint) public recordIndex;
    Record[] public records;
    
    function Registry() {
        records.length++;
    }
    
    function _create(address _owner, string _data, uint _version, bytes32 _reference) internal returns (uint) {
        if (recordIndex[_reference] > 0) {
            throw;
        }
        uint pos = records.length++;
        records[pos] = Record(_owner, _version, _data, true);
        recordIndex[_reference] = pos;
        return pos;
    }
    
    function _setValid(bytes32 _reference, bool _isValid) internal {
        uint pos = recordIndex[_reference];
        if (pos == 0) {
            throw;
        }
        records[pos].isValid = _isValid;
    }
    
    //batch create
    
    modifier isAuthenticator(address _authenticator) {
        Registrar registrar = Registrar(registrar);
        if (registrar.isAuthenticator(_authenticator)) {
            _
        }
    }
    
    function create(string _data, uint _version, bytes32 _reference) isAuthenticator(msg.sender) returns (uint) {
        return _create(msg.sender, _data, _version, _reference);
    }
    
    modifier isDelegate(address _authenticator, address _delegate) {
        Registrar registrar = Registrar(registrar);
        if (registrar.isDelegate(_authenticator, _delegate)) {
            _
        }
    }

    function createFor(string _data, uint _version, bytes32 _reference, address _owner) isDelegate(_owner, msg.sender) {
        _create(_owner, _data, _version, _reference);
    }
    
    function setValid(bytes32 _reference, bool _isValid) returns (bool) {
        uint pos = recordIndex[_reference];
        if (pos == 0) {
            throw;
        }
        address owner = records[pos].owner;
        
        bool hasPermission = false;
        if (msg.sender == owner){
            hasPermission = true;
        }
        
        if (!hasPermission) {
            Registrar registrar = Registrar(registrar);
            hasPermission = registrar.isDelegate(owner, msg.sender);
        }
        
        if (hasPermission) {
            _setValid(_reference, _isValid);
        }
    }
    
    function getRecord(bytes32 _reference) constant returns (uint, string) {
        uint pos = recordIndex[_reference];
        if (pos == 0) {
            throw;
        }
        return (records[pos].version, records[pos].data);
    }
    
}
