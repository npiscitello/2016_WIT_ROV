var socket = new WebSocket("ws://127.0.0.1:8000")

// wait for the window to load before trying to do anything...
window.onload = function() {
  // respond to a button click
  document.getElementById("json_button").onclick = function() {
    socket.send(document.getElementById("json_input").value)
  }

  // respond to a socket message from server
  socket.onmessage = function(event) {
   document.getElementById("json_output").value = event.data
  }
}
