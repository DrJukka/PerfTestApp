/**
 * Created by juksilve on 2.9.2015.
 */
'use strict';

var events = require('events');


function TestOneClient(jsonData,name) {
    var self = this;
    console.log('TestOneClient created ' + jsonData);

    var commandData = JSON.parse(jsonData);
    this.toFindCount = commandData.count;
    this.foundPeers = {};

    var serverPort = 8876;//we are not connectin, thus we can use fake port here.
    console.log('serverPort is ' + serverPort);

    Mobile('StartBroadcasting').callNative(name, serverPort, function (err) {
        if (err) {
            console.log('StartBroadcasting returned error ' + err);
        } else {
            console.log('StartBroadcasting started ok');
        }
    });

    if(commandData.timeout){

        timerId = setTimeout(function() {
            console.log('timeout now');
            if(!self.doneAlready)
            {
                console.log('dun');
                self.emit('debug', "*** TIMEOUT ***");
                self.weAreDoneNow();
            }
        }, commandData.timeout);
    }
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
}

TestOneClient.prototype.peerAvailabilityChanged = function(peers) {
    console.log('peerAvailabilityChanged ' + peers);
    for (var i = 0; i < peers.length; i++) {
        var peer = peers[i];
        this.foundPeers[peer.peerIdentifier] = peer;
        if(this.foundPeers[peer.peerIdentifier].peerAvailable) {
            this.emit('debug', "Found peer : " + peer.peerName + ", Available: " + peer.peerAvailable);
            console.log("Found peer : " + peer.peerName + ", peerAvailable: " + peer.peerAvailable);
        }
    }

    var howManyWeDiscoveredAlready = 0;
    for (var foundPeer in this.foundPeers) {
        if (this.foundPeers[foundPeer].peerAvailable) {
            howManyWeDiscoveredAlready = howManyWeDiscoveredAlready + 1;
        }
    }

    if(howManyWeDiscoveredAlready >= this.toFindCount && !this.doneAlready){
        this.weAreDoneNow();
    }
}
var timerId = null;

TestOneClient.prototype.weAreDoneNow = function() {

    if (timerId != null) {
        clearTimeout(timerId);
        timerId = null;
    }

    console.log('weAreDoneNow');

    if(!this.doneAlready) {
        this.doneAlready = true;
        var replyData = [];
        for (var foundPeer in this.foundPeers) {
            replyData.push({"peerName":this.foundPeers[foundPeer].peerName, "peerIdentifier": this.foundPeers[foundPeer].peerIdentifier, "peerAvailable":this.foundPeers[foundPeer].peerAvailable});
        }

        this.emit('debug', "---- finished : findPeers -- ");
        this.emit('done', JSON.stringify(replyData));

    }
}


module.exports = TestOneClient;