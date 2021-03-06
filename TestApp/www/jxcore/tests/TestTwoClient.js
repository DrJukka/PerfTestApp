/**
 * Created by juksilve on 3.9.2015.
 */
'use strict';

var events = require('events');

var TestTwoTCPServer = require('./TestTwoTCPServer');
var TestTwoConnector = require('./TestTwoConnector');

function TestTwoClient(jsonData,name) {
    console.log('TestTwoClient created ' + jsonData);
    this.startTime = new Date();
    this.endTime = new Date();
    this.endReason ="";
    this.name = name;

    var self = this;
    this.debugCallback = function(data) {
        self.emit('debug',data);
    }

    this.doneCallback = function(data) {
        console.log('---- round done--------');
        var resultData = JSON.parse(data);
        for(var i=0; i < resultData.length; i++){
            self.resultArray.push(resultData[i]);
        }

        self.testStarted = false;
        if(!self.doneAlready) {
            self.startWithNextDevice();
        }
    }

    var commandData = JSON.parse(jsonData);

    this.toFindCount    = commandData.count;
    this.foundSofar     = 0;
    this.timerId = null;
    this.foundPeers = {};
    this.resultArray = [];

    this.testServer = new TestTwoTCPServer();
    this.testConnector = new TestTwoConnector(commandData.rounds,commandData.conReTryTimeout,commandData.conReTryCount,commandData.dataTimeout);
    this.testConnector.on('done', this.doneCallback);
    this.testConnector.on('debug',this.debugCallback);

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
        self.timerId = setTimeout(function() {
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

    if(this.testConnector != null){
        this.testConnector.Stop();
        this.testConnector.removeListener('done', this.doneCallback);
        this.testConnector.removeListener('debug', this.debugCallback);
        this.testConnector = null;
    }
    this.doneAlready = true;
}

TestTwoClient.prototype.peerAvailabilityChanged = function(peers) {
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

TestTwoClient.prototype.startWithNextDevice = function() {
    if(this.doneAlready || this.testConnector == null) {
       return;
    }

    if(this.foundSofar >= this.toFindCount){
        this.endReason = "OK";
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

TestTwoClient.prototype.weAreDoneNow = function() {
    if (this.doneAlready || this.testConnector == null) {
        return;
    }

    if (this.timerId != null) {
        clearTimeout(this.timerId);
        this.timerId = null;
    }

    console.log('weAreDoneNow , resultArray.length: ' + this.resultArray.length);
    this.doneAlready = true;
    this.endTime = new Date();

    //first make sure we are stopped
    this.testConnector.Stop();
    //then get any data that has not been reported yet. i.e. the full rounds have not been done yet
    var resultData = this.testConnector.getResultArray();
    for (var i = 0; i < resultData.length; i++) {
        this.resultArray.push(resultData[i]);
    }

    this.emit('debug', "---- finished : re-Connect -- ");
    var responseTime = this.endTime - this.startTime;
    this.emit('done', JSON.stringify({"name:":this.name,"time":responseTime,"result":this.endReason,"connectList":this.resultArray}));
}

module.exports = TestTwoClient;