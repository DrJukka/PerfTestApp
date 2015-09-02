/**
 * Created by juksilve on 2.9.2015.
 */
'use strict';
var net = require('net');

var server = null;

function TestTCPServer(port) {

    this.stopServer();

    server = net.createServer(function (c) { //'connection' listener
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
            // BUGBUG: On the desktop this event listener is not necessary. But on JXCore on Android
            // we have to include this handler or no data will ever arrive at the server.
            // Please see https://github.com/jxcore/jxcore/issues/411
            console.log("We received data on the socket the server is listening on - " + data.toString());
            gotMessage("data: " + data.toString());
            c.write("Got data : " + data.toString());
        });

        // when using piping, I don't get 'data' events, and as in debug time I want to log them
        // I'm doing write operations in the data event, instead doing the piping
        // c.pipe(c);
    });

    server.on('error', function (data) {
        console.log("serverSocket error: " + data.toString());
    });
    server.on('close', function () {
        console.log('server socket is disconnected');
    });

    server.listen(port, function() { //'listening' listener
        console.log('server is bound to : ' + port);
    });
}
TestTCPServer.prototype.getServerPort = function() {
    return server.address().port;
}

TestTCPServer.prototype.stopServer = function() {
    if(server == null) {
        return;
    }

    server.close();
    server = null;
}

module.exports = TestTCPServer;