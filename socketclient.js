// import and define the socket client, with defaults
socket = new require("net").Socket();

// set options on the socket
socket.readable = true;
socket.writable = true;

// connect to the socket
sock_options = {
	"port": 8080
};
socket.connect(sock_options);

// import and define the input reader
var read = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: false});

// listen for a successful connection to the server
socket.on("connect", function() {
	console.log(	"session connected to " + socket.remoteAddress +
			":" + socket.remotePort);
});

// listen for a closing connection from the server
socket.on("close", function() {
	console.log("session terminated");
	process.exit();
});

// listen for data from the server
socket.on("data", function(data) {
	console.log("" + data);
});

// listen for data from stdin
read.on("line", function(line) {
	if(line !== "exit") {
		socket.write(line);
	} else {
		socket.end();
	}
});
