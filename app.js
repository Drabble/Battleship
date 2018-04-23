var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);

var players = {}; // List of players
var boats = [2,3,3,4,5] // List of boats to place on map
var size = 10; // Size of board
var board = []; // Board
var boardBoats = []; // Board positions
var gameFinished = false;

class Mutex {
    constructor () {
        this.queue = [];
        this.locked = false;
    }

    lock () {
        return new Promise((resolve, reject) => {
            if (this.locked) {
                this.queue.push([resolve, reject]);
            } else {
                this.locked = true;
                resolve();
            }
        });
    }

    release () {
        if (this.queue.length > 0) {
            const [resolve, reject] = this.queue.shift();
            resolve();
        } else {
            this.locked = false;
        }
    }
}
const mutex = new Mutex();

initGame();

app.use(express.static(__dirname + '/node_modules'));  
app.get('/', function(req, res,next) {  
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(client) {  
	players[client.id] = 0;
	client.emit('players', players);
	client.broadcast.emit('players', players);
    console.log('Client connected...');
	client.emit('board', board);
	
    client.on('shoot', function(data) {
		data = data.toLowerCase();
		
		if(data.length == 2 && data.charCodeAt(1) >= '0'.charCodeAt(0) && data.charCodeAt(1) <= '9'.charCodeAt(0) && data.charCodeAt(0) >= '0'.charCodeAt(0) && data.charCodeAt(0) <= '9'.charCodeAt(0)){
			var y = parseInt(data[0]);
			var x = parseInt(data[1]);
			
			mutex.lock().then(() => {
				if(!gameFinished && board[x][y] == 0){
					// Shoot cell
					if(boardBoats[x][y]){
						board[x][y] = 1;
					} else{
						board[x][y] = 2;
					}
					
					// Handle boat sunk
					for(var i = 0; i < boats.length; i++){
						var sunk = true;
						for(var j = 0; j < size; j++){
							for(var k = 0; k < size; k++){
								if(boardBoats[j][k] == i + 1 && board[j][k] != 1){
									sunk = false;
								}
							}
						}
						if(sunk){
							// Change boat to green
							for(var j = 0; j < size; j++){
								for(var k = 0; k < size; k++){
									if(boardBoats[j][k] == i + 1){
										board[j][k] = 3;
									}
								}
							}
							// Give points to player
							players[client.id] += boats[i];
							client.emit('players', players);
							client.broadcast.emit('players', players);
						}
					}
					
					// Handle win
					var win = true;
					for(var i = 0; i < size; i++){
						for(var j = 0; j < size; j++){
							if(boardBoats[i][j] && board[i][j] == 0){
								win = false;
							}
						}
					}
					if(win){
						// wait ten seconds and start game again
						setTimeout(function() {
							initGame();
							io.emit('board', board);
							gameFinished = false;
							for(key in players){
								players[key] = 0;
							}
						}, 10000);
						var highestScore = 0;
						for(key in players){
							if(players[key] > highestScore){
								highestScore = players[key];
							}
						}
						for(key in players){
							let namespace = null;
							let ns = io.of(namespace || "/");
							let socket = ns.connected[key] // assuming you have  id of the socket
							if (socket) {
								if(players[key] >= highestScore){
									socket.emit("win");
								} else{
									socket.emit("lose");
								}
							} else {
								console.log("Socket not connected...");
							}
						}
						gameFinished = true;
					}
					
					// Update board
					client.emit('update',board);
					client.broadcast.emit('update',board);
				}
				mutex.release();
			});
		}
    });
	
	client.on('disconnect', function() {
		delete players[client.id];
		client.broadcast.emit('players', players);
	});
});

server.listen(process.env.PORT || 4200);

function initGame(){
	// Define boats positions
	board = [];
	boardBoats = [];
	for(var i = 0; i < size; i++){
		var a = [];
		for(var j = 0; j < size; j++){
			a.push(0);
		}
		boardBoats.push(a);
	}
	shuffle(boats);
	for(var i = 0; i < boats.length; i++){
		var vertical = Math.random() > 0.5;
		var ok;
		var x;
		var y;
		do {
			x = Math.floor(Math.random() * (size - (!vertical ? boats[i]-1 : 0)));
			y = Math.floor(Math.random() * (size - (vertical ? boats[i]-1 : 0)));
			var ok = true;
			for(var j = 0; j < boats[i]; j++){
				if(boardBoats[x + (vertical ? 0 : j)][y + (vertical ? j : 0)]){
					ok = false;
				}
			}
		} while(!ok)
		for(var j = 0; j < boats[i]; j++){
			boardBoats[x + (vertical ? 0 : j)][y + (vertical ? j : 0)] = i + 1;
		}
	}

	// Initialize board
	for(var i = 0; i < size; i++){
		var a = [];
		for(var j = 0; j < size; j++){
			a.push(0);
		}
		board.push(a);
	}
}

// Shuffle an array
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}