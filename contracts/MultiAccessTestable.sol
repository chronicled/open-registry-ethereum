import 'MultiAccess.sol';

contract MultiAccessTestable is MultiAccess {
    function callTester() onlymanyowners(false) {
        multiAccessRecipient.call(msg.data);
    }
}