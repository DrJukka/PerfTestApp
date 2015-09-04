/**
 * Created by juksilve on 4.9.2015.
 */



var net = require('net');
var events = require('events');

function TestThreeConnector(rounds,dataAmount,timeout,reTryTimeout,reTryMaxCount) {
    this.roundsToDo         = rounds;
    this.doneRounds         = 0;
    this.toSendDataAmount   = dataAmount;
    this.timeout            = timeout;
    this.reTryTimeout       = reTryTimeout;
    this.reTryMaxCount      = reTryMaxCount;
    this.clientSocket       = null;
    this.receivedCounter    = 0;
    this.timerId            = null;
    this.tryRounds          = 0;
    this.resultArray        = [];
    this.connectionCount    = 0;
}

TestThreeConnector.prototype = new events.EventEmitter;

TestThreeConnector.prototype.Start = function(peer) {
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
TestThreeConnector.prototype.Stop = function(peer) {
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

TestThreeConnector.prototype.doConnect = function(peer) {
    var self = this;

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

    this.connectionCount++;

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
                for (var i = 0; i < (((self.toSendDataAmount - self.receivedCounter) / 2) + 1); i++) {
                    numbers[i] = Math.floor(Math.random() * 10);
                }
                self.clientSocket.write(numbers.toString());
            });
            self.clientSocket.on('data', function (data) {

                if(data.toString().trim()  == "50000") {
                    self.receivedCounter = self.receivedCounter + 50000;
                }

                console.log('CLIENT is data received : ' + self.receivedCounter);

                if(self.receivedCounter >= self.toSendDataAmount){
                    self.endTime = new Date();
                    self.endReason = "OK";
                    console.log('got all data for this round');

                    //we only reset the value once we have gotten all data, so any re-connect will sent only missing data
                    self.receivedCounter = 0;
                    self.oneRoundDoneNow();
                }
            });
            self.clientSocket.on('close', function () {
                console.log('CLIENT is closed');
            });

            self.clientSocket.on('error', function (ex) {
                console.log("CLIENT got error : " + ex);
                self.tryAgain();
            });
        }
    });
}


TestThreeConnector.prototype.tryAgain = function() {
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

TestThreeConnector.prototype.oneRoundDoneNow = function() {
    this.Stop();

    var responseTime = this.endTime - this.startTime;
    this.resultArray.push({"name:":this.peer.peerName,"time":responseTime,"result":this.endReason,"connections":this.connectionCount});

    this.emit('debug','round[' +this.doneRounds + '] done in ' + responseTime + ' ms.');
    this.connectionCount = 0;

    this.doneRounds++;
    if(this.roundsToDo > this.doneRounds){
        this.tryRounds = 0;
        console.log('HUMPPAA');
        this.Start(this.peer);
        return;
    }

    //if we get this far, then we are done
    this.weAreDoneNow();
}

TestThreeConnector.prototype.weAreDoneNow = function() {
    this.Stop();
    this.emit('done', JSON.stringify(this.resultArray));
    //reset these for next peer test
    this.doneRounds = 0;
    this.tryRounds = 0;
    this.receivedCounter = 0;
    this.connectionCount = 0;
    this.resultArray = [];
}

module.exports = TestThreeConnector;
