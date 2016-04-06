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

  // rotate the navigation widget
  document.getElementsByClassName("angle_button")[0].onclick = rotate
  document.getElementsByClassName("angle_button")[1].onclick = rotate
  document.getElementById("act_angle").oninput = rotate
  document.getElementById("req_angle").oninput = rotate

  function rotate() {
    var req_angle = -document.getElementById("req_angle").value
    var act_angle = -document.getElementById("act_angle").value
    document.getElementById("cmp_img").style.transform = "rotate(" + act_angle + "deg)"
    document.getElementById("req_img").style.transform = "rotate(" + (act_angle - req_angle) + "deg)"
  }
}
