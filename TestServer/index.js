var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');

var os = require('os');
var ifaces = os.networkInterfaces();


Object.keys(ifaces).forEach(function (ifname) {
  var alias = 0;

  ifaces[ifname].forEach(function (iface) {
    if ('IPv4' !== iface.family || iface.internal !== false) {
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      return;
    }

    if (ifname.indexOf("Wi-Fi") > -1) {
      // this interface has only one ipv4 adress
      console.log(ifname, iface.address);

      fs.writeFile("./ipaddress.json", JSON.stringify({name: ifname, address: iface.address}), function (err) {
        if (err) {
          return console.log(err);
        }
        console.log("The file was saved!");
      });
    }
  });
});


app.get('/', function(req, res) {
  console.log("HTTP get called");
  res.sendfile('index.html');
});

io.on('connection', function(socket) {
  console.log("got connection");

  socket.on('chat message', function (msg) {
    console.log("got chat message: " + msg);
    io.emit('chat message', msg);
  });

  socket.on('disconnect', function () {
    console.log("Client disconnect: ");
  });

  socket.on('identify device', function (msg) {
    console.log("Client identified: : " + msg);
  });

});

http.listen(3000, function() {
  console.log('listening on *:3000');
});