/**
 * Created by juksilve on 1.9.2015.
 */

'use strict';

var events = require('events');
var TestDevice = require('./TestDevice');
var configFile = require('./config.json');

/*
 {
 "name": "performance tests",
 "description": "basic performance tests for Thali apps framework",
 "startDeviceCount": "4",
 "tests": [
 {"name": "findPeers", "timeout": "30000","data": {"count": "3","timeout": "20000"}},
 {"name": "re-Connect", "timeout": "700000","data": {"count": "3","timeout": "600000","rounds":"6","dataTimeout":"5000","conReTryTimeout":"5000","conReTryCount":"5"}},
 {"name": "send-data", "timeout": "7000000","data": {"count": "3","timeout": "6000000","rounds":"3","dataAmount":"1000000","dataTimeout":"5000","conReTryTimeout":"5000","conReTryCount":"5"}}
 ]
 }
 */

function TestFramework() {
    this.timerId = null;
    this.testDevices = {};
    this.testResults = [];
    this.currentTest = -1;

    console.log('Start test : ' + configFile.name + ", start tests with " + configFile.startDeviceCount + " devices");

    for(var i=0; i < configFile.tests.length; i++) {
        console.log('Test[' + i + ']: ' + configFile.tests[i].name + ', timeout : ' + configFile.tests[i].timeout + ", data : " + JSON.stringify(configFile.tests[i].data));
    }
}

TestFramework.prototype = new events.EventEmitter;

TestFramework.prototype.addDevice = function(device){

    if(this.currentTest >= 0){
        console.log('test progressing ' + device.getName() + ' not added to tests');
        return;
    }

    this.testDevices[device.getName()] = device;
    console.log(device.getName() + ' added!');

    if(this.getConnectedDevicesCount() == configFile.startDeviceCount){
        console.log('----- start testing now -----');
        this.doNextTest();
    }
}

TestFramework.prototype.removeDevice = function(name){
    console.log(name + ' id now disconnected!');
    if(this.currentTest >= 0){
        if(this.testDevices[name]){
            console.log('test for ' + name + ' cancelled');
            this.ClientDataReceived(name,JSON.stringify({"result":"DISCONNECTED"}));
        }else {
            console.log('test progressing ' + name + ' is not removed from the list');
        }
        return;
    }

    //mark it removed from te list
    this.testDevices[name] = null;
}

TestFramework.prototype.ClientDataReceived = function(name,data){
    var jsonData = JSON.parse(data);

    //save the time and the time we got the results
    this.testDevices[name].data = jsonData;
    this.testDevices[name].endTime = new Date();

    var responseTime = this.testDevices[name].endTime - this.testDevices[name].startTime;
    console.log('with ' + name + ' request took : ' + responseTime + " ms.");

    if(this.getFinishedDevicesCount() == configFile.startDeviceCount){
        console.log('test[ ' + this.currentTest + '] done now.');
        this.testFinished();
    }
}

TestFramework.prototype.getFinishedDevicesCount  = function(){
    var devicesFinishedCount = 0;
    for (var deviceName in this.testDevices) {
        if(this.testDevices[deviceName] != null && this.testDevices[deviceName].data != null){
            devicesFinishedCount = devicesFinishedCount + 1;
        }
    }

    return devicesFinishedCount;
}

TestFramework.prototype.getConnectedDevicesCount  = function(){
    var count = 0;
    for (var deviceName in this.testDevices) {
        if(this.testDevices[deviceName] != null){
            count++;
        }
    }

    return count;
}
TestFramework.prototype.doNextTest  = function(){

    if(this.timerId != null) {
        clearTimeout(this.timerId);
        this.timerId = null;
    }

    this.currentTest++;
    if(configFile.tests[this.currentTest]){
        //if we have tests, then lets start new tests on all devices
        console.log('start test[' + this.currentTest + ']');
        for (var deviceName in this.testDevices) {
            if(this.testDevices[deviceName] != null){
                this.testDevices[deviceName].startTime = new Date();
                this.testDevices[deviceName].endTime = new Date();
                this.testDevices[deviceName].data = null;
                this.testDevices[deviceName].SendCommand('start',configFile.tests[this.currentTest].name,JSON.stringify(configFile.tests[this.currentTest].data));
           }
        }

        if(configFile.tests[this.currentTest].timeout) {
            this.timerId = setTimeout(this.testTimeOut, configFile.tests[this.currentTest].timeout);
        }
        return;
    }

    console.log('All tests are done !');
    console.log('--------------- test report ---------------------');
    for (var i=0; i < this.testResults.length; i++) {
        console.log('Test[' + this.testResults[i].test + '] for ' + this.testResults[i].device + ' took ' + this.testResults[i].time + " ms.");
        console.log('data.' + JSON.stringify(this.testResults[i].data));
        console.log('---------------');
    }
}
TestFramework.prototype.testTimeOut  = function(){
    console.log('*** TIMEOUT ****');
    this.testFinished();
}
TestFramework.prototype.testFinished  = function(){
    for (var deviceName in this.testDevices) {
        if (this.testDevices[deviceName] != null) {
            var responseTime = this.testDevices[deviceName].endTime - this.testDevices[deviceName].startTime;
            this.testResults.push({"test": this.currentTest, "device":deviceName,"time": responseTime,"data": this.testDevices[deviceName].data});

            //lets finalize the test by stopping it.
            this.testDevices[deviceName].SendCommand('stop',"","");

            //reset values for next testing round
            this.testDevices[deviceName].startTime = new Date();
            this.testDevices[deviceName].endTime = new Date();
            this.testDevices[deviceName].data = null;
        }
    }

    this.doNextTest()
}

module.exports = TestFramework;