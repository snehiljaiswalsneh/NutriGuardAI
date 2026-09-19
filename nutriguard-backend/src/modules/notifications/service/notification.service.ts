import { notificationRepository, NotificationRepository } from '../repository/notification.repository.js';

export class NotificationService {
  constructor(private readonly repository: NotificationRepository = notificationRepository) {}

  async list(userId: string, unreadOnly: boolean, page: number, limit: number) {
    return this.repository.list(userId, unreadOnly, page, limit);
  }

  async markRead(notificationId: string, userId: string): Promise<void> {
    await this.repository.markRead(notificationId, userId);
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repository.markAllRead(userId);
  }

  async delete(notificationId: string, userId: string): Promise<void> {
    await this.repository.delete(notificationId, userId);
  }

  /**
   * Public entry point for OTHER modules to raise a notification (e.g.
   * Analysis calls this on scan completion when the user has
   * `notify_scan_complete` enabled). Kept here — not duplicated per
   * caller — so notification-shape/type consistency lives in one place.
   */
  async notify(userId: string, type: string, title: string, body?: string, linkUrl?: string): Promise<void> {
    await this.repository.create({ userId, type, title, body, linkUrl });
  }
}

export const notificationService = new NotificationService();
