var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var MongoClient = require('mongodb').MongoClient;

var mongodb_url = 'mongodb://mongodb:27017/battleship';
var collection;

var SERVER_ID = 42;

var players = {}; // List of players
var boats = [2,3,3,4,5] // List of boats to place on map
var size = 10; // Size of board
var board = []; // Board
var boardBoats = []; // Board positions
var gameFinished = false;

var clients = {};

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

app.use(express.static(__dirname + '/node_modules'));
app.use(express.static('public'));

app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(client) {

	client.on('login', function(data) {
		client.battleship_id = data;
    clients[client.battleship_id] = client;

		if(players[client.battleship_id] == null){
			players[client.battleship_id] = 0;
			client.broadcast.emit('players', players);
		}
		client.emit('players', players);
		console.log('Client '+client.battleship_id+' connected...');
		client.emit('board', board);

    saveGame();
	});

  client.on('shoot', function(data) {
		data = data.toLowerCase();

		if(client.battleship_id != null && data.length == 2 && data.charCodeAt(1) >= '0'.charCodeAt(0) && data.charCodeAt(1) <= '9'.charCodeAt(0) && data.charCodeAt(0) >= '0'.charCodeAt(0) && data.charCodeAt(0) <= '9'.charCodeAt(0)){
			var y = parseInt(data[0]);
			var x = parseInt(data[1]);

			mutex.lock().then(() => {
				if(!gameFinished && board[x][y] == 0){
          console.log('debug', 'shoot !');

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
							players[client.battleship_id] += boats[i];
							client.emit('players', players);
							client.broadcast.emit('players', players);
              saveGame();
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
							initNewGame();
              gameFinished = false;
              for(key in players){
                players[key] = 0;
              }
              io.emit('board', board);
              io.emit('players', players);
						}, 10000);
            var highestScore = 0;
            var winner_id;
						for(key in players){
							if(players[key] > highestScore){
								highestScore = players[key];
                winner_id = key;
							}
						}

						for(key in clients){
              let client = clients[key];
							if (client.battleship_id == winner_id) {
								client.emit("win");
							}
              else{
								client.emit("lose");
							}
						}
						gameFinished = true;
					}

					// Update board
					client.emit('update',board);
					client.broadcast.emit('update',board);
          saveGame();
				}

				mutex.release();
			});
		}
  });

	client.on('disconnect', function() {
		//delete players[client.battleship_id];
		//client.broadcast.emit('players', players);
	});
});

app.get('/status', function(req, res,next) {
    res.send('All good :)');
});

MongoClient.connect(mongodb_url, function(err, db) {
  if (err) throw error;

  collection = db.db('battleship').collection('status');

  initGame();

  server.listen(process.env.PORT || 4200);
});

function saveGame() {
  var doc = {
    id: SERVER_ID,
    players: players,
    board: board,
    board_boats: boardBoats,
    game_finished: gameFinished
  };
  collection.update({ id: SERVER_ID }, doc, { upsert: true }, function(err, res) {
    if (err) throw error;
  });
}

function initGame() {
  collection.findOne({ id: SERVER_ID }, function(err, res) {
    if (err) throw error;

    if (res) {
        if (res.game_finished) {
            initNewGame();
        }
        else {
          players = res.players;
          board = res.board;
          boardBoats = res.board_boats;
          gameFinished = res.game_finished;
        }
    }
    else {
        initNewGame();
    }
    saveGame();
  });
}

function initNewGame() {
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
