contract Registrar {
    address public certificationAuthority;
    
    event Creation(address indexed registrant, address authority, string  name, string contact, string legalName, string legalAddress, bool active);
    event Update(address indexed registrant, address authority, string name, string contact, string legalName, string legalAddress, bool active);
    
    // possible error codes
    //1: permission denied
    event Error(uint code);
    
    struct Registrant {
        address addr;
        string name;
        string description;
        string contact;
        string legalName;
        string legalAddress;
        bool active;
    }

    mapping(address => uint) public registrantIndex;
    Registrant[] public registrants;
    
    modifier noEther() {
        if (msg.value > 0) throw;
        _
    }

    modifier isCA() {
        if (msg.sender != certificationAuthority) {
            Error(1);
            return;
        }
        _
    }

    modifier isntRegistrant(address _registrant) {
        if (registrantIndex[_registrant] > 0) {
            Error(1);
            return;
        }
        _
    }

    modifier isRegistrant(address _registrant) {
        if (registrantIndex[_registrant] == 0) {
            Error(1);
            return;
        }
        _
    }
    
    function Registrar() {
        certificationAuthority = msg.sender;
        registrants.length++;
    }

    function getRegistrant(address _registrant) isRegistrant(_registrant) constant returns (address, string, string, string, string, string, bool) {
        Registrant registrant = registrants[registrantIndex[_registrant]];
        return (registrant.addr, registrant.name, registrant.description, registrant.contact, registrant.legalName, registrant.legalAddress, registrant.active);
    }

    function getRegistrants() constant returns (address[]) {
        address[] memory active = new address[](registrants.length-1);
        for (uint j = 1; j < registrants.length; j++) {
            active[j-1] = registrants[j].addr;
        }

        return active;
    }
    
    function isActiveRegistrant(address _registrant) constant returns (bool) {
        uint pos = registrantIndex[_registrant];
        return (pos > 0 && registrants[pos].active);
    }
    
    function add(address _registrant, string _name, string _description, string _contact, string _legalName, string _legalAddress) noEther isCA isntRegistrant(_registrant) returns (bool) {
        uint pos = registrants.length++;
        registrants[pos] = Registrant(_registrant, _name, _description, _contact, _legalName, _legalAddress, true);
        registrantIndex[_registrant] = pos;
        Creation(_registrant, msg.sender, _name, _contact, _legalName, _legalAddress, true);
        return true;
    }
    
    function edit(address _registrant, string _name, string _description, string _contact, string _legalName, string _legalAddress, bool _active) noEther isCA isRegistrant(_registrant) returns (bool) {
        Registrant registrant = registrants[registrantIndex[_registrant]];
        registrant.name = _name;
        registrant.description = _description;
        registrant.contact = _contact;
        registrant.legalName = _legalName;
        registrant.legalAddress = _legalAddress;
        registrant.active = _active;
        Update(_registrant, msg.sender, _name, _contact, _legalName, _legalAddress, _active);
        return true;
    }
    
    function setNextAuthority(address _ca) noEther isCA returns (bool) {
        certificationAuthority = _ca;
        return true;
    }
    
    function () noEther {
        throw;
    }
}