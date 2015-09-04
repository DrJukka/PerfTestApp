/**
 * Created by juksilve on 1.9.2015.
 */

'use strict';

var events = require('events');
var TestDevice = require('./TestDevice');
var configFile = require('./config.json');

var testDevices = {};
var testResults = [];

var currentTest = -1;

/*
 {
 "name": "performance tests",
 "description": "basic performance tests for Thaili apps framework",
 "startDeviceCount": "4",
 "tests": [
 {"name": "findPeers", "timeout": "30000","data": {"count": "3","timeout": "20000"}},
 {"name": "re-Connect", "timeout": "90000","data": {"count": "3","timeout": "80000","rounds":"3","dataAmount":"100","conTimeout":"5000","conReTryTimeout":"2000","conReTryCount":"3"}},
 {"name": "send-data", "timeout": "120000","data": {"count": "1","timeout": "110000","rounds":"3","dataAmount":"1000000","conTimeout":"5000","conReTryTimeout":"2000","conReTryCount":"3"}}

 ]
 }
 */

function TestFramework() {
    console.log('Start test : ' + configFile.name + ", start tests with " + configFile.startDeviceCount + " devices");

    for(var i=0; i < configFile.tests.length; i++) {
        console.log('Test[' + i + ']: ' + configFile.tests[i].name + ', timeout : ' + configFile.tests[i].timeout + ", data : " + JSON.stringify(configFile.tests[i].data));
    }

    currentTest = -1;
}

TestFramework.prototype = new events.EventEmitter;

TestFramework.prototype.addDevice = function(device){

    if(currentTest >= 0){
        console.log('test progressing ' + device.getName() + ' not added to tests');
        return;
    }

    testDevices[device.getName()] = device;
    console.log(device.getName() + ' added!');

    if(this.getConnectedDevicesCount() == configFile.startDeviceCount){
        console.log('----- start testing now -----');
        doNextTest();
    }
}

TestFramework.prototype.removeDevice = function(name){
    console.log(name + ' id now disconnected!');
    if(currentTest >= 0){
        console.log('test progressing ' + name + ' is not removed from the list');
        return;
    }

    //mark it removed from te list
    testDevices[name] = null;
}

TestFramework.prototype.ClientDataReceived = function(name,data){
    var jsonData = JSON.parse(data);

    //save the time and the time we got the results
    testDevices[name].data = jsonData;
    testDevices[name].endTime = new Date();

    var responseTime = testDevices[name].endTime - testDevices[name].startTime;
    console.log('with ' + name + ' request took : ' + responseTime + " ms.");

    if(this.getFinishedDevicesCount() == configFile.startDeviceCount){
        console.log('test[ ' + currentTest + '] done now.');
        testFinished();
    }
}

TestFramework.prototype.getFinishedDevicesCount  = function(){
    var devicesFinishedCount = 0;
    for (var deviceName in testDevices) {
        if(testDevices[deviceName] != null && testDevices[deviceName].data != null){
            devicesFinishedCount = devicesFinishedCount + 1;
        }
    }

    return devicesFinishedCount;
}

TestFramework.prototype.getConnectedDevicesCount  = function(){
    var count = 0;
    for (var deviceName in testDevices) {
        if(testDevices[deviceName] != null){
            count++;
        }
    }

    return count;
}

var timerId = null;

function doNextTest(){

    if(timerId != null) {
        clearTimeout(timerId);
        timerId = null;
    }

    currentTest++;
    if(configFile.tests[currentTest]){
        //if we have tests, then lets start new tests on all devices
        console.log('start test[' + currentTest + ']');
        for (var deviceName in testDevices) {
            if(testDevices[deviceName] != null){
                testDevices[deviceName].startTime = new Date();
                testDevices[deviceName].endTime = new Date();
                testDevices[deviceName].data = null;
                testDevices[deviceName].SendCommand('start',configFile.tests[currentTest].name,JSON.stringify(configFile.tests[currentTest].data));
           }
        }

        if(configFile.tests[currentTest].timeout) {
            timerId = setTimeout(testTimeOut, configFile.tests[currentTest].timeout);
        }
        return;
    }

    console.log('All tests are done !');
    console.log('--------------- test report ---------------------');
    for (var i=0; i < testResults.length; i++) {
        console.log('Test[' + testResults[i].test + '] for ' + testResults[i].device + ' took ' + testResults[i].time + " ms.");
        console.log('data.' + JSON.stringify(testResults[i].data));
        console.log('---------------');
    }
}
function testTimeOut(){
    console.log('*** TIMEOUT ****');
    testFinished();
}
function testFinished(){
    for (var deviceName in testDevices) {
        if (testDevices[deviceName] != null) {
            var responseTime = testDevices[deviceName].endTime - testDevices[deviceName].startTime;
            testResults.push({"test": currentTest, "device":deviceName,"time": responseTime,"data": testDevices[deviceName].data});

            //lets finalize the test by stopping it.
            testDevices[deviceName].SendCommand('stop',"","");

            //reset values for next testing round
            testDevices[deviceName].startTime = new Date();
            testDevices[deviceName].endTime = new Date();
            testDevices[deviceName].data = null;
        }
    }

    doNextTest()
}

module.exports = TestFramework;