/**
 * Created by juksilve on 3.9.2015.
 */

var net = require('net');
var events = require('events');

function TestTwoConnector(rounds,dataAmount,timeout,reTryTimeout,reTryMaxCount) {
    this.roundsToDo         = rounds;
    this.doneRounds         = 0;
    this.toSendDataAmount   = dataAmount;
    this.timeout            = timeout;
    this.reTryTimeout       = reTryTimeout;
    this.reTryMaxCount      = reTryMaxCount;
    this.clientSocket = null;
    this.timerId = null;
    this.tryRounds = 0;
    this.resultArray = [];
}

TestTwoConnector.prototype = new events.EventEmitter;

TestTwoConnector.prototype.Start = function(peer) {
    var self = this;
    this.peer = peer;
    console.log('Connect[' + this.tryRounds + '] to : ' + this.peer.peerName + 'Available: '  + this.peer.peerAvailable);
    if (this.timerId != null) {
        clearTimeout(this.timerId);
        this.timerId = null;
    }

    // make sure any previous connections are really out
    if(self.clientSocket != null) {
        console.log("CLIENT closeClientSocket");
        self.clientSocket.end();
        self.clientSocket = null;
    }

    //reset the values to make sure they are clean when we start
    this.startTime = new Date();
    this.endTime = new Date();
    this.endReason ="";

    this.doConnect(this.peer);
}
TestTwoConnector.prototype.Stop = function(peer) {
    console.log("CLIENT Stop now");

    //Closing Client socket, will also close connection
    if(this.clientSocket != null) {
        console.log("CLIENT closeClientSocket");
        this.clientSocket.end();
        this.clientSocket = null;
    }

    if (this.timerId != null) {
        clearTimeout(this.timerId);
        this.timerId = null;
    }
}

TestTwoConnector.prototype.doConnect = function(peer) {
    var self = this;
    var receivedCounter = 0;
    console.log("do connect now");
  /*  if(this.timeout){
        this.timerId = setTimeout(function() {
            console.log('Connect timeout now');
            self.endTime = new Date();
            self.endReason = "TIMEOUT";
            console.log('dun');
            self.tryAgain();
        }, this.timeout);
    }*/

    Mobile('Connect').callNative(peer.peerIdentifier, function (err, port) {
        console.log("CLIENT connected to " + port + ", error: " + err);

        if (this.timerId != null) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }

        if (err != null && err.length > 0) {
            console.log("CLIENT Can not Connect: " + err);

            self.endTime = new Date();
            self.endReason = err;
            self.tryAgain();

        } else if (port > 0) {
            console.log("CLIENT starting client ");

            self.clientSocket = net.connect(port, function () { //'connect' listener
                console.log("CLIENT now sending data: " + self.toSendDataAmount);
                var numbers = [];
                for (var i = 0; i < ((self.toSendDataAmount / 2) + 1); i++) {
                    numbers[i] = Math.floor(Math.random() * 10);
                }
                self.clientSocket.write(numbers.toString());
            });
            self.clientSocket.on('data', function (data) {
                receivedCounter = receivedCounter + data.length;
                console.log("CLIENT got : " + data.length + ", total : " + receivedCounter + " bytes.");

                if(receivedCounter >= self.toSendDataAmount){
                    self.endTime = new Date();
                    self.endReason = "OK";
                    self.oneRoundDoneNow();
                }
            });
            self.clientSocket.on('close', function () {
                console.log('CLIENT is closed');
            });

            self.clientSocket.on('error', function (ex) {
                console.log("CLIENT got error : " + ex);
            });
        }
    });
}
TestTwoConnector.prototype.tryAgain = function() {
    var self = this;
    this.tryRounds++;
    if(this.tryRounds >= self.reTryMaxCount) {
        this.oneRoundDoneNow();
        return;
    }

    console.log("tryAgain afer: " + self.reTryTimeout + " ms.");
    //lets try again after a short while
     setTimeout(function () {
         console.log("re-try now : " + self.peer.peerName);
         self.Start(self.peer);
     }, self.reTryTimeout);
}

TestTwoConnector.prototype.oneRoundDoneNow = function() {
    this.Stop();

    var responseTime = this.endTime - this.startTime;
    this.resultArray.push({"name:":this.peer.peerName,"time":responseTime,"result":this.endReason});

    this.emit('debug','round[' +this.doneRounds + '] done in ' + responseTime + ' ms.');

    this.doneRounds++;
    if(this.roundsToDo > this.doneRounds){
        this.tryRounds = 0;
        this.Start(this.peer);
        return;
    }

    //if we get this far, then we are done
    this.weAreDoneNow();
}

TestTwoConnector.prototype.weAreDoneNow = function() {
    this.Stop();
    this.emit('done', JSON.stringify(this.resultArray));
    //reset these for next peer test
    this.doneRounds = 0;
    this.tryRounds = 0;
    this.resultArray = [];
}

module.exports = TestTwoConnector;