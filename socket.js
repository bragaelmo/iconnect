const server = require('./server');
const io = require('socket.io')(server, {
    cors: {
      methods: ["GET", "POST"]
    }
});


module.exports = io;