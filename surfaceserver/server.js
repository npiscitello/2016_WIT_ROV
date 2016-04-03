//*** HTTP STUFF ***//
// imports
var express = require("express")
var logger = require("morgan")
var app = express()

// constants
const PORT = 3000

// set path for static files
app.use(express.static(__dirname + "/static"))

app.get('/', function(req, res) {
  // test for localhost login
  var address = req.socket.remoteAddress
  localhost_addr = /127.0.0.1/
  if(localhost_addr.test(address)) {
    res.render(__dirname + "/source/templates/localhost.jade")
  } else {
    res.render(__dirname + "/source/templates/remote.jade", {address: address})
  }
})

// listen to port 3000
app.listen(PORT, function() {
  console.log("Listening on port " + PORT)
  console.log("__dirname root: " + __dirname)
})

//*** SOCKET STUFF ***//
// imports
page_socket = new require("net").Server()
rov_socket = new require("net").Socket()

// set options and open a socket
page_socket.listen(8000, "10.0.2.15", function() {
  console.log("socket opened at " + page_socket.address().address + ":" + page_socket.address().address)
})

// set options and connect to the rov
rov_socket_options = {"address":"127.0.0.1", "port":"8100"}
rov_socket.connect(rov_socket_options) 

// manage connections to the page socket
page_socket.on("connection", function(page) {
  console.log("page connected: " + page.remoteAddress + ":" + page.remotePort)
 
  // handle data incoming from the page 
  page.on("data", function(data) {
    console.log(data)
  })
})

// listen for a successful connection to the rov
rov_socket.on("connect", function() {
  console.log("connect to the rov at " + rov_socket.remoteAddress + ":" + rov_socket.remotePort)
})

// listen for data from the rov
rov_socket.on("data", function(data) {
  console.log("received from rov: " + data)
})
