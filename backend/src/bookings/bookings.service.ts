import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus, BookingType } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { PropertiesService } from 'src/properties/properties.service';
import { UsersService } from 'src/users/users.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/entities/notification.entity';
import { PropertyAvailabilityBlock } from 'src/properties/entities/property-availability.entity';
import { MessagesService } from 'src/messages/messages.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(PropertyAvailabilityBlock)
    private readonly availabilityRepository: Repository<PropertyAvailabilityBlock>,
    private readonly propertiesService: PropertiesService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly messagesService: MessagesService,
  ) {}

  async create(createBookingDto: CreateBookingDto, userId: string | null): Promise<Booking> {
    console.log('[BOOKINGS SERVICE] Creating booking:', {
      propertyId: createBookingDto.propertyId,
      type: createBookingDto.type,
      userId: userId || 'null (guest)',
    });

    // Verify property exists
    let property;
    try {
      property = await this.propertiesService.findOne(createBookingDto.propertyId);
      if (!property) {
        console.error('[BOOKINGS SERVICE] Property not found:', createBookingDto.propertyId);
        throw new NotFoundException('Property not found');
      }
      console.log('[BOOKINGS SERVICE] Property found:', property.id, property.title);
    } catch (error: any) {
      console.error('[BOOKINGS SERVICE] Error finding property:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Property not found: ${createBookingDto.propertyId}`);
    }

    // Verify user exists if userId is provided (optional for guest bookings)
    let user = null;
    if (userId) {
      user = await this.usersService.findOneById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
    }

    // Prevent booking on blocked dates (for Airbnb/hotel bookings)
    if (
      createBookingDto.type === BookingType.BOOKING &&
      createBookingDto.checkInDate &&
      createBookingDto.checkOutDate
    ) {
      const overlappingBlock = await this.availabilityRepository
        .createQueryBuilder('block')
        .where('block.propertyId = :propertyId', { propertyId: createBookingDto.propertyId })
        .andWhere('block.startDate <= :endDate', { endDate: createBookingDto.checkOutDate })
        .andWhere('block.endDate >= :startDate', { startDate: createBookingDto.checkInDate })
        .getOne();

      if (overlappingBlock) {
        throw new BadRequestException('Selected dates are not available');
      }
    }

    // Create booking
    const bookingData: any = {
      ...createBookingDto,
      status: BookingStatus.PENDING,
      currency: createBookingDto.currency || 'UGX',
      userId: userId || null, // Explicitly set to null for guest bookings
    };

    console.log('[BOOKINGS SERVICE] Booking data to save:', {
      ...bookingData,
      userId: bookingData.userId || 'null',
    });

    const booking = this.bookingRepository.create(bookingData);

    let savedBooking;
    try {
      console.log('[BOOKINGS SERVICE] Attempting to save booking to database...');
      savedBooking = await this.bookingRepository.save(booking);
      console.log('[BOOKINGS SERVICE] ✅ Booking saved to database:', {
        id: savedBooking.id,
        propertyId: savedBooking.propertyId,
        userId: savedBooking.userId || 'null (guest)',
        type: savedBooking.type,
        status: savedBooking.status,
        name: savedBooking.name,
        email: savedBooking.email,
        scheduledDate: savedBooking.scheduledDate,
        scheduledTime: savedBooking.scheduledTime,
        createdAt: savedBooking.createdAt,
      });
    } catch (error: any) {
      console.error('[BOOKINGS SERVICE] Error saving booking:', error);
      console.error('[BOOKINGS SERVICE] Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        userId: userId,
        hasUserId: !!userId,
        bookingDataKeys: Object.keys(bookingData),
      });
      console.error('[BOOKINGS SERVICE] Full error:', JSON.stringify(error, null, 2));
      
      // If error is about NOT NULL constraint, provide helpful message
      if (error.message?.includes('null value') || error.message?.includes('NOT NULL') || error.code === '23502') {
        const sqlFix = 'ALTER TABLE bookings ALTER COLUMN "userId" DROP NOT NULL;';
        console.error(`[BOOKINGS SERVICE] userId column is still NOT NULL. Run this SQL: ${sqlFix}`);
        throw new BadRequestException('Database configuration error: userId column must be nullable for guest bookings. Please run: ' + sqlFix);
      }
      
      // Re-throw with more context
      throw new BadRequestException(`Failed to create booking: ${error.message || 'Unknown error'}`);
    }

    // FIRST: Auto-create conversation with property owner (for both authenticated and guest users)
    // We do this FIRST so we can include the conversationId in the notification
    let conversationId: string | null = null;
    const requesterName = user 
      ? `${user.firstName} ${user.lastName}` 
      : createBookingDto.name || 'Guest';
    
    if (property.ownerId) {
      try {
        // Build initial message based on booking type
        let initialMessage = '';
        const bookingTypeLabel = createBookingDto.type === BookingType.VIEWING 
          ? 'viewing' 
          : createBookingDto.type === BookingType.INQUIRY 
          ? 'inquiry'
          : 'booking';
        
        initialMessage = `🏠 **New ${bookingTypeLabel.charAt(0).toUpperCase() + bookingTypeLabel.slice(1)} Request**\n\n`;
        
        if (!userId) {
          // Guest user - include their info prominently
          initialMessage += `👤 **From:** ${requesterName} (Guest)\n`;
          initialMessage += `📧 **Email:** ${createBookingDto.email || 'Not provided'}\n`;
          initialMessage += `📞 **Phone:** ${createBookingDto.phone || 'Not provided'}\n\n`;
        }
        
        initialMessage += `Hi, I'm interested in your property "${property.title}".\n\n`;
        
        if (createBookingDto.type === BookingType.VIEWING && createBookingDto.scheduledDate) {
          initialMessage += `📅 **Requested Date:** ${createBookingDto.scheduledDate}\n`;
          if (createBookingDto.scheduledTime) {
            initialMessage += `⏰ **Preferred Time:** ${createBookingDto.scheduledTime}\n`;
          }
        }
        
        if (createBookingDto.message) {
          initialMessage += `\n💬 **Message:** ${createBookingDto.message}\n`;
        }
        
        if (userId) {
          initialMessage += `\n📞 **Contact:** ${createBookingDto.phone || user?.phone || 'Not provided'}`;
          initialMessage += `\n📧 **Email:** ${createBookingDto.email || user?.email || 'Not provided'}`;
        }
        
        console.log('[BOOKINGS SERVICE] Creating conversation with property owner:', {
          userId: userId || 'guest',
          ownerId: property.ownerId,
          propertyId: property.id,
        });
        
        // For authenticated users, create a full two-way conversation
        if (userId && userId !== property.ownerId) {
          try {
            const conversation = await this.messagesService.createConversation(userId, {
              recipientId: property.ownerId,
              propertyId: property.id,
              initialMessage,
            });
            conversationId = conversation?.id || null;
            console.log('[BOOKINGS SERVICE] ✅ Conversation created for authenticated user:', { conversationId });
          } catch (convError) {
            console.error('[BOOKINGS SERVICE] ❌ Failed to create conversation for authenticated user:', convError);
          }
        } else if (!userId) {
          // For guest users, skip conversation creation for now
          // They can reply via email/phone, owner can create conversation later if needed
          console.log('[BOOKINGS SERVICE] Guest inquiry - skipping conversation creation');
        }
        
        console.log('[BOOKINGS SERVICE] ✅ Conversation created successfully:', { conversationId });
      } catch (error: any) {
        console.error('[BOOKINGS SERVICE] ❌ Failed to create conversation:', error);
        // Don't fail the booking creation if conversation creation fails
      }
    }

    // SECOND: Send notification to property owner (WITH conversationId)
    try {
      console.log('[BOOKINGS SERVICE] Creating notification for property owner:', {
        ownerId: property.ownerId,
        type: NotificationType.BOOKING_CREATED,
        bookingId: savedBooking.id,
        conversationId: conversationId,
      });
      
      const notification = await this.notificationsService.create(
        property.ownerId,
        NotificationType.BOOKING_CREATED,
        `New ${createBookingDto.type} request`,
        `${requesterName} has submitted a ${createBookingDto.type} request for ${property.title}`,
        {
          bookingId: savedBooking.id,
          propertyId: property.id,
          type: createBookingDto.type,
          conversationId: conversationId, // Include conversation ID so notification can link to messages
        },
      );
      
      console.log('[BOOKINGS SERVICE] ✅ Notification created successfully:', {
        id: notification.id,
        type: notification.type,
        userId: notification.userId,
        conversationId: conversationId,
      });
    } catch (error: any) {
      console.error('[BOOKINGS SERVICE] ❌ Failed to send notification:', error);
      console.error('[BOOKINGS SERVICE] Notification error details:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
      });
      // Don't fail the booking creation if notification fails
    }

    return savedBooking;
  }

  async findAll(userId?: string, propertyId?: string): Promise<Booking[]> {
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }
    if (propertyId) {
      where.propertyId = propertyId;
    }

    return this.bookingRepository.find({
      where,
      relations: ['property', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getCount(): Promise<number> {
    return this.bookingRepository.count();
  }

  async findRecent(limit: number = 5): Promise<Booking[]> {
    return this.bookingRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getProperty(propertyId: string) {
    return this.propertiesService.findOne(propertyId);
  }

  async verifyBookingNotification(ownerId: string, bookingId: string) {
    try {
      // Get all notifications for the property owner
      const allOwnerNotifications = await this.notificationsService.findByUserId(ownerId);
      
      // Filter for booking-related notifications
      // Note: TypeScript enum uses BOOKING_CREATED but database stores as 'booking_created'
      const bookingNotifications = allOwnerNotifications.notifications.filter((n: any) => {
        const isBookingType = n.type === 'BOOKING_CREATED' || n.type === 'booking_created';
        const matchesBookingId = n.data?.bookingId === bookingId;
        return isBookingType && matchesBookingId;
      });

      return {
        notificationFound: bookingNotifications.length > 0,
        notifications: bookingNotifications.map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          isRead: n.isRead,
          createdAt: n.createdAt,
          data: n.data,
        })),
        allOwnerNotificationsCount: allOwnerNotifications.total,
      };
    } catch (error: any) {
      console.error('[BOOKINGS SERVICE] Error verifying notification:', error);
      // Return a safe response instead of throwing
      return {
        notificationFound: false,
        notifications: [],
        allOwnerNotificationsCount: 0,
        error: error.message,
      };
    }
  }


  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['property', 'user'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateBookingStatusDto,
    userId: string,
  ): Promise<Booking> {
    const booking = await this.findOne(id);

    // Verify user is the property owner
    const property = await this.propertiesService.findOne(booking.propertyId);
    if (property.ownerId !== userId) {
      throw new BadRequestException('Only property owner can update booking status');
    }

    booking.status = updateStatusDto.status;
    if (updateStatusDto.notes) {
      booking.message = booking.message 
        ? `${booking.message}\n\n[Status Update]: ${updateStatusDto.notes}`
        : updateStatusDto.notes;
    }

    const updatedBooking = await this.bookingRepository.save(booking);

    // Send notification to user (only if they have an account)
    if (booking.userId) {
      try {
        const notificationType = updateStatusDto.status === BookingStatus.CONFIRMED
          ? NotificationType.BOOKING_CONFIRMED
          : updateStatusDto.status === BookingStatus.CANCELLED
          ? NotificationType.BOOKING_CANCELLED
          : NotificationType.BOOKING_STATUS_UPDATED;

        await this.notificationsService.create(
          booking.userId,
          notificationType,
          `Booking ${updateStatusDto.status}`,
          `Your ${booking.type} request for ${property.title} has been ${updateStatusDto.status}`,
          {
            bookingId: booking.id,
            propertyId: property.id,
            status: updateStatusDto.status,
          },
        );
      } catch (error) {
        console.error('[BOOKINGS] Failed to send notification:', error);
      }
    } else {
      // For guest bookings, we could send an email notification instead
      console.log('[BOOKINGS] Guest booking status updated - email notification should be sent to:', booking.email);
    }

    return updatedBooking;
  }

  async cancel(id: string, userId: string | null): Promise<Booking> {
    const booking = await this.findOne(id);

    // For guest bookings, verify by email instead of userId
    if (booking.userId) {
      // Authenticated user - verify ownership
      if (booking.userId !== userId) {
        throw new BadRequestException('You can only cancel your own bookings');
      }
    } else {
      // Guest booking - would need email verification in a real implementation
      // For now, we'll allow cancellation if userId is null (guest booking)
      if (userId) {
        throw new BadRequestException('This is a guest booking. Please contact support to cancel.');
      }
    }

    booking.status = BookingStatus.CANCELLED;
    return this.bookingRepository.save(booking);
  }
}
