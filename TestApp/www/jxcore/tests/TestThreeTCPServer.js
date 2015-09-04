/**
 * Created by juksilve on 4.9.2015.
 */

'use strict';
var net = require('net');


function TestThreeTCPServer(port) {

    var dataCount = 0;
    var lastReportedCount = 0;
    var limitToReport = 10000;

    this.stopServer();
    this.server = net.createServer(function (c) { //'connection' listener
        console.log('TCP/IP server connected');

        c.on('end', function () {
            console.log('TCP/IP server is ended');
        });
        c.on('close', function () {
            console.log('TCP/IP server is close');
        });
        c.on('error', function (err) {
            console.log('TCP/IP server got error : ' + err);
        });

        c.on('data', function (data) {
            dataCount = dataCount + data.length;

            if(dataCount / limitToReport > lastReportedCount){
                lastReportedCount++;
                c.write("10000");
            }
        });

        // when using piping, I don't get 'data' events, and as in debug time I want to log them
        // I'm doing write operations in the data event, instead doing the piping
        // c.pipe(c);
    });

    this.server.on('error', function (data) {
        console.log("TCP/IP server  error: " + data.toString());
    });
    this.server.on('close', function () {
        console.log('TCP/IP server  socket is disconnected');
    });

    this.server.listen(port, function(port) { //'listening' listener
        console.log('TCP/IP server  is bound to : ' + port);
    });
}
TestThreeTCPServer.prototype.getServerPort = function() {
    return (this.server && this.server.address()) ? this.server.address().port : 0;
}

TestThreeTCPServer.prototype.stopServer = function() {
    if(this.server == null) {
        return;
    }

    this.server.close();
    this.server = null;
}

module.exports = TestThreeTCPServer;