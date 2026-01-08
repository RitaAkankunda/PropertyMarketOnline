import { Controller, Get, Patch, Param, Query, UseGuards, Request, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  @Get()
  async getNotifications(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    try {
      this.logger.log('[NOTIFICATIONS API] ====== GET /notifications called ======');
      this.logger.log(`[NOTIFICATIONS API] Request user object: ${JSON.stringify(req.user)}`);
      this.logger.log(`[NOTIFICATIONS API] Request user keys: ${req.user ? Object.keys(req.user) : 'null'}`);
      this.logger.log(`[NOTIFICATIONS API] Request user role: ${req.user?.role}`);
      this.logger.log(`[NOTIFICATIONS API] Request user email: ${req.user?.email}`);
      
      const userId = req.user?.sub || req.user?.id;
      this.logger.log(`[NOTIFICATIONS API] Extracted userId: ${userId}`);
      
      if (!userId) {
        this.logger.error('[NOTIFICATIONS API] No userId found in request');
        this.logger.error('[NOTIFICATIONS API] Full request object keys:', Object.keys(req));
        throw new HttpException('User ID not found in authentication token', HttpStatus.UNAUTHORIZED);
      }
      
      const options = {
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
        unreadOnly: unreadOnly === 'true',
      };
      
      this.logger.log(`[NOTIFICATIONS API] Calling service with userId: ${userId}, options: ${JSON.stringify(options)}`);

      const result = await this.notificationsService.findByUserId(userId, options);
      this.logger.log(`[NOTIFICATIONS API] Success! Found ${result.notifications.length} notifications, total: ${result.total}`);
      if (result.notifications.length > 0) {
        this.logger.log(`[NOTIFICATIONS API] Sample notification userIds: ${result.notifications.slice(0, 3).map(n => n.userId).join(', ')}`);
      }
      return result;
    } catch (error) {
      this.logger.error('[NOTIFICATIONS API] ====== ERROR IN GET /notifications ======');
      this.logger.error('[NOTIFICATIONS API] Error type:', error?.constructor?.name);
      this.logger.error('[NOTIFICATIONS API] Error message:', error?.message);
      this.logger.error('[NOTIFICATIONS API] Error stack:', error?.stack);
      if (error?.code) {
        this.logger.error('[NOTIFICATIONS API] Error code:', error.code);
      }
      this.logger.error('[NOTIFICATIONS API] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        error?.message || 'Failed to fetch notifications',
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const userId = req.user?.sub || req.user?.id;
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req) {
    const userId = req.user?.sub || req.user?.id;
    const notification = await this.notificationsService.markAsRead(id, userId);
    
    // Emit unread count update via WebSocket
    const unreadCount = await this.notificationsService.getUnreadCount(userId);
    this.notificationsGateway.sendUnreadCountToUser(userId, unreadCount);
    
    return notification;
  }

  @Patch('mark-all-read')
  async markAllAsRead(@Request() req) {
    const userId = req.user?.sub || req.user?.id;
    await this.notificationsService.markAllAsRead(userId);
    
    // Emit unread count update via WebSocket
    this.notificationsGateway.sendUnreadCountToUser(userId, 0);
    
    return { message: 'All notifications marked as read' };
  }
}
