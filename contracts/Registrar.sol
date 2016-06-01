contract Registrar {
    
    address public certificationAuthority;
    address public registry;
    
    struct Registrant {
        address addr;
        bool isActive;
    }

    mapping(address => uint) public registrantIndex;
    Registrant[] public registrants;
    
    function Registrar() {
        certificationAuthority = msg.sender;
        registrants.length++;
    }

    function getRegistrantsSize() constant returns (uint) {
        return registrants.length - 1;
    }
    
    function isActiveRegistrant(address _registrant) constant returns (bool) {
        uint pos = registrantIndex[_registrant];
        return (pos > 0 && registrants[pos].isActive);
    }
    
    function add(address _registrant) {
        if (msg.sender != certificationAuthority || registrantIndex[_registrant] > 0) {
            throw;
        }
        uint pos = registrants.length++;
        registrants[pos] = Registrant(_registrant, true);
        registrantIndex[_registrant] = pos;
    }
    
    function setActive(address _registrant, bool _isActive) {
        if (msg.sender != certificationAuthority || registrantIndex[_registrant] == 0) {
            throw;
        }
        registrants[registrantIndex[_registrant]].isActive = _isActive;
    }
    
    function setNextAuthority(address _ca) {
        if (msg.sender != certificationAuthority) {
            throw;
        }
        certificationAuthority = _ca;
    }
    
}