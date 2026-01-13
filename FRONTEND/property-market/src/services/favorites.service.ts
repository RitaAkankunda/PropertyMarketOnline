import api from './api';

export interface Favorite {
  id: string;
  userId: string;
  propertyId: string;
  createdAt: string;
  property?: any;
}

export const favoritesService = {
  // Add property to favorites
  async addToFavorites(propertyId: string): Promise<Favorite> {
    const response = await api.post<Favorite>('/favorites', { propertyId });
    return response.data;
  },

  // Remove property from favorites
  async removeFromFavorites(propertyId: string): Promise<void> {
    await api.delete(`/favorites/${propertyId}`);
  },

  // Get user's favorites
  async getFavorites(): Promise<Favorite[]> {
    const response = await api.get<Favorite[]>('/favorites');
    return response.data;
  },

  // Check if property is favorited
  async checkIfFavorite(propertyId: string): Promise<boolean> {
    try {
      const response = await api.get<{ isFavorite: boolean }>(`/favorites/check/${propertyId}`);
      return response.data.isFavorite;
    } catch (error) {
      return false;
    }
  },
};
