import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('favorites')
@UseGuards(AuthGuard('jwt'))
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  async addToFavorites(
    @Request() req: any,
    @Body() createFavoriteDto: CreateFavoriteDto,
  ) {
    try {
      const userId = req.user?.id || req.user?.sub;
      if (!userId) {
        throw new Error('User ID not found in request');
      }
      return await this.favoritesService.addToFavorites(userId, createFavoriteDto);
    } catch (error) {
      console.error('[FAVORITES CONTROLLER] Error in addToFavorites:', {
        error: error.message,
        stack: error.stack,
        user: req.user,
        body: createFavoriteDto,
      });
      throw error;
    }
  }

  @Delete(':propertyId')
  async removeFromFavorites(
    @Request() req: any,
    @Param('propertyId') propertyId: string,
  ) {
    const userId = req.user.id || req.user.sub;
    await this.favoritesService.removeFromFavorites(userId, propertyId);
    return { message: 'Removed from favorites' };
  }

  @Get()
  async getUserFavorites(@Request() req: any) {
    const userId = req.user.id || req.user.sub;
    return await this.favoritesService.getUserFavorites(userId);
  }

  @Get('check/:propertyId')
  async checkIfFavorite(
    @Request() req: any,
    @Param('propertyId') propertyId: string,
  ) {
    const userId = req.user.id || req.user.sub;
    const isFavorite = await this.favoritesService.checkIfFavorite(userId, propertyId);
    return { isFavorite };
  }
}
