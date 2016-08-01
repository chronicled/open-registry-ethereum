var EventsHelper = function() {
  var allEventsWatcher = undefined;

  var waitReceipt = function(transactionHash, address) {
    return new Promise(function(resolve, reject) {
      var transactionCheck = function() {
        var receipt = web3.eth.getTransactionReceipt(transactionHash);
        if (receipt) {
          var count = 0;
          if (address) {
            receipt.logs.forEach(function(log) {
              count += log.address === address ? 1 : 0;
            });
          } else {
            count = receipt.logs.length;
          }
          return resolve(count);
        } else {
          setTimeout(transactionCheck, 100);
        }
      };
      transactionCheck();
    });
  };

  var waitEvents = function(watcher, count, txHash) {
    return new Promise(function(resolve, reject) {
      var transactionCheck = function() {
        watcher.get(function(err, events) {
          if (err) {
            console.log(err);
            return reject(err);
          }
          eventsTx = events.filter(function(event) { return event.transactionHash == txHash; });
          if (eventsTx) {
            if (eventsTx.length == count) {
              return resolve(eventsTx);
            }
            if (eventsTx.length > count) {
              console.log(eventsTx);
              return reject("Filter produced " + eventsTx.length + " events, while receipt produced only " + count + " logs.");
            }
          }
          setTimeout(transactionCheck, 100);
        });
      };
      transactionCheck();
    });
  };

  this.getEvents = function(transactionHash, watcher) {
    if (allEventsWatcher === undefined) {
      throw "Call setupEvents before target transaction send."
    }
    return new Promise(function(resolve, reject) {
      waitReceipt(transactionHash, watcher.options.address).then(function(logsCount) {
        return waitEvents(allEventsWatcher, logsCount, transactionHash);
      }).then(function() {
        watcher.get(function(err, events) {
          if (err) {
            console.log(err);
            return reject(err);
          }
          var filtered = events.filter(function(event) {
            return event.transactionHash === transactionHash;
          });
          return resolve(filtered);
        });
      });
    });
  };

  this.setupEvents = function(contract) {
    allEventsWatcher = contract.allEvents();
  }
};

module.exports = new EventsHelper();