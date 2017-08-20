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
var port = process.env.PORT || 3000;

app.listen(port);

// socket.io
io.sockets.on('connection', function(socket) {

	var user = addUser();
	var data = {
		'currentUser' : user,
		'users' : users,
		'names' : userNames(users)
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

		setInterval(function() {
			var c1 = new Car(20, 20, 0, 400, 'left');
			var c2 = new Car(20, 20, 850, 200, 'right');
			var c3 = new Car(20, 20, 0, 100, 'left');
			cars.push(c1);
			cars.push(c2);
			cars.push(c3);
		}, 1000);

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
			'user' : user
		});
	});

	socket.on("BecomeFrog", function(n) {;
		console.log("BecomeFrog")
		for (var i = 0; i < users.length; i++) {
			if (user.id === users[i].id) {
				users[i].player = true;
				break;
			}
		}

		io.sockets.emit("becameFrog", {'users': users});

		io.sockets.emit("users", {
			'names' : userNames(users),
			'users' : users,
			'user' : user
		});

	});

	socket.on("BuyCarRow", function(n) {;
		console.log("BuyCarRow")


	});

});


var users = [];
var cars = [];
var isGameLive = false;
var potentialCars =[];

function userNames(users) {
	var str = '<table border=1>';
	for (var i = 0; i < users.length; i++) {
		var user = users[i];
		str += '<tr><td>' + user.name + '</td>'
		status = 'none'
		if(user.player) { status = 'Frog'}
		if(user.color) { status = user.color }
		str+= '<td>' + status +'</td>'

		str += '</tr>';

	}
	return str+'</table>';
}



function newUserLocation() {

}

var addUser = function() {
	var user = {
		id : users.length,
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
		'users' : users
	});
};

function Car(width, height, x, y, direction) {
	this.width = width;
	this.height = height;
	this.x = x;
	this.y = y;
	this.direction = direction;
}



function detectCollisons() {
	for (var i = 0; i < cars.length; i += 1) {
		for (var j = 0; j < users.length; j += 1) {
			if (Math.abs((cars[i].x - users[j].location.x)) < 50) {
				if (Math.abs((cars[i].y - users[j].location.y)) < 50) {
					var loser = users[j];
					users[j].location.y = 540;
					users[j].lost = true;
					// io.sockets.emit("lose", loser.name);                ///may not need a lose event
					io.sockets.emit("users", {
						'names' : userNames(users),
						'users' : users
					});
				}
			}
			if(users[j].location.y<0){
				users[j].won = true;
				io.sockets.emit("users", {
						'names' : userNames(users),
						'users' : users
					});
			}
		}
	}
}

var speed = -30;

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
