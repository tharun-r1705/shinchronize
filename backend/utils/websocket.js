const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

function initializeWebSocket(server) {
  const io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware for WebSocket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userModel = decoded.role === 'student' ? 'Student' : 
                         decoded.role === 'recruiter' ? 'Recruiter' : 'Admin';
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user-specific room for targeted notifications
    socket.join(`user_${socket.userId}`);

    // Handle manual notification request
    socket.on('request_notifications', async () => {
      try {
        const Notification = require('../models/Notification');
        const notifications = await Notification.find({
          recipient: socket.userId,
          recipientModel: socket.userModel,
          isRead: false
        })
        .sort({ createdAt: -1 })
        .limit(10);

        socket.emit('notifications_list', notifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    });

    // Handle typing indicators for chat (future feature)
    socket.on('typing_start', (data) => {
      socket.to(`chat_${data.chatId}`).emit('user_typing', {
        userId: socket.userId,
        chatId: data.chatId
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(`chat_${data.chatId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        chatId: data.chatId
      });
    });

    // Handle online status
    socket.on('status_update', (status) => {
      socket.broadcast.emit('user_status_changed', {
        userId: socket.userId,
        status: status
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      socket.broadcast.emit('user_status_changed', {
        userId: socket.userId,
        status: 'offline'
      });
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Make io accessible globally for notification creation
  global.io = io;

  return io;
}

module.exports = { initializeWebSocket };
