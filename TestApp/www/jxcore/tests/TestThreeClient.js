/**
 * Created by juksilve on 4.9.2015.
 */

'use strict';

var events = require('events');

var TestThreeTCPServer = require('./TestThreeTCPServer');
var TestThreeConnector = require('./TestThreeConnector');

function TestThreeClient(jsonData,name) {
    var self = this;
    console.log('TestThreeClient created ' + jsonData);
    var commandData = JSON.parse(jsonData);

    this.toFindCount    = commandData.count;
    this.foundSofar     = 0;
    this.timerId = null;
    this.foundPeers = {};
    this.resultArray = [];

    this.testServer = new TestThreeTCPServer();
    this.testConnector = new TestThreeConnector(commandData.rounds,commandData.dataAmount,commandData.conReTryTimeout,commandData.conReTryCount,commandData.dataTimeout);
    this.testConnector.on('done', function (data) {
        console.log('---- round done--------');
        var resultData = JSON.parse(data);
        for(var i=0; i < resultData.length; i++){
            self.resultArray.push(resultData[i]);
        }

        self.testStarted = false;
        if(!self.doneAlready) {
            self.startWithNextDevice();
        }
    });
    this.testConnector.on('debug', function (data) {
        self.emit('debug',data);
    });

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

    if(commandData.timeout){
        this.timerId = setTimeout(function() {
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

TestThreeClient.prototype = new events.EventEmitter;

TestThreeClient.prototype.stop = function() {
    console.log('TestThreeClient stopped');

    Mobile('StopBroadcasting').callNative(function (err) {
        if (err) {
            console.log('StopBroadcasting returned error ' + err);
        } else {
            console.log('StopBroadcasting went ok');
        }
    });

    this.testServer.stopServer();
}

TestThreeClient.prototype.peerAvailabilityChanged = function(peers) {
    console.log('peerAvailabilityChanged ' + peers);
    for (var i = 0; i < peers.length; i++) {
        var peer = peers[i];
        if((!this.foundPeers[peer.peerIdentifier]) || (!this.foundPeers[peer.peerIdentifier].doneAlready)) {
            this.foundPeers[peer.peerIdentifier] = peer;
            console.log("Found peer : " + peer.peerName + ", Available: " + peer.peerAvailable);
        }
    }

    if(!this.testStarted) {
        console.log("a");
        this.startWithNextDevice();
    }
}

TestThreeClient.prototype.startWithNextDevice = function() {

    if(this.foundSofar >= this.toFindCount){
        this.weAreDoneNow();
        return;
    }

    for(var peerId in this.foundPeers){
        if(this.foundPeers[peerId].peerAvailable && !this.foundPeers[peerId].doneAlready){
            this.testStarted = true;
            this.emit('debug', '--- start for : ' + this.foundPeers[peerId].peerName + ' ---');
            this.foundSofar++
            console.log('device[' + this.foundSofar +  ']: ' + this.foundPeers[peerId].peerIdentifier);

            this.foundPeers[peerId].doneAlready = true;
            this.testConnector.Start(this.foundPeers[peerId]);
            return;
        }
    }
}

TestThreeClient.prototype.weAreDoneNow = function() {

    if (this.timerId != null) {
        clearTimeout(this.timerId);
        this.timerId = null;
    }

    console.log('weAreDoneNow , resultArray.length: ' + this.resultArray.length);
    if(!this.doneAlready) {
        this.doneAlready = true;

        //first make sure we are stopped
        this.testConnector.Stop();
        //then get any data that has not been reported yet. i.e. the full rounds have not been done yet
        var resultData = this.testConnector.getResultArray();
        for(var i=0; i < resultData.length; i++){
            this.resultArray.push(resultData[i]);
        }

        this.emit('debug', "---- finished : send-data -- : resultArray.length: " + this.resultArray.length);
        this.emit('done', JSON.stringify(this.resultArray));
    }
}



module.exports = TestThreeClient;