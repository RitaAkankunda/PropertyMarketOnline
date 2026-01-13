import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MessagesService } from './messages.service';
import { CreateConversationDto, SendMessageDto } from './dto';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async getConversations(
    @Request() req,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    const userId = req.user.sub || req.user.id;
    return this.messagesService.getConversations(userId, page || 1, pageSize || 20);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation with messages' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async getConversation(
    @Request() req,
    @Param('id') conversationId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    const userId = req.user.sub || req.user.id;
    return this.messagesService.getConversation(conversationId, userId, page || 1, pageSize || 50);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Start a new conversation' })
  async createConversation(
    @Request() req,
    @Body() dto: CreateConversationDto,
  ) {
    const userId = req.user.sub || req.user.id;
    return this.messagesService.createConversation(userId, dto);
  }

  @Post()
  @ApiOperation({ summary: 'Send a message' })
  async sendMessage(
    @Request() req,
    @Body() dto: SendMessageDto,
  ) {
    const userId = req.user.sub || req.user.id;
    return this.messagesService.sendMessage(userId, dto);
  }

  @Patch('conversations/:id/read')
  @ApiOperation({ summary: 'Mark conversation as read' })
  async markAsRead(
    @Request() req,
    @Param('id') conversationId: string,
  ) {
    const userId = req.user.sub || req.user.id;
    await this.messagesService.markAsRead(conversationId, userId);
    return { success: true };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a message' })
  async deleteMessage(
    @Request() req,
    @Param('id') messageId: string,
  ) {
    const userId = req.user.sub || req.user.id;
    await this.messagesService.deleteMessage(messageId, userId);
    return { success: true };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread message count' })
  async getUnreadCount(@Request() req) {
    const userId = req.user.sub || req.user.id;
    const count = await this.messagesService.getUnreadCount(userId);
    return { count };
  }

  @Post('conversations/:id/block')
  @ApiOperation({ summary: 'Block user in conversation' })
  async blockUser(
    @Request() req,
    @Param('id') conversationId: string,
  ) {
    const userId = req.user.sub || req.user.id;
    await this.messagesService.blockUser(conversationId, userId);
    return { success: true };
  }

  @Delete('conversations/:id/block')
  @ApiOperation({ summary: 'Unblock user in conversation' })
  async unblockUser(
    @Request() req,
    @Param('id') conversationId: string,
  ) {
    const userId = req.user.sub || req.user.id;
    await this.messagesService.unblockUser(conversationId, userId);
    return { success: true };
  }
}
