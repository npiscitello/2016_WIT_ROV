var express = require("express")
var logger = require("morgan")
var app = express()

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

// listen to port 3000 (or another port?)
app.listen(process.env.PORT || 3000, function() {
  console.log("Listening on http://localhost:" + (process.env.PORT || 3000))
})
