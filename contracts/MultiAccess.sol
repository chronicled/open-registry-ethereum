contract MultiAccess {

    address public multiAccessRecipient;

    /**
    * Confirmation event.
    * event
    * @param owner - The owner address.
    * @param operation - The operation name.
    * @param completed - If teh operation is completed or not.
    */
    event Confirmation(address indexed owner, bytes32 indexed operation, bool completed);

    /**
    * Revoke event.
    * event
    * @param owner - The owner address.
    * @param operation - The operation name.
    */
    event Revoke(address owner, bytes32 operation);

    /**
    * Owner change event.
    * event
    * @param oldOwner - The old owner address.
    * @param newOwner - The new owner address.
    */
    event OwnerChanged(address oldOwner, address newOwner);

    /**
    * Owner addedd event.
    * event
    * @param newOwner - The new owner address.
    */
    event OwnerAdded(address newOwner);

    /**
    * Owner removed event.
    * event
    * @param oldOwner - The old owner address.
    */
    event OwnerRemoved(address oldOwner);

    /**
    * Requirement change event.
    * event
    * @param newRequirement - The uint of the new requirement.
    */
    event RequirementChanged(uint newRequirement);

    struct PendingState {
        bool[] ownersDone;
        uint yetNeeded;
        bytes32 op;
    }

    mapping(bytes32 => uint) pendingIndex;
    PendingState[] pending;

    uint public multiAccessRequired;

    mapping(address => uint) ownerIndex;
    address[] public multiAccessOwners;

    /**
    * Allow only the owner on msg.sender to exec the function.
    * modifier
    */
    modifier onlyowner {
        if (multiAccessIsOwner(msg.sender)) {
            _
        }
    }

    /**
    * Allow only if many owners has agreed to exec the function.
    * modifier
    */
    modifier onlymanyowners(bytes32 _operation) {
        if (confirmAndCheck(_operation)) {
            _
        }
    }

    /**
    * Construct of MultiAccess with the msg.sender and only multiAccessOwner and multiAccessRequired as one.
    * constructor
    */
    function MultiAccess() {
        multiAccessOwners.length = 2;
        multiAccessOwners[1] = msg.sender;
        ownerIndex[msg.sender] = 1;
        multiAccessRequired = 1;
        pending.length = 1;
    }

    /**
    * Know if an owner has confirmed an operation.
    * public_function
    * @param _owner - The caller of the function.
    * @param _operation - The data array.
    */
    function multiAccessHasConfirmed(bytes32 _operation, address _owner) constant returns (bool) {
        uint pos = pendingIndex[_operation];
        if (pos == 0) {
            return false;
        }
        uint index = ownerIndex[_owner];
        var pendingOp = pending[pos];
        if (index >= pendingOp.ownersDone.length) {
            return false;
        }
        return pendingOp.ownersDone[index];
    }

    /**
    * Confirm an operation.
    * internalfunction
    * @param _operation - The operation name.
    */
    function confirmAndCheck(bytes32 _operation) onlyowner() internal returns (bool) {
        uint index = ownerIndex[msg.sender];
        if (multiAccessHasConfirmed(_operation, msg.sender)) {
            return false;
        }

        var pos = pendingIndex[_operation];
        if (pos == 0) {
            pos = pending.length++;
            pending[pos].yetNeeded = multiAccessRequired;
            pending[pos].op = _operation;
            pendingIndex[_operation] = pos;
        }

        var pendingOp = pending[pos];
        if (pendingOp.yetNeeded <= 1) {
            Confirmation(msg.sender, _operation, true);
            if (pos < pending.length-1) {
                PendingState last = pending[pending.length-1];
                pending[pos] = last;
                pendingIndex[last.op] = pos;
            }
            pending.length--;
            delete pendingIndex[_operation];
            return true;
        } else {
            Confirmation(msg.sender, _operation, false);
            pendingOp.yetNeeded--;
            if (index >= pendingOp.ownersDone.length) {
                pendingOp.ownersDone.length = index+1;
            }
            pendingOp.ownersDone[index] = true;
        }

        return false;
    }

    /**
    * Remove all the pending operations.
    * internalfunction
    */
    function clearPending() internal {
        uint length = pending.length;
        for (uint i = length-1; i > 0; --i) {
            delete pendingIndex[pending[i].op];
            pending.length--;
        }
    }

    /**
    * Know if an address is an multiAccessOwner.
    * public_function
    * @param _addr - The operation name.
    */
    function multiAccessIsOwner(address _addr) constant returns (bool) {
        return ownerIndex[_addr] > 0;
    }

    /**
    * Revoke a vote from an operation.
    * public_function
    * @param _operation -The operation name.
    */
    function multiAccessRevoke(bytes32 _operation) onlyowner() external {
        uint index = ownerIndex[msg.sender];
        if (!multiAccessHasConfirmed(_operation, msg.sender)) {
            return;
        }
        var pendingOp = pending[pendingIndex[_operation]];
        pendingOp.ownersDone[index] = false;
        pendingOp.yetNeeded++;
        Revoke(msg.sender, _operation);
    }

    /**
    * Change the address of one owner.
    * external_function
    * @param _from - The old address.
    * @param _to - The new address.
    */
    function multiAccessChangeOwner(address _from, address _to) onlymanyowners(sha3(msg.data)) external {
        if (multiAccessIsOwner(_to)) {
            return;
        }
        uint index = ownerIndex[_from];
        if (index == 0) {
            return;
        }

        clearPending();
        multiAccessOwners[index] = _to;
        delete ownerIndex[_from];
        ownerIndex[_to] = index;
        OwnerChanged(_from, _to);
    }

    /**
    * Add a owner.
    * external_function
    * @param _owner - The address to add.
    */
    function multiAccessAddOwner(address _owner) onlymanyowners(sha3(msg.data)) external {
        if (multiAccessIsOwner(_owner)) {
            return;
        }
        uint pos = multiAccessOwners.length++;
        multiAccessOwners[pos] = _owner;
        ownerIndex[_owner] = pos;
        OwnerAdded(_owner);
    }

    /**
    * Remove a owner.
    * external_function
    * @param _owner - The address to remove.
    */
    function multiAccessRemoveOwner(address _owner) onlymanyowners(sha3(msg.data)) external {
        uint index = ownerIndex[_owner];
        if (index == 0) {
            return;
        }
        if (multiAccessRequired >= multiAccessOwners.length-1) {
            return;
        }
        if (index < multiAccessOwners.length-1) {
            address last = multiAccessOwners[multiAccessOwners.length-1];
            multiAccessOwners[index] = last;
            ownerIndex[last] = index;
        }
        multiAccessOwners.length--;
        delete ownerIndex[_owner];
        clearPending();
        OwnerRemoved(_owner);
    }

    /**
    * Change the requirement.
    * external_function
    * @param _newRequired - The new amounts of required owners.
    */
    function multiAccessChangeRequirement(uint _newRequired) onlymanyowners(sha3(msg.data)) external {
        if (_newRequired == 0 || _newRequired > multiAccessOwners.length-1) {
            return;
        }
        multiAccessRequired = _newRequired;
        clearPending();
        RequirementChanged(_newRequired);
    }

    /**
    * Set the recipient.
    * public_function
    * @param _address - The multiAccessRecipient address.
    */
    function multiAccessSetRecipient(address _address) onlymanyowners(sha3(msg.data)) returns(bool _success) {
        multiAccessRecipient = _address;
        return true;
    }

    function() onlymanyowners(sha3(msg.data)) returns(bool _success) {
        if (msg.data.length > 0) {
            return multiAccessRecipient.call(msg.data);
        }
        return false;
    }
    // DEPLOY REMOVE START
    function callTester() onlymanyowners(sha3(msg.data)) {
        multiAccessRecipient.call(msg.data);
    }
    // DEPLOY REMOVE END
}
