var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);

var players = [];
var boats = [2,3,3,4,5]
var size = 10;
var board = [];
var boardBoats = [];

initGame();

app.use(express.static(__dirname + '/node_modules'));  
app.get('/', function(req, res,next) {  
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(client) {  
	players.push(client.id);
	client.emit('players', players);
	client.broadcast.emit('players', players);
    console.log('Client connected...');
	client.emit('board', board);
	
    client.on('shoot', function(data) {
		data = data.toLowerCase();
		if(data.length == 2 && data.charCodeAt(1) >= '0'.charCodeAt(0) && data.charCodeAt(1) <= '9'.charCodeAt(0) && data.charCodeAt(0) >= 'a'.charCodeAt(0) && data.charCodeAt(0) <= 'j'.charCodeAt(0)){
			var y = data.charCodeAt(0) - 'a'.charCodeAt(0);
			var x = parseInt(data[1]);
			if(board[x][y] == 0){
				if(boardBoats[x][y]){
					board[x][y] = 1;
				} else{
					board[x][y] = 2;
				}
				
				// On win
				var win = true;
				for(var i = 0; i < size; i++){
					for(var j = 0; j < size; j++){
						if(boardBoats[i][j] && board[i][j] == 0){
							win = false;
						}
					}
				}
				if(win){
					setTimeout(function() {initGame();io.emit('board', board);}, 10000); // wait ten seconds and start game again
					client.emit('win');
					client.broadcast.emit('lose');
				}
				client.emit('update',board);
				client.broadcast.emit('update',board);
			}
		}
    });
	
	client.on('disconnect', function() {
		players.splice(players.indexOf(client.id), 1);
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
			a.push(false);
		}
		boardBoats.push(a);
	}
	shuffle(boats);
	for(var i = 0; i < boats.length; i++){
		var vertical = Math.random() > 0.5;
		do {
			var x = Math.floor(Math.random() * (size - (!vertical ? boats[i]-1 : 0)));
			var y = Math.floor(Math.random() * (size - (vertical ? boats[i]-1 : 0)));
			var ok = true;
			for(var j = 0; j < boats[i]; j++){
				if((vertical && boardBoats[x][y+j]) || (!vertical && boardBoats[x+j][y])){
					ok = false;
				}
			}
		} while(!ok)
		for(var j = 0; j < boats[i]; j++){
			boardBoats[x][y+j] = true;
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