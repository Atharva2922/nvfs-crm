import { db } from "@/lib/db";

export interface GetNotificationsOptions {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
  type?: string;
}

interface CachedNotificationUnread {
  count: number;
  cachedAt: number;
}
const notificationUnreadCache = new Map<string, CachedNotificationUnread>();
const NOTIFICATION_CACHE_TTL_MS = 25 * 1000; // 25s

export function invalidateNotificationUnreadCache(userId?: string) {
  if (userId) {
    notificationUnreadCache.delete(userId);
  } else {
    notificationUnreadCache.clear();
  }
}

export class NotificationService {
  /**
   * Retrieves notifications for a given user
   */
  static async getUserNotifications(userId: string, options: GetNotificationsOptions = {}) {
    const { unreadOnly = false, limit = 20, offset = 0, type } = options;

    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }
    if (type) {
      where.type = type.includes(",") ? { in: type.split(",").map((t) => t.trim()) } : type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      db.notification.count({ where }),
      db.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
    };
  }

  /**
   * Marks a specific notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    const res = await db.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    invalidateNotificationUnreadCache(userId);
    return res;
  }

  /**
   * Marks all unread notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    const res = await db.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    invalidateNotificationUnreadCache(userId);
    return res;
  }

  /**
   * Deletes a notification
   */
  static async deleteNotification(notificationId: string, userId: string) {
    const notification = await db.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    return db.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Fast count of unread notifications for header bell badge with in-memory caching
   */
  static async getUnreadCount(userId: string) {
    const cached = notificationUnreadCache.get(userId);
    const now = Date.now();
    if (cached && now - cached.cachedAt < NOTIFICATION_CACHE_TTL_MS) {
      return cached.count;
    }

    const count = await db.notification.count({
      where: { userId, isRead: false },
    });

    notificationUnreadCache.set(userId, { count, cachedAt: Date.now() });
    return count;
  }
}
