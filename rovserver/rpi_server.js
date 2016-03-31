// Native Dependencies
var execSync = require('child_process').execSync; // Execute external commands
var net = require('net');                         // Socket connections
// NPM Dependencies
var mpu9150 = require('mpu9150');                 // Accelerometer/Gyro
var temp = require('ds18b20');                    // Temperature sensor
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

console.log('WIT ROV 2016 - Server Unit');

// We need to determine the processor architecture
// This is so we can disable the sensor features on systems that
// aren't the raspberry pi
var arch = execSync('uname -m').toString('utf-8').split('\n')[0];
var rpi = false;

if (arch.indexOf('arm') > -1)
  rpi = true;

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

  // Set up event listeners to start cooperating with the client
  client.on('data', function clientData(data) {
    process.stdout.write(data.toString('utf-8'));
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

/* From here down are just notes/examples */

if (rpi) {
  /* Accelerometer/Gyro */
  // MPU is on the I2C bus
  var mpu = new mpu9150();
  mpu.initialize();

  if (mpu.testConnection()) {
    console.log(mpu.getMotion9());
  } else {
    console.log("Error: Failed to initialize the accelerometer/gyro.");
  }

  /* Accelerometer/Gyro End */


  /* Temperature Sensor */
  var getTemp = function getTemp(err, value) {
    console.log('Current temperature is: ', value);
    if (err)
      console.log('Error:'+err);
  };

  // Assumes the sensor is on GPIO w1
  temp.sensors(function foundTempSensors(err, ids) {
    for (var i in ids) {
      temp.temperature(i, getTemp);
    }
  });
  /* Temperature Sensor End */
}

/* PID Loop */
var pid = new pidloop(0.25, 0.01, 0.01);
pid.setTarget(100);
var correction = pid.update(100);

// Correction contains a value to adjust by to achieve the pid target
/* PID Loop End */
