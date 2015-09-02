/**
 * Created by juksilve on 2.9.2015.
 */
'use strict';

var events = require('events');

var TestTCPServer = require('./TestTCPServer');
var testServer = new TestTCPServer();

function TestOneClient(jsonData,name) {
    console.log('TestOneClient created ' + jsonData);

    var commandData = JSON.parse(jsonData);
    this.toFindCount = commandData.count;
    this.foundPeers = {};

    var serverPort = testServer.getServerPort();
    console.log('serverPort is ' + serverPort);

    Mobile('StartBroadcasting').callNative(name, serverPort, function (err) {
        if (err) {
            console.log('StartBroadcasting returned error ' + err);
        } else {
            console.log('StartBroadcasting started ok');
        }
    });
}

TestOneClient.prototype = new events.EventEmitter;

TestOneClient.prototype.stop = function() {
    console.log('TestOneClient stopped');

    Mobile('StopBroadcasting').callNative(function (err) {
        if (err) {
            console.log('StopBroadcasting returned error ' + err);
        } else {
            console.log('StopBroadcasting went ok');
        }
    });

    testServer.stopServer();
}

TestOneClient.prototype.peerAvailabilityChanged = function(peers) {
    console.log('peerAvailabilityChanged ' + peers);
    for (var i = 0; i < peers.length; i++) {
        var peer = peers[i];
        this.foundPeers[peer.peerIdentifier] = peer;
        console.log("Found peer : " + peer.peerName + ", peerAvailable: "  + peer.peerAvailable);
    }

    var howManyWeDiscoveredAlready = 0;
    var replyData = [];
    for (var foundPeer in this.foundPeers) {
        replyData.push({"peerName":this.foundPeers[foundPeer].peerName, "peerIdentifier": this.foundPeers[foundPeer].peerIdentifier, "peerAvailable":this.foundPeers[foundPeer].peerAvailable});

        if (this.foundPeers[foundPeer].peerAvailable) {
            howManyWeDiscoveredAlready = howManyWeDiscoveredAlready + 1;
        }
    }

    if(howManyWeDiscoveredAlready >= this.toFindCount){
        this.emit('done',JSON.stringify(replyData));
    }
}


module.exports = TestOneClient;