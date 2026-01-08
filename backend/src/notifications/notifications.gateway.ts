import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
    ],
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly connectedClients = new Map<string, string>(); // userId -> socketId

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake auth or query
      const token =
        client.handshake.auth?.token ||
        client.handshake.query?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(
          `[WS] Client ${client.id} connected without token, disconnecting...`,
        );
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Attach userId to socket
      client.userId = payload.sub || payload.id;
      this.connectedClients.set(client.userId, client.id);

      // Join room for this user (so we can send notifications to specific users)
      await client.join(`user:${client.userId}`);

      this.logger.log(
        `[WS] Client ${client.id} connected (userId: ${client.userId})`,
      );
      this.logger.log(
        `[WS] Total connected clients: ${this.connectedClients.size}`,
      );
    } catch (error) {
      this.logger.error(
        `[WS] Authentication failed for client ${client.id}:`,
        error.message,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedClients.delete(client.userId);
      this.logger.log(
        `[WS] Client ${client.id} disconnected (userId: ${client.userId})`,
      );
      this.logger.log(
        `[WS] Total connected clients: ${this.connectedClients.size}`,
      );
    } else {
      this.logger.log(`[WS] Client ${client.id} disconnected (unauthenticated)`);
    }
  }

  /**
   * Send notification to a specific user
   */
  sendNotificationToUser(userId: string, notification: any) {
    this.logger.log(
      `[WS] Sending notification to user ${userId}: ${notification.id}`,
    );
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  /**
   * Send notification count update to a specific user
   */
  sendUnreadCountToUser(userId: string, count: number) {
    this.logger.log(`[WS] Sending unread count to user ${userId}: ${count}`);
    this.server.to(`user:${userId}`).emit('unread-count', { count });
  }

  /**
   * Handle client requesting to mark notification as read
   */
  @SubscribeMessage('mark-as-read')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { notificationId: string },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    this.logger.log(
      `[WS] User ${client.userId} marking notification ${data.notificationId} as read`,
    );

    // Emit back to confirm (the actual marking is handled by the HTTP endpoint)
    return { success: true, notificationId: data.notificationId };
  }

  /**
   * Get connected clients count (for debugging)
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Check if a user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.connectedClients.has(userId);
  }
}
