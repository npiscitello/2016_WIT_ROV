var express = require("express")
var logger = require("morgan")
var app = express()

app.get('/', function(req, res) {
  // test for localhost login
  var address = req.socket.remoteAddress
  localhost_addr = /127.0.0.1/
  if(localhost_addr.test(address)) {
    res.send("Welcome! You're logged in from the local machine!")
  } else {
    res.send("INTRUDER! You're logged in from " + address + "!")
  }
})

app.listen(process.env.PORT || 3000, function() {
  console.log("Listening on http://localhost:" + (process.env.PORT || 3000))
})
