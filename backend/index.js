'use strict'

const os = require('os');
const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  }
});

const PORT = process.env.PORT || 3001;

io.on('connection', (socket) => {
  console.log('A client connected: ' + socket.id);

  socket.on('knock', (room) => {
    console.log(socket.id + ' is knocking room [' + room + ']');
    var clientsInRoom = io.sockets.adapter.rooms.get(room);
    var numClients = (clientsInRoom === undefined) ? 0 : clientsInRoom.size;
    socket.emit('knocked response', numClients, room);

    socket.on('create', () => {
      console.log(socket.id + ' created room [' + room +']');
      socket.join(room);
      socket.emit('created', room);
    });

    socket.on('join', () => {
      console.log(socket.id + ' joined room [' + room + ']');
      socket.join(room);
      io.sockets.in(room).emit('joined', room, socket.id);
    });

    socket.on('allow', () => {
      console.log('room host allowed joining');
      socket.in(room).emit('allowed');
      socket.emit('allowed');
    });

    socket.on('message', (description) => {
      if (description.type === 'offer') {
        console.log('offer');
        socket.to(room).emit('offer', description);
      } else if (description.type === 'answer') {
        console.log('answer');
        socket.to(room).emit('answer', description);
      } else if (description.type === 'candidate') {
        console.log('candidate');
        socket.to(room).emit('candidate', description);
      } else {
        console.log('[ERROR] We can not read this message.');
      }
    });
  });

  socket.on('disconnect', () => {
    console.log(socket.id + " disconneted");
  })
});


server.listen(PORT, () => {
  console.log('Listening... PORT: ' + PORT);
});
