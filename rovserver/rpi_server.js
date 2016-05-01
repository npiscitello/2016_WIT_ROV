// Native Dependencies
var net = require('net');                         // Socket connections
var os = require('os');                           // System stats
// NPM Dependencies
var hmc6343 = require('hmc6343');                 // Honeywell Magnetometer
var ds18b20 = require('ds18b20');                 // Temperature sensor
var pca9685 = require('adafruit-pca9685').        // Adafruit PWM breakout
var i2cBus = require('i2c-bus');                  // the PCA needs this for setup
var pidloop = require('node-pid-controller');     // PID loop manager

// Setup variables

// Broadcast IP - should almost always be localhost
var host = '127.0.0.1';
// Port - doesn't really matter
var port = 8100;
// Exclusivity:
// False - handle multiple connections simultaneously
// True - handle but one connection at a time
var exclusive = false;
// variables for the sensors and shit
var hmc, temp, pca;
var joyX = 0, joyY = 0;
var lThrust, rThrust, upThrust = 0;

console.log('WIT ROV 2016 - Server Unit');

// We need to determine the processor architecture
// This is so we can disable the sensor features on systems that
// aren't the raspberry pi
var arch = os.arch();
var rpi = (arch.indexOf('arm') > -1);

console.log('System Architecture: '+arch);
console.log('Enable RPI features: '+rpi+'\n');

// Initialize a TCP socket server
var server = net.createServer();
// Start listening for connections
server.listen(port, host, exclusive);

// This only gets called one time, when the server starts.
// It's not very useful, but maybe for debugging.
server.on('listening', function serverListening() {
  console.log('Server listening on ' + server.address().address +':'+ server.address().port);
});

// When a new client connects, we see this event
server.on('connection', function serverConnection(client) {
  console.log('Client connected: ' + client.remoteAddress +':'+ client.remotePort);
  var buf = '';
  var cmds;

  // Set up event listeners to start cooperating with the client
  client.on('data', function clientData(data) {
    // Data chunks are split pretty randomly, so we store them until we see a newline
    // and then process on that instead.
    buf += data.toString('utf-8');
    if (buf.indexOf('\n') > -1) {
      // There's at least one command ready. Process the buffer...
      var cmds = buf.replace(/\n/gi, '\n|').split('|');
      // We use a for/in since there might be more than one
      for (var i in cmds) {
        if (cmds[i].indexOf('\n') > -1)
          // For each command, process and then respond to the client with the result
          client.write(JSON.stringify(processCommand(cmds[i].split('\n')[0]))+'\n');
        else
          buf = cmds[i];
      }
    }
  });

  client.on('close', function clientClose() {
    console.log('Client disconnected. Bye!');
  });

});

// On error. 'close' will follow immediately after this.
server.on('error', function serverError(err) {
  console.log('Fatal Error: '+err);
});

server.on('close', function serverClose() {
  console.log('Goodbye!');
});


