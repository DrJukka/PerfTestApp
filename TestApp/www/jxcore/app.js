(function () {

    /*----------------------------------------------------------------------------------
     code for connecting to the coordinator server
     -----------------------------------------------------------------------------------*/
    fs = require('fs');
    var socket = null;
    var parsedJSON = require('ipaddress.json');

    var myName = "Phone" + (Math.random() * (1000));

    console.log('my name is : '+ myName);
    console.log('Connect to  address : ' + parsedJSON[0].address + ' type: ' + parsedJSON[0].name);

    socket = require('socket.io-client')('http://' + parsedJSON[0].address + ':3000/');

    console.log('attempting to connect to test coordinator');

    socket.on('connect', function () {
        console.log('Client has connected to the server!');
        gotMessage('connect : ');
        socket.emit('identify device', myName);
    });

    socket.on('connect_error', function (err) {
        console.log('Client got connect_error : ' + err);
        gotMessage('connect_error : ' + err);
    });

    socket.on('connect_timeout', function (err) {
        console.log('Client got connect_timeout : ' + err);
        gotMessage('connect_timeout : ' + err);
    });

    socket.on('error', function (err) {
        console.log('Client got error : ' + err);
        gotMessage('error : ' + err);
    });

    // Add a disconnect listener
    socket.on('disconnect', function () {
        console.log('The client has disconnected!');
        gotMessage('disconnect');
    });

    /*----------------------------------------------------------------------------------
     code for handling communications with coordinator server
     -----------------------------------------------------------------------------------*/

    socket.on('message', function (data) {
        console.log('Received a message from the server!', data);
    });


    socket.on('chat message', function (msg) {
        console.log('chat message : ' + msg);
        gotMessage('chat message: ' + msg);
    });


    /****************************************************************************************
     Functions for testing stuff
     ****************************************************************************************/

    function sendGetRequest(message) {
        console.log('sendGetRequest called : ' + message);
        socket.emit('chat message', message);
    }


    /***************************************************************************************
     functions for Cordova side application, used for showing logs & sending test messages
     ***************************************************************************************/

    function isFunction(functionToCheck) {
        var getType = {};
        return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
    }


    var MessageCallback;

    function gotMessage(message) {
        if (isFunction(MessageCallback)) {
            MessageCallback(message);
        } else {
            console.log("MessageCallback not set !!!!");
        }
    }

    Mobile('SendMessage').registerAsync(function (message, callback) {
        console.log("SendMessage : " + message);
        sendGetRequest(message);
    });

    Mobile('setMessageCallback').registerAsync(function (callback) {
        MessageCallback = callback;
    });


    // Log that the app.js file was loaded.
    console.log('Test app app.js loaded');

})();