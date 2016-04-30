// imports
var express = require("express");
var app = express();
rov_socket = new require("net").Socket();
page_socket = require("express-ws")(app);



//*** HTTP STUFF ***//
// constants
const HTTP_PORT = 3000;
const LOCKOUT = false;  // set flag to true to lock control to localhost only.
                        // otherwise, the drive screen will be served to every request
                        // and not just requests from localhost

// set path for static files
app.use(express.static(__dirname + "/static"));

// respond to http get requests
app.get('/', function(req, res) {
  // test for localhost login;
  var address = req.socket.remoteAddress;
  localhost_addr = /127.0.0.1/;
  if(!localhost_addr.test(address) && LOCKOUT) {
    res.render(__dirname + "/source/templates/remote.pug", {"address": address});
  } else {
    res.render(__dirname + "/source/templates/localhost.pug");
  }
});



//*** SOCKET STUFF ***//
// set options and connect to the rov
const reconnect_interval = 1000;
rov_socket.readable = true;
rov_socket.writable = true;
const rov_socket_options = {"address":"127.0.0.1", "port":"8100"};
rov_socket.connect(rov_socket_options);

// handle rov communications
// listen for an unsuccessful connection to the rov
rov_socket.on("error", function() {
  console.log("connection to the rov failed");
});

// listen for a closed connection to the rov
rov_socket.on("close", function() {
  console.log("connection to the rov closed");
  rov_connected = false;
  // start auto-reconnect
  reconnect(reconnect_interval);
});

// listen for a successful connection to the rov
rov_socket.on("connect", function() {
  console.log("connected to the rov at " + rov_socket.remoteAddress + ":" + rov_socket.remotePort);
});

// try to connect to the socket after the interval delay
function reconnect(interval) {
  setTimeout(function() {
    if(!rov_connected) {
      console.log("reconnecting to ROV...");
      rov_socket.connect(rov_socket_options);
    }
  }, interval);
}

// handle page communications
app.ws('/', function(ws, req) {
  
  // figure out how to determine localhost vs other
  console.log("connected to a page");
  rov_socket.on("close", RovStatusFalse);
  rov_socket.on("connect", RovStatusTrue);
 
  // listen for a closed connection to the page
  ws.on("close", function() {
    console.log("connection to the page closed");
    rov_socket.removeListener("close", RovStatusFalse);
    rov_socket.removeListener("connect", RovStatusTrue);
  });

  // update rov connection status
  function RovStatusFalse() {
    ws.send(JSON.stringify({"rov_connected": false}));
  };

  // update rov connection status
  function RovStatusTrue() {
    ws.send(JSON.stringify({"rov_connected": true}));
  };

// listen for data from the page
  ws.on("message", function(data) {
    console.log("received from page: " + data);
    page_data = JSON.parse(data);
    switch(page_data.event_type) {
      case "console_btn":
        switch(page_data.data.buttonID) {
          case "hmc_init":
            rov_socket.write(JSON.stringify({"action":"hmc_init"}));
            break;
          case "pca_init":
            rov_socket.write(JSON.stringify({"action":"pca_init"}));
            break;
          default:
            console.log("bad command - special event with a bad data.buttonID value");
        }
        break;
      case "hid_data":
        rov_data = {"action": "hid_data", "data": {}};
        rov_data.data = page_data.data;
        rov_socket.write(JSON.stringify(rov_data));
        break;
      case "data_update":
        break;
      default:
    }
  });

  // listen for data from the rov (needs to be in page mgmt to be able to write to page)
  rov_socket.on("data", function(data) {
    console.log("received from rov: " + data);
    rov_data = JSON.parse(data);
    // parse and store output data
    // structure and send page data dump
    // ws.send(stuff)
  });
});



//*** START SERVER ***//
// listen to port 3000
app.listen(HTTP_PORT, function() {
  console.log("Listening on port " + HTTP_PORT);
  console.log("__dirname root: " + __dirname);
  console.log("localhost lockout status: " + LOCKOUT);
});
