import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId,
      type,
      title,
      message,
      data,
      isRead: false,
    });

    return this.notificationRepository.save(notification);
  }

  async findByUserId(
    userId: string,
    options?: { limit?: number; offset?: number; unreadOnly?: boolean },
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      this.logger.log(`[NOTIFICATIONS SERVICE] Finding notifications for userId: ${userId}, options: ${JSON.stringify(options)}`);
      
      if (!userId) {
        this.logger.error('[NOTIFICATIONS SERVICE] userId is null or undefined');
        throw new Error('User ID is required');
      }

      // Debug: Check all notifications in database to see what userIds exist
      const allNotifications = await this.notificationRepository.find({ take: 10, order: { createdAt: 'DESC' } });
      this.logger.log(`[NOTIFICATIONS SERVICE] DEBUG: Recent notifications in DB (first 10):`);
      allNotifications.forEach((n, idx) => {
        this.logger.log(`[NOTIFICATIONS SERVICE]   [${idx}] userId: ${n.userId}, type: ${n.type}, title: ${n.title}, createdAt: ${n.createdAt}`);
      });

      // Build where clause similar to JobsService pattern
      const where: FindOptionsWhere<Notification> = { userId };
      if (options?.unreadOnly) {
        where.isRead = false;
      }

      const findOptions: {
        where: FindOptionsWhere<Notification>;
        order: { createdAt: 'DESC' };
        take?: number;
        skip?: number;
      } = {
        where,
        order: { createdAt: 'DESC' },
      };
      
      if (options?.limit !== undefined && options.limit > 0) {
        findOptions.take = options.limit;
      }
      if (options?.offset !== undefined && options.offset > 0) {
        findOptions.skip = options.offset;
      }

      this.logger.log(`[NOTIFICATIONS SERVICE] Executing findAndCount with options:`, JSON.stringify(findOptions, null, 2));
      
      const [notifications, total] = await this.notificationRepository.findAndCount(findOptions);

      this.logger.log(`[NOTIFICATIONS SERVICE] Success! Found ${notifications.length} notifications, total: ${total}`);
      if (notifications.length > 0) {
        this.logger.log(`[NOTIFICATIONS SERVICE] Returning notifications with userIds: ${notifications.map(n => n.userId).join(', ')}`);
      } else {
        this.logger.log(`[NOTIFICATIONS SERVICE] ⚠️ No notifications found for userId: ${userId}`);
        this.logger.log(`[NOTIFICATIONS SERVICE] ⚠️ This might indicate a userId mismatch!`);
      }
      return { notifications, total };
    } catch (error) {
      this.logger.error('[NOTIFICATIONS SERVICE] ====== ERROR IN findByUserId ======');
      this.logger.error('[NOTIFICATIONS SERVICE] Error type:', error?.constructor?.name);
      this.logger.error('[NOTIFICATIONS SERVICE] Error message:', error?.message);
      this.logger.error('[NOTIFICATIONS SERVICE] Error stack:', error?.stack);
      if (error?.code) {
        this.logger.error('[NOTIFICATIONS SERVICE] Error code:', error.code);
      }
      if (error?.detail) {
        this.logger.error('[NOTIFICATIONS SERVICE] Error detail:', error.detail);
      }
      if (error?.hint) {
        this.logger.error('[NOTIFICATIONS SERVICE] Error hint:', error.hint);
      }
      this.logger.error('[NOTIFICATIONS SERVICE] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      throw error;
    }
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }
}
