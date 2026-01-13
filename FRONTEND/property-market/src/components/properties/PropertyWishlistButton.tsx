"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { favoritesService } from "@/services/favorites.service";
import type { Property } from "@/types";

interface PropertyWishlistButtonProps {
  property: Property;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function PropertyWishlistButton({
  property,
  className,
  size = "md",
}: PropertyWishlistButtonProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Check if property is favorited when component mounts or property changes
  useEffect(() => {
    if (isAuthenticated && property.id) {
      checkFavoriteStatus();
    }
  }, [isAuthenticated, property.id]);

  const checkFavoriteStatus = async () => {
    try {
      const isFavorite = await favoritesService.checkIfFavorite(property.id);
      setIsInWishlist(isFavorite);
    } catch (error) {
      // Silently fail - user might not be authenticated or API might be unavailable
      setIsInWishlist(false);
    }
  };

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only allow wishlist for authenticated users
    if (!isAuthenticated) {
      // Show toast notification (if you have a toast system)
      // For now, we'll use a brief console message and smooth redirect
      if (typeof window !== "undefined") {
        // Dispatch custom event for toast notification
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: {
              type: "info",
              message: "Login to save favorites across all your devices",
              duration: 3000,
            },
          })
        );

        // Smooth redirect using Next.js router
        const currentPath = window.location.pathname;
        setTimeout(() => {
          router.push(
            `/auth/login?redirect=${encodeURIComponent(currentPath)}&message=${encodeURIComponent("Please login to save properties to your wishlist")}`
          );
        }, 500); // Small delay to show toast first
      }
      return;
    }

    setIsLoading(true);
    try {
      if (isInWishlist) {
        await favoritesService.removeFromFavorites(property.id);
        setIsInWishlist(false);
        
        // Show success message
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("show-toast", {
              detail: {
                type: "success",
                message: "Removed from favorites",
                duration: 3000,
              },
            })
          );
        }
      } else {
        await favoritesService.addToFavorites(property.id);
        setIsInWishlist(true);
        
        // Show success message with option to view saved page
        if (typeof window !== "undefined") {
          // Option 1: Show toast with "View Saved" link (recommended)
          window.dispatchEvent(
            new CustomEvent("show-toast", {
              detail: {
                type: "success",
                message: "Added to favorites!",
                action: {
                  label: "View Saved",
                  onClick: () => router.push("/dashboard/saved"),
                },
                duration: 4000,
              },
            })
          );
          
          // Option 2: Auto-navigate to saved page (uncomment if preferred)
          // setTimeout(() => {
          //   router.push("/dashboard/saved");
          // }, 1000);
        }
      }

      // Trigger a custom event for other components
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("wishlist-updated", {
            detail: { propertyId: property.id, added: !isInWishlist },
          })
        );
      }
    } catch (error: any) {
      console.error("Failed to toggle favorite:", error);
      
      // Show error message
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: {
              type: "error",
              message: error.response?.data?.message || "Failed to update favorites. Please try again.",
              duration: 5000,
            },
          })
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleWishlist}
        type="button"
        onMouseEnter={() => !isAuthenticated && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={cn(
          "rounded-full bg-white/90 hover:bg-white shadow-lg transition-all cursor-pointer",
          isInWishlist && "bg-red-50 hover:bg-red-100",
          !isAuthenticated && "opacity-75 hover:opacity-100",
          sizeClasses[size],
          className
        )}
        aria-label={
          !isAuthenticated 
            ? "Login to add to wishlist" 
            : isInWishlist 
              ? "Remove from wishlist" 
              : "Add to wishlist"
        }
        title={
          !isAuthenticated 
            ? "Login to save favorites across all devices" 
            : isInWishlist 
              ? "Remove from wishlist" 
              : "Add to wishlist"
        }
      >
      <Heart
        className={cn(
          "transition-all",
          isInWishlist
            ? "fill-red-500 text-red-500"
            : "fill-white text-slate-700 hover:fill-red-300",
          isLoading && "opacity-50",
          size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-6 h-6"
        )}
      />
      </Button>

      {/* Enhanced Tooltip for unauthenticated users */}
      {!isAuthenticated && showTooltip && (
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2">
            <Heart className="w-3 h-3" />
            <span>Login to save across all devices</span>
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full right-4 -mt-1 w-2 h-2 bg-slate-900 rotate-45"></div>
        </div>
      )}
    </div>
  );
}

// Hook to get wishlist from backend
export function useWishlist() {
  const { isAuthenticated } = useAuthStore();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWishlist = async () => {
      if (!isAuthenticated) {
        setWishlist([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const favorites = await favoritesService.getFavorites();
        const propertyIds = favorites.map((fav) => fav.propertyId);
        setWishlist(propertyIds);
      } catch (error) {
        console.error("Failed to load wishlist:", error);
        setWishlist([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadWishlist();

    // Listen for wishlist updates
    const handleUpdate = () => loadWishlist();
    window.addEventListener("wishlist-updated", handleUpdate);
    return () => window.removeEventListener("wishlist-updated", handleUpdate);
  }, [isAuthenticated]);

  return { wishlist, isLoading };
}
