import Notification from '../models/Notification.js';

// @desc    Get notifications for user/role
// @route   GET /api/notifications
export const getNotifications = async (req, res, next) => {
  try {
    let query = {
      $or: [
        { targetRole: 'ALL' },
        { targetRole: req.user.role },
        { targetUserId: req.user._id }
      ]
    };

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50);
    const unreadCount = notifications.filter(
      (n) => !n.isRead && !n.readBy.some((uid) => String(uid) === String(req.user._id))
    ).length;

    res.json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark single notification as read
// @route   PUT /api/notifications/:id/read
export const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    if (!notification.readBy.includes(req.user._id)) {
      notification.readBy.push(req.user._id);
    }
    notification.isRead = true;
    await notification.save();

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      {
        $or: [
          { targetRole: 'ALL' },
          { targetRole: req.user.role },
          { targetUserId: req.user._id }
        ]
      },
      {
        $set: { isRead: true },
        $addToSet: { readBy: req.user._id }
      }
    );

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};
