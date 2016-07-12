contract Registrar {

    address public certificationAuthority;
    address public registry;

    event Creation(address indexed registrant, address authority, string name, string contact, string legalName, string legalAddress, bool active);
    event Alternation(address indexed registrant, address authority, string name, string contact, string legalName, string legalAddress, bool active);
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

    function Registrar() {
        certificationAuthority = msg.sender;
        registrants.length++;
    }

    function getRegistrants() constant returns (address[]) {
        address[] memory rv = new address[](registrants.length);
        uint counter = 0;
        for (uint i = 0; i < registrants.length; i++) {
            if (registrants[i].active) {
                rv[counter] = registrants[i].addr;
                counter++;
            }
        }
        return rv;
    }

    function getRegistrant(address _registrant) constant returns(string, string, string, string, string, bool){
        uint pos = registrantIndex[_registrant];
        if (pos > 0)
            return (registrants[pos].name, registrants[pos].description, registrants[pos].contact, registrants[pos].legalName, registrants[pos].legalAddress, registrants[pos].active);
        return ("", "", "", "", "" , false);
    }

    function isActiveRegistrant(address _registrant) constant returns (bool) {
        uint pos = registrantIndex[_registrant];
        return (pos > 0 && registrants[pos].active);
    }

    function add(address _registrant, string _name, string _description, string _contact, string _legalName, string _legalAddress) returns (bool) {
        if (msg.sender != certificationAuthority || registrantIndex[_registrant] > 0) {
            Error(1); //permission denied
            return false;
        }
        uint pos = registrants.length ++;
        registrants[pos] = Registrant(_registrant, _name, _description, _contact, _legalName, _legalAddress, true);
        registrantIndex[_registrant] = pos;
        Creation(_registrant, msg.sender, _name, _contact, _legalName, _legalAddress, true);
    }

    function edit(address _registrant, string _name, string _description, string _contact, string _legalName, string _legalAddress, bool _active) returns (bool) {
        if (msg.sender != certificationAuthority || registrantIndex[_registrant] == 0) {
            Error(1); //permission denied
            return false;
        }
        Registrant registrant = registrants[registrantIndex[_registrant]];
        registrant.active = _active;
        registrant.name = _name;
        registrant.description = _description;
        registrant.contact = _contact;
        registrant.legalName = _legalName;
        registrant.legalAddress = _legalAddress;
        registrant.active = _active;
        Alternation(_registrant, msg.sender, _name, _contact, _legalName, _legalAddress, _active);
    }

    function setNextAuthority(address _ca) returns (bool) {
        if (msg.sender != certificationAuthority) {
            Error(1); //permission denied
            return false;
        }
        certificationAuthority = _ca;
    }

}
