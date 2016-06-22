contract MultiAccessTester {
    uint public calls;

    function MultiAccessTester() {
        calls = 0;
    }

    function callTester() {
        calls++;
    }
}