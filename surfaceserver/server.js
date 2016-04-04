// imports
var express = require("express")
var logger = require("morgan")
var app = express()
page_socket = require("express-ws")(app)
rov_socket = new require("net").Socket()



//*** HTTP STUFF ***//
// constants
const HTTP_PORT = 3000
const LOCKOUT = false   // set flag to true to lock control to localhost only.
                        // otherwise, the drive screen will be served to every request
                        // and not just requests from localhost

// set path for static files
app.use(express.static(__dirname + "/static"))

app.get('/', function(req, res) {
  // test for localhost login
  var address = req.socket.remoteAddress
  localhost_addr = /127.0.0.1/
  if(!localhost_addr.test(address) && LOCKOUT) {
    res.render(__dirname + "/source/templates/remote.jade", {"address": address})
  } else {
    res.render(__dirname + "/source/templates/localhost.jade")
  }
})



//*** SOCKET STUFF ***//
// variable to hold the state of the socket
open = false

// set options and connect to the rov
rov_socket.readable = true
rov_socket.writable = true
rov_socket_options = {"address":"127.0.0.1", "port":"8100"}
rov_socket.connect(rov_socket_options) 

// listen for an unsuccessful connection to the rov
rov_socket.on("error", function() {
  console.log("connection to the rov failed")
})

// listen for a closed connection to the rov
rov_socket.on("close", function() {
  console.log("connection to the rov closed")
  open = false
})

// listen for a successful connection to the rov
rov_socket.on("connect", function() {
  console.log("connected to the rov at " + rov_socket.remoteAddress + ":" + rov_socket.remotePort)
  open = true
})

// handle page communications
app.ws('/', function(ws, req) {
  console.log("page connected")

  // listen for messages from the page
  ws.on('message', function(msg) {
    console.log("received from page: " + msg)
    if(open) {
      rov_socket.write(msg + "\r\n")
    } else {
      ws.send("ROV not connected!")
    }
  })

  // listen for data from the rov
  rov_socket.on("data", function(data) {
    console.log("received from rov: " + data)
    ws.send("" + data)
  })
})



//*** START SERVER ***//
// listen to port 3000
app.listen(HTTP_PORT, function() {
  console.log("Listening on port " + HTTP_PORT)
  console.log("__dirname root: " + __dirname)
  console.log("localhost lockout status: " + LOCKOUT)
})
