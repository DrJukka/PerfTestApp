/**
 * Created by juksilve on 2.9.2015.
 */
'use strict';

var events = require('events');

function TestOneClient(jsonData,name) {
    var self = this;
    this.name = name;
    console.log('TestOneClient created ' + jsonData);

    var commandData = JSON.parse(jsonData);
    this.toFindCount = commandData.count;
    this.foundPeers = {};
    this.startTime = new Date();
    this.endTime = new Date();
    this.endReason ="";

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
        this.timerId = setTimeout(function() {
            console.log('timeout now');
            if(!self.doneAlready)
            {
                console.log('dun');
                self.endReason = "TIMEOUT";
                self.emit('debug', "*** TIMEOUT ***");
                self.weAreDoneNow();
            }
        }, commandData.timeout);
    }
}

TestOneClient.prototype = new events.EventEmitter;

TestOneClient.prototype.stop = function() {
    console.log('TestOneClient stopped');
    if (this.timerId != null) {
        clearTimeout(this.timerId);
        this.timerId = null;
    }

    Mobile('StopBroadcasting').callNative(function (err) {
        if (err) {
            console.log('StopBroadcasting returned error ' + err);
        } else {
            console.log('StopBroadcasting went ok');
        }
    });
}

TestOneClient.prototype.peerAvailabilityChanged = function(peers) {
    if(this.doneAlready){
        return;
    }
    console.log('peerAvailabilityChanged ' + peers);
    for (var i = 0; i < peers.length; i++) {
        var peer = peers[i];
        this.foundPeers[peer.peerIdentifier] = peer;
        if(!this.foundPeers[peer.peerIdentifier].foundTime){
            var nowTime = new Date();
            this.foundPeers[peer.peerIdentifier].foundTime = nowTime - this.startTime;
        }
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
        this.endReason = "OK";
        this.weAreDoneNow();
    }
}

TestOneClient.prototype.weAreDoneNow = function() {

    if (this.timerId != null) {
        clearTimeout(this.timerId);
        this.timerId = null;
    }

    console.log('weAreDoneNow');

    if(!this.doneAlready) {
        this.doneAlready = true;
        this.endTime = new Date();

        var replyData = [];
        var foundCount = 0;
        for (var foundPeer in this.foundPeers) {
            foundCount++;
            replyData.push({"peerName":this.foundPeers[foundPeer].peerName, "peerIdentifier": this.foundPeers[foundPeer].peerIdentifier, "peerAvailable":this.foundPeers[foundPeer].peerAvailable,"seekTime":this.foundPeers[foundPeer].foundTime});
        }

        this.emit('debug', "---- finished : findPeers -- ");
        var responseTime = this.endTime - this.startTime;
        this.emit('done', JSON.stringify({"name:":this.name,"time":responseTime,"result":this.endReason,"peersList":replyData}));
    }
}

module.exports = TestOneClient;