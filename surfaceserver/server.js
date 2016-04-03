// imports
var express = require("express")
var logger = require("morgan")
var app = express()
var ws = require("express-ws")(app)

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
