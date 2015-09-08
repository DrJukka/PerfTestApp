/**
 * Created by juksilve on 2.9.2015.
 */
'use strict';
var events = require('events');

var TestOneClient  = require('./tests/TestOneClient');
var TestTwoClient  = require('./tests/TestTwoClient');
var TestThreeClient= require('./tests/TestThreeClient');

var currentTest = null;

function TestFrameworkClient(name) {
    var self = this;

    this.debugCallback = function(data) {
        self.emit('debug',data);
    }

    this.doneCallback = function(data) {
        self.emit('done',data);
    }

    this.deviceName= name;

    // Register peerAvailabilityChanged callback.
    Mobile('peerAvailabilityChanged').registerToNative(function (args) {
        console.log('peerAvailabilityChanged called');
        if(currentTest != null){
            currentTest.peerAvailabilityChanged(args);
        }
    });

    Mobile('networkChanged').registerToNative(function (args) {
        console.log('networkChanged called');
        var network = args[0];
        console.log(JSON.stringify(network));

        if (network.isReachable) {
            console.log('****** NETWORK REACHABLE!!!');
        }
        if(network.isWiFi){
            console.log('****** WIFI is on!!!');
        }
    });
}

TestFrameworkClient.prototype = new events.EventEmitter;

TestFrameworkClient.prototype.handleCommand = function(command){
    var self = this;
    var commandData = JSON.parse(command);

    switch(commandData.command){
        case 'start':{
            console.log('Star now : ' + commandData.testName);
            this.stopAllTests(); //Stop any previous tets if still running
            switch(commandData.testName){
                case 'findPeers':{
                    self.emit('debug',"---- start : findPeers -- ");
                    currentTest = new TestOneClient(commandData.testData,this.deviceName);
                    break;
                }
                case 're-Connect':{
                    self.emit('debug',"---- start : re-Connect -- ");
                    currentTest = new TestTwoClient(commandData.testData,this.deviceName);
                    break;
                }
                case 'send-data':{
                    self.emit('debug',"---- start : send-data -- ");
                    currentTest = new TestThreeClient(commandData.testData,this.deviceName);
                    break;
                }
                default:{
                    self.emit('done',JSON.stringify({"result":"TEST NOT IMPLEMENTED"}));
                    break;
                }
            }
            self.setCallbacks(currentTest);
            break;
        }
        case 'stop':{
            self.emit('debug',"stop");
            this.stopAllTests();
            break;
        }
        default:{
            console.log('unknown commandData : ' + commandData.command);
        }
    }
}
TestFrameworkClient.prototype.setCallbacks = function(test) {
    if (test == null) {
        return;
    }
    test.on('done', this.doneCallback);
    test.on('debug', this.debugCallback);
}


TestFrameworkClient.prototype.stopAllTests = function() {
    console.log('stop tests now !');
    if (currentTest == null) {
        return;
    }
    console.log('stop current!');
    currentTest.stop();
    currentTest.removeListener('done', this.doneCallback);
    currentTest.removeListener('debug', this.debugCallback);
    currentTest = null;
}

module.exports = TestFrameworkClient;