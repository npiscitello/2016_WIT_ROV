raw_url = window.location.href;
regex = /http(s?):/;
ws_url = raw_url.replace(regex, "ws:");
var axis_scale = 90;

// wait for the window to load before trying to do anything...
window.onload = function() {
  
  // initial connection attempt
  console.log("Connecting to a websocket at " + ws_url);
  var socket = new ReconnectingWebSocket(ws_url);
  socket.reconnectInterval = 1000;
  socket.reconnectDecay = 1;
  var hid_data_int;

  // listen for an open connection
  socket.onopen = function() {
    console.log("websocket opened");
    // turn the indicator green
    document.getElementById("page_connection").style.backgroundColor = "lime";
    // start sending HID data
    hid_data_int = setInterval(sendGamepadValues, 100);
  }

  // listen for a closed connection
  socket.onclose = function() {
    console.log("websocket closed - attempting reconnect");
    // turn the indicator red
    document.getElementById("page_connection").style.backgroundColor = "red";
    clearInterval(hid_data_int);
  }

  // respond to a JSON Send button click
  document.getElementById("json_button").onclick = function() {
    socket.send(document.getElementById("json_input").value);
  }

  // respond to an hmc init button click
  document.getElementById("hmc_init").onclick = function() {
    socket.send(JSON.stringify({"spevent":true, "data":{"buttonID":"hmc_init"}}));
  }

  // respond to an pca init button click
  document.getElementById("pca_init").onclick = function() {
    socket.send(JSON.stringify({"spevent":true, "data":{"buttonID":"pca_init"}}));
  }

  // log an error with messages sent from the surface server
  function logReciptError(key, exp_value) {
    console.log("%s key sent with non-%s (or no) value", key, exp_value);
  }

  // respond to a socket message from server
  socket.onmessage = function(event) {
    data = JSON.parse(event.data);
    // every if statement represents an API call to the page
    if(data.hasOwnProperty("")) {
      // do stuff
    }
  
    if(data.hasOwnProperty("rov_connected")) {
      if(typeof data.rov_connected === "boolean") {
        if(data.rov_connected) {
          document.getElementById("rov_connection").style.backgroundColor = "green";
        } else {
          document.getElementById("rov_connection").style.backgroundColor = "red";
        }
      } else {
        logReciptError(key, exp_value);
      }
    }

    if(data.hasOwnProperty("heading")) {
      if(typeof data.heading === "number") {
        document.getElementById("cmp_img").style.transform = "rotate(" + data.heading + "deg)";
      } else {
        logReciptError(key, exp_value);
      }
    }
  }

  // rotate the navigation widget when value changed or button clicked
  var act = document.getElementById("act_angle").value;
  var req = document.getElementById("req_angle").value;
  document.getElementsByClassName("angle_button")[0].onclick = rotate(req, act);
  document.getElementsByClassName("angle_button")[1].onclick = rotate(req, act);
  document.getElementById("act_angle").oninput = rotate(req, act);
  document.getElementById("req_angle").oninput = rotate(req, act);
  
  // the actual rotation code
  function rotate(req_angle, act_angle) {
    document.getElementById("cmp_img").style.transform = "rotate(" + act_angle + "deg)";
    document.getElementById("req_img").style.transform = "rotate(" + (act_angle - req_angle) + "deg)";
  }

  // spin nav dials, send HID data
  function sendGamepadValues() {
    var gp = navigator.getGamepads()[0];
    if(!gp) {
      return;
    }
    rotate(-axis_scale * gp.axes[0], axis_scale * gp.axes[2]);
    data = {"event_type": "hid_data", "data": {
      "axis0": gp.axes[0], "axis1": gp.axes[1], "axis2": gp.axes[2],
      "axis3": gp.axes[3], "axis4": gp.axes[4], "axis5": gp.axes[5],
      "btn0": gp.buttons[0].pressed, "btn1": gp.buttons[1].pressed}
    }
    socket.send(JSON.stringify(data));
  }
  
  // function to get gamepad info
  function pollGamepads() {
    console.log("gamepad poll");
    var gamepads = navigator.getGamepads();
    for(var i = 0; i < gamepads.length; i++) {
      var gp = gamepads[i];
      if(gp) {
        console.log("Gamepad. index: %d, id: %s, buttons: %d, axes: %d",
          gp.index, gp.id, gp.buttons.length, gp.axes.length);
        clearInterval(gamepad_poller);
      }
    }
  }

  // set up gamepad polling b/c Chrome doesn't do events
  gamepad_poller = setInterval(pollGamepads, 100);
}
