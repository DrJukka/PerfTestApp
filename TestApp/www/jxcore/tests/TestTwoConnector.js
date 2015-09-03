/**
 * Created by juksilve on 3.9.2015.
 */

var net = require('net');


function TestTwoConnector(rounds,dataAmount) {
    this.toConnectRounds    = rounds;
    this.toSendDataAmount   = dataAmount;
    this.foundPeers = {};
    this.clientSocket = null;
    this.doingRound = false;
    this.resultArray = [];
    this.currentTest = -1;

}

TestTwoConnector.prototype.addPeer = function(peer) {

    this.foundPeers[peer.peerIdentifier] = peer;
    this.emit('debug',"Found peer : " + peer.peerName + ", Available: "  + peer.peerAvailable);
    console.log("Found peer : " + peer.peerName + ", peerAvailable: "  + peer.peerAvailable);

    if(!this.doingRound) {
        this.startTestRound(peer);
    }
}

TestTwoConnector.prototype.startTestRound = function(peer) {

    var self = this;

    if(!self.doingRound) {
        self.doingRound = true;

        var tmpName = peer.peerName;
        console.log("do connect now");
        Mobile('Connect').callNative(peer.peerIdentifier, function (err, port) {
            console.log("CLIENT connected to " + port + ", error: " + err);

            if (err != null && err.length > 0) {
                console.log("CLIENT Can not Connect: " + err);
            } else if (port > 0) {
                console.log("CLIENT starting client ");

                // start client socket which will be then connected by native code;
                if(self.clientSocket != null) {
                    console.log("CLIENT closeClientSocket");
                    self.clientSocket.end();
                    self.clientSocket = null;
                }

                self.clientSocket = net.connect(port, function () { //'connect' listener
                    console.log("CLIENT We have successfully connected to the server: " + self.toSendDataAmount);
                    var numbers =  [];
                    for (var i = 0; i < ((self.toSendDataAmount / 2) + 1); i++) {
                        numbers[i] = Math.floor(Math.random() * 10);
                    }
                    self.clientSocket.write(numbers.toString());
                });
                self.clientSocket.on('data', function (data) {
                    console.log("CLIENT got data: " + data.length + " bytes.");
                });
                self.clientSocket.on('close', function () {
                    console.log('CLIENT is closed');
                });

                self.clientSocket.on('error', function(ex) {
                    console.log("CLIENT got error : " + ex);
                });
            }
        });
    }
}


module.exports = TestTwoConnector;