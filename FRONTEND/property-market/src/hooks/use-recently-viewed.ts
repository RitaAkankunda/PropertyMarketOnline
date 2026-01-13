"use client";

import { useState, useEffect, useCallback } from "react";
import { propertyService } from "@/services";
import type { Property } from "@/types";

const RECENTLY_VIEWED_KEY = "propertymarket_recently_viewed";
const MAX_RECENTLY_VIEWED = 20; // Keep last 20 viewed properties

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load recently viewed from localStorage
  useEffect(() => {
    loadRecentlyViewed();
  }, []);

  const loadRecentlyViewed = useCallback(async () => {
    try {
      setIsLoading(true);
      const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
      if (!stored) {
        setRecentlyViewed([]);
        return;
      }

      const propertyIds: string[] = JSON.parse(stored);
      if (propertyIds.length === 0) {
        setRecentlyViewed([]);
        return;
      }

      // Fetch full property details for each ID
      const properties = await Promise.all(
        propertyIds.map(async (id) => {
          try {
            return await propertyService.getProperty(id);
          } catch (error) {
            console.error(`Failed to fetch property ${id}:`, error);
            return null;
          }
        })
      );

      // Filter out nulls (properties that no longer exist)
      const validProperties = properties.filter((p): p is Property => p !== null);
      setRecentlyViewed(validProperties);
    } catch (error) {
      console.error("Failed to load recently viewed:", error);
      setRecentlyViewed([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addToRecentlyViewed = useCallback((property: Property) => {
    try {
      const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
      let propertyIds: string[] = stored ? JSON.parse(stored) : [];

      // Remove if already exists (to move to front)
      propertyIds = propertyIds.filter((id) => id !== property.id);

      // Add to beginning
      propertyIds.unshift(property.id);

      // Keep only the most recent ones
      propertyIds = propertyIds.slice(0, MAX_RECENTLY_VIEWED);

      // Save back to localStorage
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(propertyIds));

      // Update state
      setRecentlyViewed((prev) => {
        const filtered = prev.filter((p) => p.id !== property.id);
        return [property, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
      });
    } catch (error) {
      console.error("Failed to save recently viewed:", error);
    }
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
    setRecentlyViewed([]);
  }, []);

  return {
    recentlyViewed,
    isLoading,
    addToRecentlyViewed,
    clearRecentlyViewed,
    refresh: loadRecentlyViewed,
  };
}
