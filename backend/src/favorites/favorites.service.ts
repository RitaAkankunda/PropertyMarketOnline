import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { Property } from '../properties/entities/property.entity';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favoriteRepository: Repository<Favorite>,
    @InjectRepository(Property)
    private propertyRepository: Repository<Property>,
  ) {}

  async addToFavorites(userId: string, createFavoriteDto: CreateFavoriteDto): Promise<Favorite> {
    try {
      console.log('[FAVORITES] Adding favorite:', { userId, propertyId: createFavoriteDto.propertyId });

      // Check if property exists
      const property = await this.propertyRepository.findOne({
        where: { id: createFavoriteDto.propertyId },
      });

      if (!property) {
        console.error('[FAVORITES] Property not found:', createFavoriteDto.propertyId);
        throw new NotFoundException('Property not found');
      }

      // Check if already favorited
      const existing = await this.favoriteRepository.findOne({
        where: {
          userId,
          propertyId: createFavoriteDto.propertyId,
        },
      });

      if (existing) {
        console.log('[FAVORITES] Already favorited:', { userId, propertyId: createFavoriteDto.propertyId });
        throw new ConflictException('Property is already in your favorites');
      }

      // Create favorite
      const favorite = this.favoriteRepository.create({
        userId,
        propertyId: createFavoriteDto.propertyId,
      });

      const savedFavorite = await this.favoriteRepository.save(favorite);
      console.log('[FAVORITES] Favorite saved successfully:', savedFavorite.id);
      return savedFavorite;
    } catch (error) {
      console.error('[FAVORITES] Error adding favorite:', {
        error: error.message,
        stack: error.stack,
        userId,
        propertyId: createFavoriteDto.propertyId,
      });
      throw error;
    }
  }

  async removeFromFavorites(userId: string, propertyId: string): Promise<void> {
    const favorite = await this.favoriteRepository.findOne({
      where: { userId, propertyId },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.favoriteRepository.remove(favorite);
  }

  async getUserFavorites(userId: string): Promise<Favorite[]> {
    return await this.favoriteRepository.find({
      where: { userId },
      relations: ['property', 'property.owner'],
      order: { createdAt: 'DESC' },
    });
  }

  async checkIfFavorite(userId: string, propertyId: string): Promise<boolean> {
    const favorite = await this.favoriteRepository.findOne({
      where: { userId, propertyId },
    });
    return !!favorite;
  }

  async getFavoriteCount(propertyId: string): Promise<number> {
    return await this.favoriteRepository.count({
      where: { propertyId },
    });
  }
}
