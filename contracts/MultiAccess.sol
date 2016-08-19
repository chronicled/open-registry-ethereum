// Copyright (c) 2016 Chronicled, Inc. All rights reserved.

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

    /**
    * Recipient contract requirement change event.
    * event
    * @param newRecipientRequirement - The uint of the new recipient requirement.
    */
    event RecipientRequirementChanged(uint newRecipientRequirement);

    struct PendingState {
        bool[] ownersDone;
        uint yetNeeded;
        bytes32 op;
    }

    mapping(bytes32 => uint) pendingIndex;
    PendingState[] pending;

    uint public multiAccessRequired;
    uint public multiAccessRecipientRequired;

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
    modifier onlymanyowners(bool _isSelfFunction) {
        if (_confirmAndCheck(_isSelfFunction)) {
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
        multiAccessRecipientRequired = 1;
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
    * @param _isSelfFunction - Is this a self or recipient function call.
    */
    function _confirmAndCheck(bool _isSelfFunction) onlyowner() internal returns (bool) {
        bytes32 operation = sha3(msg.data);
        uint index = ownerIndex[msg.sender];
        if (multiAccessHasConfirmed(operation, msg.sender)) {
            return false;
        }

        var pos = pendingIndex[operation];
        if (pos == 0) {
            pos = pending.length++;
            pending[pos].yetNeeded = _isSelfFunction ? multiAccessRequired : multiAccessRecipientRequired;
            pending[pos].op = operation;
            pendingIndex[operation] = pos;
        }

        var pendingOp = pending[pos];
        if (pendingOp.yetNeeded <= 1) {
            Confirmation(msg.sender, operation, true);
            if (pos < pending.length-1) {
                PendingState last = pending[pending.length-1];
                pending[pos] = last;
                pendingIndex[last.op] = pos;
            }
            pending.length--;
            delete pendingIndex[operation];
            return true;
        } else {
            Confirmation(msg.sender, operation, false);
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
    function _clearPending() internal {
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
    function multiAccessChangeOwner(address _from, address _to) onlymanyowners(true) external {
        if (multiAccessIsOwner(_to)) {
            return;
        }
        uint index = ownerIndex[_from];
        if (index == 0) {
            return;
        }

        _clearPending();
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
    function multiAccessAddOwner(address _owner) onlymanyowners(true) external {
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
    function multiAccessRemoveOwner(address _owner) onlymanyowners(true) external {
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
        _clearPending();
        OwnerRemoved(_owner);
    }

    /**
    * Change the requirement.
    * external_function
    * @param _newRequired - The new amount of required signatures.
    */
    function multiAccessChangeRequirement(uint _newRequired) onlymanyowners(true) external {
        if (_newRequired == 0 || _newRequired > multiAccessOwners.length-1) {
            return;
        }
        multiAccessRequired = _newRequired;
        _clearPending();
        RequirementChanged(_newRequired);
    }

    /**
    * Change the recipient requirement.
    * external_function
    * @param _newRecipientRequired - The new amount of recipient required signatures.
    */
    function multiAccessChangeRecipientRequirement(uint _newRecipientRequired) onlymanyowners(true) {
        if (_newRecipientRequired == 0) {
            return;
        }
        multiAccessRecipientRequired = _newRecipientRequired;
        _clearPending();
        RecipientRequirementChanged(_newRecipientRequired);
    }

    /**
    * Set the recipient.
    * public_function
    * @param _address - The multiAccessRecipient address.
    */
    function multiAccessSetRecipient(address _address) onlymanyowners(true) returns(bool _success) {
        if (multiAccessRecipient == _address) {
            return true;
        }
        multiAccessRecipient = _address;
        _clearPending();
        return true;
    }

    /**
    * Call arbitrary address.
    * public_function
    * @param _to - The address to call.
    * @param _value - The value of wei to send with the call.
    * @param _data - Message data to send with the call.
    */
    function multiAccessCall(address _to, uint _value, bytes _data) onlymanyowners(true) returns(bool _success) {
        return _to.call.value(_value)(_data);
    }

    function() onlymanyowners(false) returns(bool _success) {
        if (msg.data.length > 0) {
            return multiAccessRecipient.call(msg.data);
        }
        return false;
    }
}
