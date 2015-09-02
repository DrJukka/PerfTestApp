/**
 * Created by juksilve on 2.9.2015.
 */
'use strict';
var events = require('events');

var TestOneClient = require('./tests/TestOneClient');

var currentTest = null;

function TestFrameworkClient(name) {

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
                    currentTest = new TestOneClient(commandData.testData,this.deviceName);
                    currentTest.on('done', function (data) {
                        self.emit('done',data);
                    });
                    break;
                }
            }
            break;
        }
        case 'stop':{
            this.stopAllTests();
            break;
        }
        default:{
            console.log('unknown commandData : ' + commandData.command);
        }
    }
}
TestFrameworkClient.prototype.stopAllTests = function() {
    console.log('stop tests now !');
    if(currentTest != null){
        console.log('stop current!');
        currentTest.stop();
        currentTest = null;
    }
}

module.exports = TestFrameworkClient;