# Performance Test Application for BtConnector plug-in

## current state

Currently there is just initial framework soft-of-thing ready. The framework implements communications between devices & coordinator server.

All devices & the machine where the coordinator server is run must be using same Wi-Fi network.

Currently the device simply connects to the coordinator server and identifies him-selves

each device can sent messages, and server simply relays that to all parties.

There is possibility on also seeing chat-logs with browser.

## Plan

the planned logic would work a bit like this:
- Each device starts, connects to the coordinator, and identifies themselves
- coordinator waits for N devices to connect to it

And for Each tests cases specified the logic could be something like this:
- coordinator sends start command to all devices (all devices call start broadcasting)
- devices send ACK for successful starting 
- coordinator asks devices start specified test
- each device report when tests is handled
- coordinator sends End command to all devices (all devices call stop broadcasting)
- the end command can be sent when all devices have reported that they finished the test, or when there is a time-out for the test.

### usage

Before running anything do remember to use npm install to get the required nodejs modules installed. 

If additional modules are required, then there is package.json file present in the folder.

## Coordinator server

Go to the folder where you have the index.js located and run it : node index.js

Check the console output for any possible errors reported

Make sure the ipaddress.json file is created. It should contain the IP-Address for the connected Wi-Fi network. 

## Phone Thali application

Create standard Thali app with the plugin: https://github.com/thaliproject/Thali_CordovaPlugin

Then add the content of the TestApp\www\ folder to the www folder  of the Thali app.

Do also remember to copy the ipaddress.json into the jxcore folder!