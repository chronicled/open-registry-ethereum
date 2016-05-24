import "AmbiEnabled.sol";

contract Registrar is AmbiEnabled {
    
    struct Authenticator {
        address addr;
        address delegate;
        bool isActive;
    }

    mapping(address => uint) public authenticatorIndex;
    Authenticator[] public authenticators;
    
    function Registrar() {
        authenticators.length++;
    }
    
    function isAuthenticator(address _auth) returns (bool) {
        uint pos = authenticatorIndex[_auth];
        if (pos > 0 && authenticators[pos].isActive) {
            return true;
        }
        return false;
    }
    
    function isDelegate(address _auth, address _delegate) returns (bool) {
        uint pos = authenticatorIndex[_auth];
        if (pos > 0 && authenticators[pos].isActive && authenticators[pos].delegate == _delegate) {
            return true;
        }
        return false;
    }
    
    function add(address _authenticator, address _delegate) checkAccess("owner") {
        uint pos = authenticators.length++;
        authenticators[pos] = Authenticator(_authenticator, _delegate, true);
        authenticatorIndex[_authenticator] = pos;
    }
    
    function setDelegate(address _authenticator, address _delegate) checkAccess("owner") {
        uint pos = authenticatorIndex[_authenticator];
        if (pos > 0) {
            throw;
        }
        authenticators[pos].delegate = _delegate;
    }
    
    function setActive(address _authenticator, bool _isActive) checkAccess("owner") {
        uint pos = authenticatorIndex[_authenticator];
        if (pos > 0) {
            throw;
        }
        authenticators[pos].isActive = _isActive;
    }
    
}

