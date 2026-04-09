const prisma = require('../config/prisma');

const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.notification.count({ where: { userId: req.user.id } }),
      prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
    ]);

    const fmt = (n) => ({ ...n, _id: n.id });
    res.json({ notifications: notifications.map(fmt), total, unreadCount, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

const markRead = async (req, res, next) => {
  try {
    const n = await prisma.notification.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!n) return res.status(404).json({ message: 'Notification not found' });

    const updated = await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
    res.json({ notification: { ...updated, _id: updated.id } });
  } catch (err) {
    next(err);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, markRead, markAllRead };
