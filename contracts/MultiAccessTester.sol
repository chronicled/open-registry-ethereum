// Copyright (c) 2016 Chronicled, Inc. All rights reserved.

contract MultiAccessTester {
    uint public calls;

    function MultiAccessTester() {
        calls = 0;
    }

    function callTester() {
        calls++;
    }
}
