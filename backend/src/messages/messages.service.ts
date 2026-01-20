import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message, MessageType } from './entities/message.entity';
import { CreateConversationDto, SendMessageDto } from './dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private eventEmitter: EventEmitter2,
  ) {}

  // Get all conversations for a user
  async getConversations(userId: string, page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;

    const [conversations, total] = await this.conversationRepository.findAndCount({
      where: [
        { participantOneId: userId },
        { participantTwoId: userId },
      ],
      relations: ['participantOne', 'participantTwo', 'property'],
      order: { lastMessageAt: 'DESC' },
      skip,
      take: pageSize,
    });

    // Transform to show the other participant
    const transformed = conversations.map((conv) => ({
      id: conv.id,
      participant: conv.participantOneId === userId ? conv.participantTwo : conv.participantOne,
      property: conv.property,
      lastMessage: conv.lastMessageContent,
      lastMessageAt: conv.lastMessageAt,
      unreadCount: conv.participantOneId === userId 
        ? conv.participantOneUnreadCount 
        : conv.participantTwoUnreadCount,
      isBlocked: conv.isBlocked,
      createdAt: conv.createdAt,
    }));

    return {
      data: transformed,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // Get single conversation with messages
  async getConversation(conversationId: string, userId: string, page: number = 1, pageSize: number = 50) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participantOne', 'participantTwo', 'property'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check if user is part of conversation
    if (conversation.participantOneId !== userId && conversation.participantTwoId !== userId) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    const skip = (page - 1) * pageSize;

    const [messages, total] = await this.messageRepository.findAndCount({
      where: { conversationId, isDeleted: false },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize,
    });

    // Mark messages as read
    await this.markAsRead(conversationId, userId);

    return {
      conversation: {
        id: conversation.id,
        participant: conversation.participantOneId === userId 
          ? conversation.participantTwo 
          : conversation.participantOne,
        property: conversation.property,
        isBlocked: conversation.isBlocked,
        blockedBy: conversation.blockedBy,
      },
      messages: messages.reverse(),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // Start a new conversation
  async createConversation(userId: string, dto: CreateConversationDto) {
    if (userId === dto.recipientId) {
      throw new BadRequestException('Cannot start conversation with yourself');
    }

    // Check if conversation already exists
    const existing = await this.conversationRepository.findOne({
      where: [
        { participantOneId: userId, participantTwoId: dto.recipientId },
        { participantOneId: dto.recipientId, participantTwoId: userId },
      ],
      relations: ['participantOne', 'participantTwo', 'property'],
    });

    if (existing) {
      // If there's an initial message, send it
      if (dto.initialMessage) {
        await this.sendMessage(userId, {
          conversationId: existing.id,
          recipientId: dto.recipientId,
          content: dto.initialMessage,
        });
      }
      return existing;
    }

    // Create new conversation
    const conversation = this.conversationRepository.create({
      participantOneId: userId,
      participantTwoId: dto.recipientId,
      propertyId: dto.propertyId || null,
    });

    const saved = await this.conversationRepository.save(conversation);

    // Send initial message if provided
    if (dto.initialMessage) {
      await this.sendMessage(userId, {
        conversationId: saved.id,
        recipientId: dto.recipientId,
        content: dto.initialMessage,
      });
    }

    // Reload with relations
    return this.conversationRepository.findOne({
      where: { id: saved.id },
      relations: ['participantOne', 'participantTwo', 'property'],
    });
  }

  // Send a message
  async sendMessage(userId: string, dto: SendMessageDto) {
    let conversation: Conversation | null;

    if (dto.conversationId) {
      conversation = await this.conversationRepository.findOne({
        where: { id: dto.conversationId },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (conversation.participantOneId !== userId && conversation.participantTwoId !== userId) {
        throw new ForbiddenException('You are not part of this conversation');
      }

      if (conversation.isBlocked) {
        throw new ForbiddenException('This conversation is blocked');
      }
    } else {
      // Find or create conversation
      conversation = await this.conversationRepository.findOne({
        where: [
          { participantOneId: userId, participantTwoId: dto.recipientId },
          { participantOneId: dto.recipientId, participantTwoId: userId },
        ],
      });

      if (!conversation) {
        conversation = this.conversationRepository.create({
          participantOneId: userId,
          participantTwoId: dto.recipientId,
          propertyId: dto.propertyId || null,
        });
        conversation = await this.conversationRepository.save(conversation);
      }
    }

    // Create message
    const message = this.messageRepository.create({
      conversationId: conversation.id,
      senderId: userId,
      content: dto.content,
      type: MessageType.TEXT,
      attachments: dto.attachments || null,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update conversation
    const isParticipantOne = conversation.participantOneId === userId;
    await this.conversationRepository.update(conversation.id, {
      lastMessageContent: dto.content.substring(0, 100),
      lastMessageAt: new Date(),
      ...(isParticipantOne 
        ? { participantTwoUnreadCount: () => 'participant_two_unread_count + 1' }
        : { participantOneUnreadCount: () => 'participant_one_unread_count + 1' }),
    });

    // Emit event for real-time notification
    this.eventEmitter.emit('message.sent', {
      message: savedMessage,
      recipientId: isParticipantOne ? conversation.participantTwoId : conversation.participantOneId,
    });

    // Reload with sender relation
    return this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender'],
    });
  }

  // Mark messages as read
  async markAsRead(conversationId: string, userId: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Mark messages as read
    await this.messageRepository.update(
      { conversationId, senderId: userId === conversation.participantOneId 
        ? conversation.participantTwoId 
        : conversation.participantOneId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    // Reset unread count
    if (conversation.participantOneId === userId) {
      await this.conversationRepository.update(conversationId, { participantOneUnreadCount: 0 });
    } else {
      await this.conversationRepository.update(conversationId, { participantTwoUnreadCount: 0 });
    }
  }

  // Delete a message
  async deleteMessage(messageId: string, userId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.messageRepository.update(messageId, {
      isDeleted: true,
      deletedAt: new Date(),
      content: 'This message was deleted',
    });
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    const conversations = await this.conversationRepository.find({
      where: [
        { participantOneId: userId },
        { participantTwoId: userId },
      ],
    });

    return conversations.reduce((total, conv) => {
      if (conv.participantOneId === userId) {
        return total + conv.participantOneUnreadCount;
      }
      return total + conv.participantTwoUnreadCount;
    }, 0);
  }

  // Block user in conversation
  async blockUser(conversationId: string, userId: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.participantOneId !== userId && conversation.participantTwoId !== userId) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    await this.conversationRepository.update(conversationId, {
      isBlocked: true,
      blockedBy: userId,
    });
  }

  // Unblock user in conversation
  async unblockUser(conversationId: string, userId: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.blockedBy !== userId) {
      throw new ForbiddenException('Only the user who blocked can unblock');
    }

    await this.conversationRepository.update(conversationId, {
      isBlocked: false,
      blockedBy: null,
    });
  }

  // Create a guest inquiry message (system message to property owner)
  async createGuestInquiryMessage(
    ownerId: string,
    propertyId: string,
    guestInfo: {
      name: string;
      email: string;
      phone: string;
      message: string;
      bookingId: string;
    }
  ) {
    // For guest inquiries, we create a special "system" conversation
    // where the owner can see the inquiry but the guest isn't a registered user
    
    // Check if there's already a conversation for this property from the same email
    // We'll use a pseudo-conversation approach where participantTwo is null or a system ID
    
    // Create a conversation with owner as both participants (self-conversation for inbox)
    // This is a workaround since we don't have a guest user ID
    let conversation = await this.conversationRepository.findOne({
      where: {
        participantOneId: ownerId,
        participantTwoId: ownerId,
        propertyId: propertyId,
      },
    });

    if (!conversation) {
      conversation = this.conversationRepository.create({
        participantOneId: ownerId,
        participantTwoId: ownerId, // Self-reference for guest inquiries
        propertyId: propertyId,
      });
      conversation = await this.conversationRepository.save(conversation);
    }

    // Create the message with guest info embedded
    const messageContent = `📬 **Guest Inquiry**\n\n${guestInfo.message}\n\n---\n*Reply to this inquiry by contacting the guest directly:*\n📧 ${guestInfo.email}\n📞 ${guestInfo.phone}`;

    const message = this.messageRepository.create({
      conversationId: conversation.id,
      senderId: ownerId, // System message appears as from owner
      content: messageContent,
      type: MessageType.SYSTEM,
      metadata: {
        isGuestInquiry: true,
        guestName: guestInfo.name,
        guestEmail: guestInfo.email,
        guestPhone: guestInfo.phone,
        bookingId: guestInfo.bookingId,
      },
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update conversation
    await this.conversationRepository.update(conversation.id, {
      lastMessageContent: `Guest inquiry from ${guestInfo.name}`,
      lastMessageAt: new Date(),
      participantOneUnreadCount: () => 'participantOneUnreadCount + 1',
    });

    console.log('[MESSAGES SERVICE] ✅ Guest inquiry message created:', {
      conversationId: conversation.id,
      messageId: savedMessage.id,
      guestName: guestInfo.name,
    });

    return conversation;
  }
}
