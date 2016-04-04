raw_url = window.location.href
regex = /http(s?):///
var socket = new WebSocket(raw_url.replace(regex, "ws://"))

// wait for the window to load before trying to do anything...
window.onload = function() {
  // respond to a button click
  document.getElementById("json_button").onclick = function() {
    socket.send(document.getElementById("json_input").value)
  }

  // respond to a socket message from server
  socket.onmessage = function(event) {
   document.getElementById("json_output").value = String(event.data)
  }
}
