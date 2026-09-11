import Notification from '../models/Notification.js';
import Product from '../models/Product.js';

// @desc    Get notifications for user/role
// @route   GET /api/notifications
export const getNotifications = async (req, res, next) => {
  try {
    // If Admin, ensure low stock notifications exist for any low-stock products in MongoDB
    if (req.user && req.user.role === 'ADMIN') {
      const lowStockProducts = await Product.find({
        active: { $ne: false },
        $expr: { $lte: ['$currentQuantity', { $ifNull: ['$minimumQuantity', '$minimumStockLevel'] }] }
      });

      for (const p of lowStockProducts) {
        const min = p.minimumQuantity !== undefined ? p.minimumQuantity : (p.minimumStockLevel || 5);
        const exists = await Notification.findOne({
          type: 'LOW_STOCK',
          referenceId: p.productCode,
          isRead: false
        });
        if (!exists) {
          await Notification.create({
            title: 'Low Stock Alert',
            message: `Product "${p.productName || p.name}" (${p.productCode}) is at or below minimum stock level (${p.currentQuantity} ${p.unit} remaining, Minimum: ${min}).`,
            type: 'LOW_STOCK',
            targetRole: 'ADMIN',
            referenceId: p.productCode
          }).catch(() => {});
        }
      }
    }

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
