contract Registrar {

    address public certificationAuthority;
    address public registry;

    event Creation(address indexed registrant, address authority, bytes32 name, bytes32 contact, bytes32 legalName, bytes32 legalAddress, bytes32 legalCity, bool active);
    event Alternation(address indexed registrant, address authority, bytes32 name, bytes32 contact, bytes32 legalName, bytes32 legalAddress, bytes32 legalCity, bool active);
     //1: permission denied
    event Error(uint code);

    struct Registrant {
        address addr;
        bytes32 name;
        string description;
        bytes32 contact;
        bytes32 legalName;
        bytes32 legalAddress;
        bytes32 legalCity;
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

    function getRegistrant(address _registrant) constant returns(bytes32, string, bytes32, bytes32, bytes32, bytes32, bool){
        uint pos = registrantIndex[_registrant];
        if (pos > 0)
            return (registrants[pos].name, registrants[pos].description, registrants[pos].contact, registrants[pos].legalName, registrants[pos].legalAddress, registrants[pos].legalCity, registrants[pos].active);
        return ("", "", "", "", "","", false);
    }

    function isActiveRegistrant(address _registrant) constant returns (bool) {
        uint pos = registrantIndex[_registrant];
        return (pos > 0 && registrants[pos].active);
    }

    function add(address _registrant, bytes32 _name, string _description, bytes32 _contact, bytes32 _legalName, bytes32 _legalAddress, bytes32 _legalCity) returns (bool) {
        Error(2);
        if (msg.sender != certificationAuthority || registrantIndex[_registrant] > 0) {
            Error(1); //permission denied
            return false;
        }
        uint pos = registrants.length ++;
        registrants[pos] = Registrant(_registrant, _name, _description, _contact, _legalName, _legalAddress, _legalCity, true);
        registrantIndex[_registrant] = pos;
        Creation(_registrant, msg.sender, _name, _contact, _legalName, _legalAddress, _legalCity, true);
    }

    function edit(address _registrant, bytes32 _name, string _description, bytes32 _contact, bytes32 _legalName, bytes32 _legalAddress, bytes32 _legalCity, bool _active) returns (bool) {
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
        registrant.legalCity = _legalCity;
        registrant.active = _active;
        Alternation(_registrant, msg.sender, _name, _contact, _legalName, _legalAddress, _legalCity, _active);
    }

    function setNextAuthority(address _ca) returns (bool) {
        if (msg.sender != certificationAuthority) {
            Error(1); //permission denied
            return false;
        }
        certificationAuthority = _ca;
    }

}
