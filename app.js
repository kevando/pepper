var handler = function(req, res) {
	fs.readFile('./index.html', function(err, data) {
		if (err)
			throw err;
		res.writeHead(200);
		res.end(data);
	});
};

var app = require('http').createServer(handler);
var io = require('socket.io').listen(app);
var fs = require('fs');
// var Moniker = require('moniker');
var port = process.env.PORT || 8080;

app.listen(port);

// socket.io
io.sockets.on('connection', function(socket) {

	var user = addUser();
	var data = {
		'currentUser' : user,
		'users' : users,
		'names' : userNames(users),
		'isGameLive' : isGameLive,
		'gameData' : gameData
	};



	socket.emit("welcome", data);


	io.sockets.emit("userJoined", {
		'names' : userNames(users),
		'users' : users,
		// 'user' : user
	});



	socket.on('disconnect', function() {
		console.log('Remove User')
		removeUser(user);
	});


	socket.on("onKeyPress", function(k) {
		for (var i = 0; i < users.length; i++) {
			if (user.name === users[i].name) {
				if (k == 'left') {
					if (data.users[i].location.x > 20) {
						users[i].location.x -= 50;
					}
				} else if (k == 'right') {
					if (data.users[i].location.x < 800) {
						users[i].location.x += 50;
					}
				} else if (k == 'up') {
					if (data.users[i].location.y > 20) {
						users[i].location.y -= 50;
					}
				} else if (k == 'down') {
					if (data.users[i].location.y < 500) {
						users[i].location.y += 50;
					}
				}
				break;
			}
		}
		io.sockets.emit("updateLocation", users);
	});




	socket.on("StartGame", function() {
		console.log('start game')
		isGameLive = true;


		io.sockets.emit("gameStarted");

		setInterval(function() {
			var c1 = new Car(20, 20, 0, 400, 'left', 'yellow');
			var c2 = new Car(20, 20, 850, 280, 'right', 'orange');
			var c3 = new Car(20, 20, 0, 120, 'left', 'red');
			cars.push(c1);
			cars.push(c2);
			cars.push(c3);
		}, carInterval);

	})

	socket.on("UpdateUserName", function(n) {;
		for (var i = 0; i < users.length; i++) {
			if (user.id === users[i].id) {
				users[i].name = n;

				break;
			}
		}
		io.sockets.emit("users", {
			'names' : userNames(users),
			'users' : users,
			'user' : user,
			'gameData' : gameData
		});
	});

	socket.on("BecomeFrog", function(n) {;
		console.log("BecomeFrog")
		for (var i = 0; i < users.length; i++) {
			if (user.id === users[i].id) {
				users[i].player = true;
				currentPlayer = users[i];
				break;
			}
		}

		io.sockets.emit("becameFrog", {'users': users});

		io.sockets.emit("users", {
			'names' : userNames(users),
			'users' : users,
			'user' : user,
			'currentPlayer' : currentPlayer,
			'gameData' : gameData
		});

	});


	socket.on("BuyCarRow", function(n) {
		console.log("BuyCarRow")
		for (var i = 0; i < users.length; i++) {
			if (user.id === users[i].id) {
				users[i].color = carColors[users.length-1];
				carOwners.push(users[i])
				break;
			}
		}
		io.sockets.emit("users", {
			'names' : userNames(users),
			'users' : users,
			'user' : user,
			'carOwners' : carOwners,
			'gameData' : gameData
		});
	});

});


var users = [];
var cars = [];
var isGameLive = false;
var carColors =['yellow','orange','red'];
var gameReady = false;
var carOwners = []
var currentPlayer = null;

var gameData = {
	playerAttempts: 5,
}

function userNames(users) {
	var str = '';
	for (var i = 0; i < users.length; i++) {
		var user = users[i];
		str += '<tr><td>' + user.name + '</td>'
		status = 'none'
		if(user.player) { status = 'Frog'}
		if(user.color) { status = user.color }
		str+= '<td>' + status +'</td>'

		str+= '<td>' + user.score +'</td>'

		str += '</tr>';

	}
	return str;
}



var addUser = function() {
	var user = {
		id : users.length,
		score: 0,
		color: null,
		won : false,
		lost : false,
		player : false,
		name : "New User" + (users.length + 1),
		location : {
			x : users.length * 60 + 10,
			y : 540
		}
	};
	users.push(user);
	return user;
};
var removeUser = function(user) {
	for (var i = 0; i < users.length; i++) {
		if (user.name === users[i].name) {
			users.splice(i, 1);
			return;
		}
	}
	io.sockets.emit("users", {
		'user' : user,
		'names' : userNames(users),
		'users' : users,
		'gameData' : gameData
	});
};

function Car(width, height, x, y, direction, color) {
	this.width = width;
	this.height = height;
	this.x = x;
	this.y = y;
	this.direction = direction;
	this.color = color;
}



function detectCollisons() {
	// var killerCar = null;
	for (var i = 0; i < cars.length; i += 1) {
		for (var j = 0; j < users.length; j += 1) {
			if (Math.abs((cars[i].x - users[j].location.x)) < 50) {
				if (Math.abs((cars[i].y - users[j].location.y)) < 50) {
					console.log('user lost?!')
					var loser = users[j];
					users[j].location.y = 540;
					users[j].lost = true;
					users[j].score = users[j].score - 1;

					// console.log('user killed by car of color: ',cars[i].color)
					// killerCar = cars[i].color
					gameData.playerAttempts = gameData.playerAttempts - 1;

					if(gameData.playerAttempts == 0) {
						alert('GAME OVER FOR PEPE')
					}

					// update score of killer car
					for (var k = 0; k < users.length; k += 1) {
						if(cars[i].color == users[k].color){
							console.log('frog killed by user: ',users[k])
							users[k].score = users[k].score + 1
						}
					}

					io.sockets.emit("users", {
						'names' : userNames(users),
						'users' : users,
						'gameData' : gameData
					});
				}
			}
			// console.log('user y: ',users[j].location.y)
			if(users[j].location.y<50){
				console.log('user WON?!')
				users[j].score = users[j].score+1
				users[j].location.x = 0
				users[j].location.y = 540
				io.sockets.emit("users", {
						'names' : userNames(users),
						'users' : users,
						'gameData' : gameData
					});
					// io.sockets.emit("userWon", {
					// 		'user' : users[j],
					// 		'names' : userNames(users),
					// 		'users' : users
					// 	});
			}
		}
	}
}



var speed = -30;
var carInterval = 2000;

setInterval(function() {
	// console.log('interval')
	for (var i = 0; i < cars.length; i += 1) {
		// console.log('car direction',cars[i])
		if (cars[i].direction == 'right') {// cars at top
			cars[i].x += speed;
		} else {// cars at bottom
			cars[i].x += -speed;
		}
	}
	// console.log('draw')
	io.sockets.emit("draw", {
		'cars' : cars,
		'users' : users,
		'isGameLive' : isGameLive
	});
	detectCollisons();
}, 100);
