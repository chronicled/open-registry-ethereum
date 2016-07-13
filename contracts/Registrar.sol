contract Registrar {
    address public certificationAuthority;
    
    event Creation(address indexed registrant, address authority, string reference);
    event Alternation(address indexed registrant, address authority, bool isActive, string reference);
    
    // possible error codes
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
        //first count how many active ones there are
        uint counter = 0;
        for (uint i = 0; i < registrants.length; i++) {
            if (registrants[i].isActive) {
                counter++;
            }
        }

        //then fill data structure to return
        address[] memory active = new address[](counter);
        counter = 0;
        for (uint j = 0; j < registrants.length; j++) {
            if (registrants[j].isActive) {
                active[counter] = registrants[j].addr;
                counter++;
            }
        }

        return active;
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
        return true;
    }
    
    function setNextAuthority(address _ca) noEther returns (bool) {
        if (msg.sender != certificationAuthority) {
            Error(1); //permission denied
            return false;
        }
        certificationAuthority = _ca;
        return true;
    }
    
    function () noEther {
        throw;
    }
}