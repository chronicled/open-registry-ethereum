contract Registrar {
    address public certificationAuthority;

    /**
    * Creation event that gets triggered when a new registrant gets created.
    * event
    * @param registrant - The registrant address.
    * @param authority - The CA address.
    * @param data - The data of the registrant.
    */
    event Creation(address indexed registrant, address authority, string data);

    /**
    * Update event that gets triggered when a new registrant id updated.
    * event
    * @param registrant - The registrant address.
    * @param authority - The CA address.
    * @param data - The data of the registrant.
    */
    event Update(address indexed registrant, address authority, string data, bool active);

    /**
    * Error event.
    * event
    * @param code - The error code.
    * 1: Permission denied.
    */
    event Error(uint code);

    struct Registrant {
        address addr;
        string data;
        bool active;
    }

    mapping(address => uint) public registrantIndex;
    Registrant[] public registrants;

    /**
    * Function can't have ether.
    * modifier
    */
    modifier noEther() {
        if (msg.value > 0) throw;
        _
    }

    /**
    * Construct registry with starting registrants lenght of one, and CA as msg.sender.
    * constructor
    */
    function Registrar() {
        certificationAuthority = msg.sender;
        registrants.length++;
    }

    /**
    * Add a registrant, only CA allowed.
    * public_function
    * @param _registrant - The registrant address.
    * @param _data - The registrant data string.
    */
    function add(address _registrant, string _data) noEther returns (bool) {
        if (msg.sender != certificationAuthority || registrantIndex[_registrant] > 0) {
            Error(1); // permission denied
            return false;
        }
        uint pos = registrants.length++;
        registrants[pos] = Registrant(_registrant, _data, true);
        registrantIndex[_registrant] = pos;
        Creation(_registrant, msg.sender, _data);
        return true;
    }

    /**
    * Edit a registrant, only CA allowed.
    * public_function
    * @param _registrant - The registrant address.
    * @param _data - The registrant data string.
    */
    function edit(address _registrant, string _data, bool _active) noEther returns (bool) {
        if (msg.sender != certificationAuthority || registrantIndex[_registrant] == 0) {
            Error(1); // permission denied
            return false;
        }
        Registrant registrant = registrants[registrantIndex[_registrant]];
        registrant.data = _data;
        registrant.active = _active;
        Update(_registrant, msg.sender, _data, _active);
        return true;
    }

    /**
    * Set new CA address, only CA allowed.
    * public_function
    * @param _ca - The new CA address.
    */
    function setNextAuthority(address _ca) noEther returns (bool) {
        if (msg.sender != certificationAuthority) {
            Error(1); // permission denied
            return false;
        }
        certificationAuthority = _ca;
        return true;
    }

    /**
    * Function to reject simple sends to the contract.
    * fallback_function
    */
    function () noEther {}

    /**
    * Get if a regsitrant is active or not.
    * constant_function
    * @param _registrant - The registrant address.
    */
    function isActiveRegistrant(address _registrant) constant returns (bool) {
        uint pos = registrantIndex[_registrant];
        return (pos > 0 && registrants[pos].active);
    }

    /**
    * Get all the registrants.
    * constant_function
    */
    function getRegistrants() constant returns (address[]) {
        address[] memory result = new address[](registrants.length-1);
        for (uint j = 1; j < registrants.length; j++) {
            result[j-1] = registrants[j].addr;
        }
        return result;
    }
}
