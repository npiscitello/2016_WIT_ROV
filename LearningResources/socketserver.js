// import and define a TCP server
server = new require("net").Server();

// start the server
var port = 8080, addr = "127.0.0.1";
server.listen(port, addr, function() {
	console.log(	"Server started at " + server.address().address +
			", port " + server.address().port +
			" using " + server.address().family);
});

// define the variable for storing users
var clients = [], id = 0;

server.on("connection", function(client) {
	// identify the client
	client.name = client.remoteAddress + ":" + client.remotePort;

	// log the connection
	console.log("Client connected: " + client.name);

	// add the client to the registry
	clients.push(client);
	
	// broadcast the arrival of the client, alert client to all other clients
	broadcast("new client: " + client.name, client);
	client.write("Welcome! You are " + client.name + '\n');
	if(clients.length > 1) {
		client.write("The currently connected clients are:\n");
		for(i = 0; i < clients.length; i++) {
			if(clients[i] !== client) {
				client.write(clients[i].name + '\n');
			}
		}	
	}

	// remove a disconnected client from the database
	client.on("end", function() {
		clients.splice(clients.indexOf(client), 1);
		broadcast("client disconnected: " + client.name, client)
		console.log("client disconnected: " + client.name);
	});

	// broadcast any incoming messages
	client.on("data", function(data) {
		broadcast(client.name + "> " + data, client);
	});
});

// broadcast a message to everyone except the sender
function broadcast(message, sender) {
	for(i = 0; i < clients.length; i++) {
		if(clients[i] !== sender) {
			clients[i].write(message);
		}
	}
}
