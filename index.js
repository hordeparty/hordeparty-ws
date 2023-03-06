const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
  cors: {
    origin: '*',
  }
});
const port = process.env.PORT || 3000;

function makeRoomId(length) {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

const joinRoom = (socket, room) => {
  socket.join(room);
  socket.data.currentRoom = room;
  socket.emit("joinRoom", room);
}

class Package {
  from = null;
  msg = null;

  constructor(from, msg) {
    this.from = from;
    this.msg = msg;
  }
}

io.of("/clients").on('connection', (socket) => {

  socket.on('createRoom', function () {
    const rooms = io.of("/clients").adapter.rooms;
    let roomId = makeRoomId(4);
    let itmp = 0;
    do {
      roomId = makeRoomId(4);
      if (itmp++ == 50) {
        break;
      }
    } while (typeof rooms.get(roomId) !== 'undefined');
    socket.join(roomId);
    socket.data.currentRoom = roomId;
    socket.emit("createRoom", roomId);
  });

  socket.on('joinRoom', room => {
    joinRoom(socket, room);
  });

  socket.on('clientHello', name => {
    let room = socket.data.currentRoom;
    let package = new Package(socket.id, name);
    io.of("/servers").in(room).emit('clientHello', package);
  });

  socket.on('clientAnswer', data => {
    let room = socket.data.currentRoom;
    let package = new Package(socket.id, data);
    io.of("/servers").in(room).emit('clientAnswer', package);
  });

  socket.on('changePlayerName', playerName => {
    let room = socket.data.currentRoom;
    let package = new Package(socket.id, playerName);
    io.of("/servers").in(room).emit('changePlayerName', package);
  });

});

io.of("/servers").on('connection', (socket) => {

  socket.on('joinRoom', room => {
    joinRoom(socket, room);
  });

  socket.on("serverOffer", (clientSocketId, msg) => {
    io.of("/clients").to(clientSocketId).emit('serverOffer', msg);
  });

  socket.on("serverReady", isServerReady => {
    let room = socket.data.currentRoom;
    io.of("/clients").in(room).emit('serverReady', isServerReady);
  });

});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
