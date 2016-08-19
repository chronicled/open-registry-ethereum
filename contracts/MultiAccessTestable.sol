// Copyright (c) 2016 Chronicled, Inc. All rights reserved.

import 'MultiAccess.sol';

contract MultiAccessTestable is MultiAccess {
    function callTester() onlymanyowners(false) {
        multiAccessRecipient.call(msg.data);
    }
}
