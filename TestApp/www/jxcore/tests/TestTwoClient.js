/**
 * Created by juksilve on 3.9.2015.
 */
'use strict';

var events = require('events');

var TestTwoTCPServer = require('./TestTwoTCPServer');
var TestTwoConnector = require('./TestTwoConnector');

function TestTwoClient(jsonData,name) {
    var self = this;
    console.log('TestTwoClient created ' + jsonData);

    var commandData = JSON.parse(jsonData);
    this.toFindCount        = commandData.count;

    this.testServer = new TestTwoTCPServer();
    this.testConnector = new TestTwoConnector(commandData.rounds,commandData.dataAmount);

    console.log('check server');
    var serverPort = this.testServer.getServerPort();
    console.log('serverPort is ' + serverPort);

    Mobile('StartBroadcasting').callNative(name, serverPort, function (err) {
        if (err) {
            console.log('StartBroadcasting returned error ' + err);
        } else {
            console.log('StartBroadcasting started ok');
        }
    });

  /*  if(commandData.timeout){

        timerId = setTimeout(function() {
            console.log('timeout now');
            if(!self.doneAlready)
            {
                console.log('dun');
                self.emit('debug', "*** TIMEOUT ***");
                self.weAreDoneNow();
            }
        }, commandData.timeout);
    }*/
}

TestTwoClient.prototype = new events.EventEmitter;

TestTwoClient.prototype.stop = function() {
    console.log('TestTwoClient stopped');

    Mobile('StopBroadcasting').callNative(function (err) {
        if (err) {
            console.log('StopBroadcasting returned error ' + err);
        } else {
            console.log('StopBroadcasting went ok');
        }
    });

    this.testServer.stopServer();
}

TestTwoClient.prototype.peerAvailabilityChanged = function(peers) {
    console.log('peerAvailabilityChanged ' + peers);
    for (var i = 0; i < peers.length; i++) {
        this.testConnector.addPeer(peer);
    }
}
var timerId = null;

TestTwoClient.prototype.weAreDoneNow = function() {

    if (timerId != null) {
        clearTimeout(timerId);
        timerId = null;
    }

    console.log('weAreDoneNow');

    if(!this.doneAlready) {

        var replyData = [];
        for (var foundPeer in this.foundPeers) {
            replyData.push({"peerName":this.foundPeers[foundPeer].peerName, "peerIdentifier": this.foundPeers[foundPeer].peerIdentifier, "peerAvailable":this.foundPeers[foundPeer].peerAvailable});
        }

        this.emit('debug', "---- finished : re-Connect -- ");
        this.emit('done', JSON.stringify(replyData));
        this.doneAlready = true;
    }
}



module.exports = TestTwoClient;