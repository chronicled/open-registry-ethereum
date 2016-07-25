import "Registrar.sol";

contract Registry {
    address public registrarAddress;
    address public owner;

    /**
    * Creation event that gets triggered when a thing is created.
    * event
    * @param identity - The identity of the thing.
    * @param owner - The owner address.
    * @param position - The position of the thing in the array.
    */
    event Creation(bytes32 indexed identity, address indexed owner, uint position);

    /**
    * Update event that gets triggered when a thing is updated.
    * event
    * @param identity - The identity of the thing.
    * @param owner - The owner address.
    * @param isValid - The validity of the thing.
    * @param position - The position of the thing in the array.
    */
    event Update(bytes32 indexed identity, address indexed owner, bool isValid, uint position);

    /**
    * Error event.
    * event
    * @param code - The error code.
    * 1: conflict, identity already registered with another thing.
    * 2: not found, identity does not exist.
    * 3: unauthorzied, modification only by owner.
    * 4: unknown schema.
    * 5: bad request, at least one identity needed.
    * 6: bad request, at least one data needed.
    */
    event Error(uint code, bytes32 reference);

    struct Thing {
        address ownerAddress;
        uint schemaReference;
        bytes32[] data;
        bool isValid;
    }

    mapping(bytes32 => uint) public identities;

    Thing[] public things;
    string[] public schemas;

    /**
    * Function cant have ether.
    * modifier
    */
    modifier noEther() {
        if (msg.value > 0) throw;
        _
    }

    /**
    * Allow only registrants to exec the function.
    * modifier
    * @param _registrant - The registrant address.
    */
    modifier isRegistrant(address _registrant) {
        Registrar registrar = Registrar(registrarAddress);
        if (registrar.isActiveRegistrant(_registrant)) {
            _
        }
    }

    /**
    * Allow only CA to exec the function.
    * modifier
    * @param _ca - The CA address.
    */
    modifier isCertificationAuthority(address _ca) {
        Registrar registrar = Registrar(registrarAddress);
        if (registrar.certificationAuthority() == _ca) {
            _
        }
    }

    /**
    * Construct registry with starting schema and things lenght of one.
    * constructor
    */
    function Registry() {
        things.length++;
        schemas.length++;
        owner = msg.sender;
    }

    /**
    * Create a new thing on things array.
    * internalfunction
    * @param _caller - The caller of the function.
    * @param _schemaIndex - The schema index of the schema to parse the thing.
    * @param _data - The data array.
    * @param _identities - The identities array.
    */
    function _create(address _caller, uint _schemaIndex, bytes32[] _data, bytes32[] _identities) internal returns (bool) {
        uint pos = things.length++;
        if (!_update(_caller, pos, _schemaIndex, _data, _identities)){
            things.length--;
            return false;
        }
        return true;
    }

    /**
    * Update an existing thing on things array.
    * internalfunction
    * @param _caller - The caller of the function.
    * @param _pos - The position of the thing in the array.
    * @param _schemaIndex - The schema index of the schema to parse the thing.
    * @param _data - The data array.
    * @param _identities - The identities array.
    */
    function _update(address _caller, uint _pos, uint _schemaIndex, bytes32[] _data, bytes32[] _identities) internal returns (bool) {
        if (_schemaIndex >= schemas.length || _schemaIndex == 0) {
            Error(4, _identities[0]);
            return false;
        }
        if (_identities.length == 0) {
            Error(5, 0);
            return false;
        }
        if (_data.length == 0) {
            Error(6, 0);
            return false;
        }
        if (things[_pos].ownerAddress != 0x0 && things[_pos].ownerAddress != _caller) {
            Error(3, _identities[0]);
            return false;
        }
        for (uint i = 0; i < _identities.length; i++) {
            uint previous = identities[_identities[i]];
            if (previous > 0 && previous != _pos) {
                Error(1, _identities[i]);
                return false;
            }
        }
        things[_pos] = Thing(_caller, _schemaIndex, _data, true);
        for (uint k = 0; k < _identities.length; k++) {
            if (identities[_identities[k]] == 0) {
                identities[_identities[k]] = _pos;
                Creation(_identities[k], _caller, _pos);
            }
        }
        return true;
    }

    /**
    * Set a thing as valid.
    * internalfunction
    * @param _caller - The caller of the function.
    * @param _identity - The identities array.
    * @param _isValid - The validity of the thing.
    */
    function _setValid(address _caller, bytes32 _identity, bool _isValid) internal returns (bool) {
        uint pos = identities[_identity];
        if (pos == 0) {
            Error(2, _identity);
            return false;
        }
        Thing thing = things[pos];
        if (thing.ownerAddress != _caller) {
            Error(3, _identity);
            return false;
        }
        thing.isValid = _isValid;
        return true;
    }

    /**
    * Set a thing as valid.
    * internalfunction
    * @param _caller - The caller of the function.
    * @param _pos - The position of the thing in teh array.
    * @param _identity - The identity of the thing.
    */
    function _linkIdentity(address _caller, uint _pos, bytes32 _identity) internal returns (bool) {
        if (_pos >= things.length || _pos == 0 || identities[_identity] > 0) {
            Error(2, _identity);
            return false;
        }
        Thing thing = things[_pos];
        if (thing.ownerAddress != _caller) {
            Error(3, _identity);
            return false;
        }
        identities[_identity] = _pos;
        Update(_identity, _caller, thing.isValid, _pos);
        return true;
    }

    //################# PUBLIC FUNCTIONS

    /**
    * Set the registrar address for the contract, (This function can be called only once).
    * public_function
    * @param _registrarAddress - The registrar address.
    */
    function configure(address _registrarAddress) noEther returns (bool) {
        if ((registrarAddress != 0x0) || (msg.sender != owner)) {
            Error(3, bytes32(registrarAddress));
            return false;
        }
        registrarAddress = _registrarAddress;
        return true;
    }

    /**
    * Create a new thing on things array, only registrants allowed.
    * public_function
    * @param _schemaIndex - The schema index of the schema to parse the thing.
    * @param _data - The data array.
    * @param _identities - The identities array.
    */
    function create(uint _schemaIndex, bytes32[] _data, bytes32[] _identities) isRegistrant(msg.sender) noEther returns (bool) {
        return _create(msg.sender, _schemaIndex, _data, _identities);
    }

    /**
    * Update a thing in things array, only registrants allowed.
    * public_function
    * @param _pos - The position of the thing in the array.
    * @param _schemaIndex - The schema index of the schema to parse the thing.
    * @param _data - The data array.
    * @param _identities - The identities array.
    */
    function update(uint _pos, uint _schemaIndex, bytes32[] _data, bytes32[] _identities) isRegistrant(msg.sender) noEther returns (bool) {
        return _update(msg.sender, _pos, _schemaIndex, _data, _identities);
    }

    /**
    * Allows entries with _identities of 1 times 32bytes only; others have to be added through linkIdentity later, only registrants allowed.
    * Review: user should be aware that if there will be not enough identities transaction will run out of gas.
    * Review: user should be aware that providing too many identities will result in some of them not being used.
    * public_function
    * @param _schemaIndex - The schema index of the schema to parse the thing.
    * @param _dataLength - The data lenght of every thing to add.
    * @param _data - The data array.
    * @param _identities - The identities array.
    */
    function createMany(uint _schemaIndex, uint8[] _dataLength, bytes32[] _data, bytes32[] _identities) isRegistrant(msg.sender) noEther returns (bool) {
        uint thingPosition = 0;
        for (uint i = 0; i < _identities.length; i++) {
            uint8 length = _dataLength[i];
            bytes32[] memory datas = new bytes32[](length);
            for (uint j = 0; j < length; j++) {
                datas[j] = _data[thingPosition + j];
            }
            thingPosition += length;
            bytes32[] memory ids = new bytes32[](1);
            ids[0] = _identities[i];
            _create(msg.sender, _schemaIndex, datas, ids);
        }
        // Review: maybe check if there is identities left and throw if so? => done
        if (thingPosition != _data.length) {
            return false;
        }
        return true;
    }

    /**
    * Link new identity to a thing, only registrants allowed.
    * public_function
    * @param _pos - The index position of the thing.
    * @param _identity - The identity to link.
    */
    function linkIdentity(uint _pos, bytes32 _identity) isRegistrant(msg.sender) noEther returns (bool success) {
        return _linkIdentity(msg.sender, _pos, _identity);
    }

    /**
    * Set validity of a thing, only registrants allowed.
    * public_function
    * @param _identity - The identity to change.
    * @param _isValid - The new validity of the thing.
    */
    function setValid(bytes32 _identity, bool _isValid) isRegistrant(msg.sender) noEther returns (bool) {
        return _setValid(msg.sender, _identity, _isValid);
    }

    /**
    * Add a new schema, only CA allowed.
    * public_function
    * @param _schema - New schema string to add.
    * The string should use the schema protobuf on the schemas folder on sdk
    */
    function addSchema(string _schema) isCertificationAuthority(msg.sender) noEther returns (uint) {
        uint pos = schemas.length++;
        schemas[pos] = _schema;
        return pos;
    }

    /**
    * Get a thing data, schema and validity.
    * constant_function
    * @param _identity - identity of the thing.
    */
    function getThing(bytes32 _identity) constant returns (string, bytes32[], bool) {
        uint pos = identities[_identity];
        if (pos == 0) {
            Error(2, _identity);
            return;
        }
        Thing thing = things[pos];
        return (schemas[thing.schemaReference], thing.data, thing.isValid);
    }

    /**
    * Check any identity presence.
    * constant_function
    * @param _identities - identities to check.
    */
    function checkAnyIdentity(bytes32[] _identities) constant returns (bool) {
        for (uint k = 0; k < _identities.length; k++) {
            if (identities[_identities[k]] > 0) return true;
        }
        return false;
    }

    function () noEther {}
}