// Received commands are passed through this function.
function processCommand(data) {
  var cmd;

  // This is the default response for a failed action
  var response = {
    success: false,
    err: false,
    data: false
  };

  try {
    // Parse the command into a JSON object
    cmd = JSON.parse(data.toString('utf-8'));
  } catch (e) {
    // This is where we catch any bad (non-json) input
    response.err = 'not_json'; // Send back an error message
    response.data = data.toString('utf-8'); // Send back the bad command so we can look at it
    console.log('Invalid JSON: '+response.data);
    return response; // Respond to the client
  }

  // Let's make sure it specifies some action
  if (!cmd.hasOwnProperty('action')) {
    response.err = 'no_action';
    response.data = cmd;
    console.log('Invalid action: '+JSON.stringify(cmd));
    return response;
  }

  /*
   * This is our primary switch case for event processing
   * We can pretty much get away with hooking up most
   * commands right in here.
   */
  switch (cmd.action) {
    // GENERAL COMMANDS
    case 'get_time':
      // Return the rov time for some reason
      response.success = true;
      response.data = {time: Date.now()};
      break;
    case 'get_mem_usage':
      // Get memory usage stats
      response.success = true;
      response.data = {free: os.freemem(), total: os.totalmem()};
      break;
    case 'get_cpu_usage':
      // Get the processor load average
      response.success = true;
      response.data = {cpuload: os.loadavg()};
      break;
    case 'ping':
      // Do nothing, successfully
      response.success = true;
      break;
    case 'echo':
      // echo recieved data, if there was any
      response.success = true;
      if (!cmd.hasOwnProperty('data')) {
        return response;
      }
      response.data = cmd.data;
      return response;
      break;

    // HMC6343 COMMANDS
    case 'hmc_init':
      // Initialize magnetometer
      try {
        hmc = new hmc6343('/dev/i2c-1', 0x19);
      }
      // Return error if there was one
      catch (ex) {
        response.err = ex.message
        break;
      }
      response.success = true;
      break;
    case 'hmc_get_accel':
      // Get accelerometer data from magnetometer
      try {
        hmc.readAccel(function(accelData) {
          response.data = accelData;
          response.success = true;
        });
      } catch (ex) {
        response.success = false;
        response.err = ex.message;
      }
      break;
    case 'hmc_get_mag':
      // Get magnetometer data from magnetometer
      try {
        response.success = true;
        hmc.readMag(function(magData) {
          response.data = magData;
        });
      } catch (ex) {
        response.err = ex.message;
      }
      break;

    // DS18B20 COMMANDS
    // yeah we'll get to that

    // PCA9685 COMMANDS
    case 'pca_init':
      // Initialize pca board
      if (rpi) {
        var options = {
          freq: 50,
         };
        pca = new pca9685(options);
        response.success = true;
      } else {
        response.err = 'PCA is only initializable on the RPI'
      }
      
      break;
    case 'pca_set_pulse':
      // Set Set channel chan to turn on on step cms.stepOn and off on step cmd.stepOff 
      /* Usage:
       * {"action":"pca_set_dutyCycle",
       *  "chan":"[channel]",
       *  "stepOn":"[on step]",
       *  "stepOff":"[off step]"}
       */
      if(!cmd.hasOwnProperty('chan') || !cmd.hasOwnProperty('pulse')) {
        response.err = 'usage: {action:pca_set_dutyCycle, chan:[channel], pulse:[pulse length in ms]}';
        break;
      }
      try {
        response.success = true;
        pca.setPulse(cmd.chan, cmd.pulse);
      } catch (ex) {
        response.err = ex.message;
      }
      break;
    case 'joystick_setData':
      if (cmd.joyData.type === 'button') {
        switch (cmd.joyData.value) {
          case 0:
            console.log('button ' + cmd.joyData.number + ' released');
            break;
          case 1:
            console.log('button ' + cmd.joyData.number + ' released');
            break;
      }
      if (cmd.joyData.type === 'axis') {
        var scale = -(cmd.joyData.value/32767);
        switch (cmd.joyData.number) {
          case 0:
            joyX = scale;
            break;
          case 1:
            joyY = scale;
            break;
          case 3:
            upThrust = (scale * 540 + 1617);
            break;
        }
        lThrust = ((-joyX/2) + (joyY/2)) * 500 + 1617;
        rThrust = ((joyX/2) + (joyY/2)) * 500 + 1617;
        pca.setPulse(1, lThrust);
        pca.setPulse(0, rThrust);
        pca.setPulse(2, upThrust);
        pca.setPulse(3, upThrust);
      break;
    default:
      response.err = 'not_implemented';
      response.data = cmd;
      console.log('Command not implemented: '+cmd.action);
      break;
  }

  console.log('Command was: '+JSON.stringify(cmd));
  return response;
}

/*
joy1.on('button', function(peen) {
  switch (peen.value) {
    case 0:
      console.log('button ' + peen.number + ' released');
      break;
    case 1:
      console.log('button ' + peen.number + ' pressed');
      break;
    default:
      console.log('wat');
  }
});

// {time, value, number, type, id}

joy1.on('axis', function(peen) {
  scale = ((-(peen.value/32767) * 500) + 1500);
  console.log ('axis ' + peen.number + ': ' + scale);
  if (peen.number === 1) {
    pca.setPulseLength(0, scale);
    pca.setDutyCycle(0, scale);
  }
});

 */

/* From here down are just notes/examples

if (rpi) {
  // Temperature Sensor
  var getTemp = function(err, value) {
    console.log('Current temperature is: ', value);
    if (err)
      console.log('Error:'+err);
  };

  // Assumes the sensor is on GPIO w1
  temp.sensors(function foundTempSensors(err, ids) {
    for (var i in ids) {
      temp.temperature(ids[i], getTemp);
    }
  });
  // Temperature Sensor End
} */

/* PID Loop */
var pid = new pidloop(0.25, 0.01, 0.01);
pid.setTarget(100);
var correction = pid.update(100);

// Correction contains a value to adjust by to achieve the pid target
/* PID Loop End */

/*___/\\\\\\\\\\\__________/\\\\\\\\\__/\\\________/\\\__/\\\___________________/\\\\\_______/\\\\\_____/\\\_____/\\\\\\\\\\\\_        
 ___/\\\/////////\\\_____/\\\////////__\/\\\_______\/\\\_\/\\\_________________/\\\///\\\____\/\\\\\\___\/\\\___/\\\//////////__       
  __\//\\\______\///____/\\\/___________\/\\\_______\/\\\_\/\\\_______________/\\\/__\///\\\__\/\\\/\\\__\/\\\__/\\\_____________      
   ___\////\\\__________/\\\_____________\/\\\\\\\\\\\\\\\_\/\\\______________/\\\______\//\\\_\/\\\//\\\_\/\\\_\/\\\____/\\\\\\\_     
    ______\////\\\______\/\\\_____________\/\\\/////////\\\_\/\\\_____________\/\\\_______\/\\\_\/\\\\//\\\\/\\\_\/\\\___\/////\\\_    
     _________\////\\\___\//\\\____________\/\\\_______\/\\\_\/\\\_____________\//\\\______/\\\__\/\\\_\//\\\/\\\_\/\\\_______\/\\\_   
      __/\\\______\//\\\___\///\\\__________\/\\\_______\/\\\_\/\\\______________\///\\\__/\\\____\/\\\__\//\\\\\\_\/\\\_______\/\\\_  
       _\///\\\\\\\\\\\/______\////\\\\\\\\\_\/\\\_______\/\\\_\/\\\\\\\\\\\\\\\____\///\\\\\/_____\/\\\___\//\\\\\_\//\\\\\\\\\\\\/__ 
        ___\///////////___________\/////////__\///________\///__\///////////////_______\/////_______\///_____\/////___\////////////__*/
