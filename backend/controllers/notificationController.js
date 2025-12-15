const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');

// Get notifications for the authenticated user
exports.getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly = false } = req.query;
  
  const query = {
    recipient: req.user._id,
    recipientModel: req.user.constructor.modelName
  };
  
  if (unreadOnly === 'true') {
    query.isRead = false;
  }
  
  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));
  
  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    recipientModel: req.user.constructor.modelName,
    isRead: false
  });
  
  res.json({
    success: true,
    data: {
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      unreadCount
    }
  });
});

// Mark notification as read
exports.markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    {
      _id: req.params.id,
      recipient: req.user._id,
      recipientModel: req.user.constructor.modelName
    },
    {
      isRead: true,
      readAt: new Date()
    },
    { new: true }
  );
  
  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }
  
  // Emit WebSocket event
  if (req.app.get('io')) {
    req.app.get('io').to(`user_${req.user._id}`).emit('notification_read', {
      notificationId: notification._id
    });
  }
  
  res.json({
    success: true,
    data: notification
  });
});

// Mark all notifications as read
exports.markAllAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    {
      recipient: req.user._id,
      recipientModel: req.user.constructor.modelName,
      isRead: false
    },
    {
      isRead: true,
      readAt: new Date()
    }
  );
  
  // Emit WebSocket event
  if (req.app.get('io')) {
    req.app.get('io').to(`user_${req.user._id}`).emit('all_notifications_read');
  }
  
  res.json({
    success: true,
    message: `${result.modifiedCount} notifications marked as read`
  });
});

// Delete notification
exports.deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user._id,
    recipientModel: req.user.constructor.modelName
  });
  
  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Notification deleted'
  });
});

// Create notification (internal use or admin)
exports.createNotification = async (recipientId, recipientModel, data) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      recipientModel,
      ...data
    });
    
    // Emit WebSocket event for real-time delivery
    const io = global.io;
    if (io) {
      io.to(`user_${recipientId}`).emit('new_notification', notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Bulk create notifications
exports.createBulkNotifications = async (recipients, data) => {
  try {
    const notifications = recipients.map(recipient => ({
      recipient: recipient.id,
      recipientModel: recipient.model,
      ...data
    }));
    
    const created = await Notification.insertMany(notifications);
    
    // Emit WebSocket events
    const io = global.io;
    if (io) {
      recipients.forEach((recipient, index) => {
        io.to(`user_${recipient.id}`).emit('new_notification', created[index]);
      });
    }
    
    return created;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    return [];
  }
};

// Get unread count
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    recipient: req.user._id,
    recipientModel: req.user.constructor.modelName,
    isRead: false
  });
  
  res.json({
    success: true,
    data: { unreadCount: count }
  });
});

// Delete old read notifications (cleanup utility)
exports.cleanupOldNotifications = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await Notification.deleteMany({
      isRead: true,
      readAt: { $lt: thirtyDaysAgo }
    });
    
    console.log(`Cleaned up ${result.deletedCount} old notifications`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    return 0;
  }
};
