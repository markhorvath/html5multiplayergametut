var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

//make a server that listens to Port 2000
serv.listen(2000);
console.log('server started');

var SOCKET_LIST = {};
var PLAYER_LIST = {};

var Player = function(id) {
        this.x = 250;
        this.y = 250;
        this.id = id;
        this.number = "" + Math.floor(1000 * Math.random());
        this.pressingRight = false;
        this.pressingLeft = false;
        this.pressingUp = false;
        this.pressingDown = false;
        this.maxSpd = 10
};

Player.prototype.updatePosition = function() {
    var self = this;
        if(self.pressingRight)
            self.x += self.maxSpd;
        if(self.pressingLeft)
            self.x -= self.maxSpd;
        if(self.pressingUp)
            self.y -= self.maxSpd;
        if(self.pressingDown)
            self.y += self.maxSpd;
};

var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket){
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;

    var player = new Player(socket.id);
    PLAYER_LIST[socket.id] = player;

    socket.on('disconnect', function(){
        delete SOCKET_LIST[socket.id];
        delete PLAYER_LIST[socket.id];
    });

    socket.on('keyPress', function(data){
        if(data.inputId === 'right')
            player.pressingRight = data.state;
        else if(data.inputId === 'left')
            player.pressingLeft = data.state;
        else if(data.inputId === 'up')
            player.pressingUp = data.state;
        else if(data.inputId === 'down')
            player.pressingDown = data.state;
    });

});

setInterval(function() {
    var pack = [];
    for (var i in PLAYER_LIST) {
        var player = PLAYER_LIST[i];
        player.updatePosition();
        pack.push({
            x: player.x,
            y: player.y,
            number: player.number
        });
    }

    for (var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        socket.emit('newPositions', pack);
    }

},1000/25);