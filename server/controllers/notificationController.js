import Notification from '../models/Notification.js';
import Product from '../models/Product.js';

// @desc    Get notifications for user/role
// @route   GET /api/notifications
export const getNotifications = async (req, res, next) => {
  try {

    let baseQuery = {
      $or: [
        { targetRole: 'ALL' },
        { targetRole: req.user.role },
        { targetUserId: req.user._id }
      ]
    };

    let query = { ...baseQuery };
    if (req.query.unread === 'true') {
      query.isRead = false;
      query.readBy = { $ne: req.user._id };
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);

    const unreadCount = await Notification.countDocuments({
      ...baseQuery,
      isRead: false,
      readBy: { $ne: req.user._id }
    });

    res.json({
      success: true,
      unreadCount,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
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
