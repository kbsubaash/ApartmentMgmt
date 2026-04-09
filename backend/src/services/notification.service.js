const prisma = require('../config/prisma');
const { sendCircularPublishedEmail, sendComplaintStatusEmail } = require('./email.service');

/**
 * Creates a single in-app notification + sends email for that user.
 */
const createNotification = async ({ userId, type, message, relatedEntity, relatedId }) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        relatedEntity: relatedEntity || null,
        relatedId: relatedId || null,
      },
    });

    // Send email for specific types
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    if (!user) return;

    if (type === 'COMPLAINT_STATUS_CHANGED' && relatedId) {
      await sendComplaintStatusEmail({
        to: user.email,
        name: user.name,
        complaintTitle: message,
        status: message.split('to ')[1] || '',
        complaintId: relatedId,
      });
    }
  } catch (err) {
    console.error('Notification creation error:', err.message);
  }
};

/**
 * Creates in-app notifications + sends emails to a list of users (e.g., on circular publish).
 */
const createNotificationsForAudience = async ({ users, type, message, relatedEntity, relatedId }) => {
  try {
    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type,
        message,
        isRead: false,
        relatedEntity: relatedEntity || null,
        relatedId: relatedId || null,
      })),
    });

    if (type === 'CIRCULAR_PUBLISHED') {
      await Promise.all(
        users.map((u) =>
          sendCircularPublishedEmail({
            to: u.email,
            name: u.name,
            title: message.replace('New circular published: "', '').replace('"', ''),
            circularId: relatedId,
          })
        )
      );
    }
  } catch (err) {
    console.error('Bulk notification error:', err.message);
  }
};

module.exports = { createNotification, createNotificationsForAudience };
