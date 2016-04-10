raw_url = window.location.href
regex = /http(s?):/
ws_url = raw_url.replace(regex, "ws:")
var socket = new WebSocket(ws_url)
var axis_scale = 90

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

  // rotate the navigation widget when value changed or button clicked
  var act = document.getElementById("act_angle").value
  var req = document.getElementById("req_angle").value
  document.getElementsByClassName("angle_button")[0].onclick = rotate(req, act)
  document.getElementsByClassName("angle_button")[1].onclick = rotate(req, act)
  document.getElementById("act_angle").oninput = rotate(req, act)
  document.getElementById("req_angle").oninput = rotate(req, act)
  
  // the actual rotation code
  function rotate(req_angle, act_angle) {
    document.getElementById("cmp_img").style.transform = "rotate(" + act_angle + "deg)"
    document.getElementById("req_img").style.transform = "rotate(" + (act_angle - req_angle) + "deg)"
  }

  // animation function to spin nav dial
  function animationLoop() {
    var gp = navigator.getGamepads()[0]
    if(!gp) {
      return
    }
    rotate(-axis_scale * gp.axes[0], axis_scale * gp.axes[2])
  }
  
  // function to get gamepad info
  function pollGamepads() {
    console.log("gamepad poll")
    var gamepads = navigator.getGamepads()
    for(var i = 0; i < gamepads.length; i++) {
      var gp = gamepads[i];
      if(gp) {
        console.log("Gamepad. index: %d, id: %s, buttons: %d, axes: %d",
          gp.index, gp.id, gp.buttons.length, gp.axes.length)
        clearInterval(interval)
        setInterval(animationLoop, 100)
        animationLoop()
      }
    }
  }

  // set up gamepad polling b/c Chrome doesn't do events
  interval = setInterval(pollGamepads, 100)
}
