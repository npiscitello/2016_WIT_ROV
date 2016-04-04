raw_url = window.location.href
regex = /http(s?):/
ws_url = raw_url.replace(regex, "ws:")
var socket = new WebSocket(ws_url)

// wait for the window to load before trying to do anything...
window.onload = function() {
  console.log("Connecting to a websocket at " + ws_url)
  
  // respond to a button click
  document.getElementById("json_button").onclick = function() {
    socket.send(document.getElementById("json_input").value)
  }

  // respond to a socket message from server
  socket.onmessage = function(event) {
   document.getElementById("json_output").value = String(event.data)
  }
}
