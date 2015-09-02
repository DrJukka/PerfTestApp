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

function TestFramework() {
    console.log('Start test : ' + configFile.name + ", start tests with " + configFile.startDeviceCount + " devices");
    console.log('Test 1 : ' + configFile.tests[0].name + ", has data : " + JSON.stringify(configFile.tests[0].data));
    currentTest = -1;
}

TestFramework.prototype = new events.EventEmitter;

TestFramework.prototype.addDevice = function(device){

    if(currentTest >= 0){
        console.log('test progressing ' + device.getName() + ' not added to tests');
        return;
    }

    console.log(device.getName() + ' added!');
    testDevices[device.getName()] = device;

    if(this.getConnectedDevicesCount() == configFile.startDeviceCount){
        console.log('start testing now');
        doNextTest();
    }
}

TestFramework.prototype.removeDevice = function(name){
    console.log(name + ' id now disconnected!');

    if(currentTest < 0){
        testDevices[name] = null;
    }
    //else we have tests progressing, and we dont want to mark it as null

}

TestFramework.prototype.ClientDataReceived = function(name,data){
    var jsonData = JSON.parse(data);

    //save the time and the time we got the results
    testDevices[name].data = jsonData;
    testDevices[name].endTime = new Date();

    var responseTime = testDevices[name].endTime - testDevices[name].startTime;
    console.log('with ' + name + ' request took : ' + responseTime + " ms.");

    var devicesFinishedCount = 0;
    for (var deviceName in testDevices) {
        if(testDevices[deviceName] != null && testDevices[deviceName].data != null){
            devicesFinishedCount = devicesFinishedCount + 1;
        }
    }

    if(devicesFinishedCount == configFile.startDeviceCount){
        console.log('test[ ' + currentTest + '] done now.');

        for (var deviceName in testDevices) {
            if (testDevices[deviceName] != null) {
                var responseTime = testDevices[deviceName].endTime - testDevices[deviceName].startTime;
                testResults.push({"test": currentTest, "device":deviceName,"time": responseTime,"data": testDevices[deviceName].data});

                //lets finalize the test by stopping it.
                testDevices[deviceName].SendCommand('stop',"","");
            }
        }

        doNextTest()
    }
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

function doNextTest(){
    console.log('doNextTest!');

    currentTest = currentTest + 1;
    if(configFile.tests[currentTest]){
        //if we have tests, then lets start new tests on all devices
        for (var deviceName in testDevices) {
            if(testDevices[deviceName] != null){
                testDevices[deviceName].SendCommand('start',configFile.tests[currentTest].name,JSON.stringify(configFile.tests[currentTest].data));
                testDevices[deviceName].startTime = new Date();
                testDevices[deviceName].data = null;
           }
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


module.exports = TestFramework;