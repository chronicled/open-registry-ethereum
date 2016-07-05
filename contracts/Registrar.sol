contract Registrar {
    // Review: incoming ether will be stuck and unrecoverable. => i added no ether modifier
    address public certificationAuthority;
    // Review: registry is never used. => removed
    
    event Creation(address indexed registrant, address authority, string reference);
    event Alternation(address indexed registrant, address authority, bool isActive, string reference);
     //1: permission denied
    event Error(uint code);
    
    struct Registrant {
        address addr;
        string reference;
        bool isActive;
    }

    mapping(address => uint) public registrantIndex;
    Registrant[] public registrants;
    
    modifier noEther() {
        if (msg.value > 0) throw;
        _
    }
    
    function Registrar() {
        certificationAuthority = msg.sender;
        registrants.length++;
    }

    function getRegistrants() constant returns (address[]) {
        address[] memory rv = new address[](registrants.length);
        uint counter = 0;
        for (uint i = 0; i < registrants.length; i++) {
            if (registrants[i].isActive) {
                rv[counter] = registrants[i].addr;
                counter++;
            }
        }
        return rv;
    }
    
    function isActiveRegistrant(address _registrant) constant returns (bool) {
        uint pos = registrantIndex[_registrant];
        return (pos > 0 && registrants[pos].isActive);
    }
    
    function add(address _registrant, string _reference) noEther returns (bool) {
        if (msg.sender != certificationAuthority || registrantIndex[_registrant] > 0) {
            Error(1); //permission denied
            return false;
        }
        uint pos = registrants.length++;
        registrants[pos] = Registrant(_registrant, _reference, true);
        registrantIndex[_registrant] = pos;
        Creation(_registrant, msg.sender, _reference);
        // Review: will always return false. => returned true
        return true;
    }
    
    function setActive(address _registrant, bool _isActive, string _reference) noEther returns (bool) {
        if (msg.sender != certificationAuthority || registrantIndex[_registrant] == 0) {
            Error(1); //permission denied
            return false;
        }
        Registrant registrant = registrants[registrantIndex[_registrant]];
        registrant.isActive = _isActive;
        registrant.reference = _reference;
        Alternation(_registrant, msg.sender, _isActive, _reference);
        // Review: will always return false. => returned true
        return true;
    }
    
    function setNextAuthority(address _ca) noEther returns (bool) {
        if (msg.sender != certificationAuthority) {
            Error(1); //permission denied
            return false;
        }
        certificationAuthority = _ca;
        // Review: will always return false. => returned true
        return true;
    }
    
    function () noEther {
        throw;
    }
}