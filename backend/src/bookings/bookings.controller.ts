import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async create(@Body() createBookingDto: CreateBookingDto, @Request() req) {
    try {
      console.log('[BOOKINGS CONTROLLER] ====== CREATE BOOKING REQUEST ======');
      console.log('[BOOKINGS CONTROLLER] Request body:', JSON.stringify(createBookingDto, null, 2));
      console.log('[BOOKINGS CONTROLLER] User info:', {
        hasUser: !!req.user,
        userId: req.user?.sub || req.user?.id || null,
        userKeys: req.user ? Object.keys(req.user) : [],
      });

      // Authentication is optional - if user is logged in, use their ID, otherwise null
      const userId = req.user?.sub || req.user?.id || null;
      const result = await this.bookingsService.create(createBookingDto, userId);
      
      console.log('[BOOKINGS CONTROLLER] ✅ Booking created successfully:', {
        id: result.id,
        propertyId: result.propertyId,
        type: result.type,
        status: result.status,
        name: result.name,
        email: result.email,
        userId: result.userId || 'null (guest)',
        createdAt: result.createdAt,
      });
      
      return result;
    } catch (error: any) {
      console.error('[BOOKINGS CONTROLLER] ====== ERROR CREATING BOOKING ======');
      console.error('[BOOKINGS CONTROLLER] Error type:', error?.constructor?.name);
      console.error('[BOOKINGS CONTROLLER] Error message:', error?.message);
      console.error('[BOOKINGS CONTROLLER] Error code:', error?.code);
      console.error('[BOOKINGS CONTROLLER] Error status:', error?.status);
      console.error('[BOOKINGS CONTROLLER] Error response:', error?.response);
      console.error('[BOOKINGS CONTROLLER] Error stack:', error?.stack);
      console.error('[BOOKINGS CONTROLLER] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      
      // Re-throw to let the exception filter handle it
      throw error;
    }
  }

  @Get('verify')
  async verifyBookings() {
    // Simple endpoint to verify bookings exist (for testing)
    const count = await this.bookingsService.getCount();
    const recent = await this.bookingsService.findRecent(5);
    return {
      total: count,
      recent: recent.map(b => ({
        id: b.id,
        propertyId: b.propertyId,
        userId: b.userId || null,
        type: b.type,
        status: b.status,
        name: b.name,
        email: b.email,
        phone: b.phone,
        scheduledDate: b.scheduledDate,
        scheduledTime: b.scheduledTime,
        message: b.message,
        createdAt: b.createdAt,
        isGuest: !b.userId,
      })),
    };
  }

  @Get('verify-notifications')
  async verifyBookingNotifications() {
    // Verify that notifications were created for recent bookings
    const recent = await this.bookingsService.findRecent(1);
    if (recent.length === 0) {
      return { message: 'No bookings found' };
    }

    const booking = recent[0];
    const property = await this.bookingsService.getProperty(booking.propertyId);
    
    if (!property) {
      return { error: 'Property not found', bookingId: booking.id };
    }

    // Use the service method to get notifications
    const result = await this.bookingsService.verifyBookingNotification(
      property.ownerId,
      booking.id,
    );

    return {
      booking: {
        id: booking.id,
        propertyId: booking.propertyId,
        type: booking.type,
        name: booking.name,
        createdAt: booking.createdAt,
      },
      property: {
        id: property.id,
        title: property.title,
        ownerId: property.ownerId,
      },
      ...result,
    };
  }

  @Get()
  async findAll(
    @Query('propertyId') propertyId?: string,
    @Request() req?: any,
  ) {
    // Allow unauthenticated access to check bookings (for property owners)
    const userId = req?.user?.sub || req?.user?.id;
    const bookings = await this.bookingsService.findAll(userId, propertyId);
    console.log('[BOOKINGS CONTROLLER] Found bookings:', {
      count: bookings.length,
      propertyId,
      userId: userId || 'null',
    });
    return bookings;
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  async findMyBookings(@Request() req) {
    const userId = req.user.sub || req.user.id;
    return this.bookingsService.findAll(userId);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'))
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateBookingStatusDto,
    @Request() req,
  ) {
    const userId = req.user.sub || req.user.id;
    return this.bookingsService.updateStatus(id, updateStatusDto, userId);
  }

  @Patch(':id/cancel')
  async cancel(@Param('id') id: string, @Request() req) {
    // Allow cancellation for both authenticated and guest bookings
    const userId = req.user?.sub || req.user?.id || null;
    return this.bookingsService.cancel(id, userId);
  }
}
