"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Home, Search, Plus, User, Menu, X, MessageSquare, Bell, Building2, Wrench, LogIn, MapPin, Truck, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui";
import { useAuth } from "@/hooks";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

const mainNavLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/category/buy", label: "Buy", icon: Home },
  { href: "/category/rent", label: "Rent", icon: Building2 },
  { href: "/category/lease", label: "Lease", icon: MapPin },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/providers", label: "Service Providers", icon: Wrench },
];

const authNavLinks = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/listings/create", label: "List Property", icon: Plus },
  { href: "/messages", label: "Messages", icon: MessageSquare },
];

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }

    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [profileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary hidden sm:inline-block">
              {APP_NAME}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {mainNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  pathname === link.href && "bg-accent text-accent-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated &&
              authNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    pathname === link.href && "bg-accent text-accent-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  href="/notifications"
                  className="inline-flex items-center justify-center h-10 w-10 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <Bell className="h-5 w-5" />
                </Link>
                <Link
                  href="/messages"
                  className="inline-flex items-center justify-center h-10 w-10 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <MessageSquare className="h-5 w-5" />
                </Link>
                <div className="relative" ref={profileMenuRef}>
                  <button 
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    {/* Profile Picture Circle */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                      {user?.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.firstName || "User"} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                      )}
                    </div>
                    <span className="text-sm">{user?.firstName}</span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", profileMenuOpen && "rotate-180")} />
                  </button>
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 py-2 bg-background rounded-lg shadow-lg border z-50">
                      <Link
                        href="/profile"
                        onClick={() => setProfileMenuOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-accent"
                      >
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setProfileMenuOpen(false)}
                        className="block px-4 py-2 text-sm hover:bg-accent"
                      >
                        Settings
                      </Link>
                      <hr className="my-2" />
                      <button
                        onClick={() => {
                          logout();
                          setProfileMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-accent"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center h-10 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-2">
              {mainNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-accent",
                    pathname === link.href && "bg-accent"
                  )}
                >
                  <link.icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </Link>
              ))}
              {isAuthenticated &&
                authNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-accent",
                      pathname === link.href && "bg-accent"
                    )}
                  >
                    <link.icon className="h-5 w-5" />
                    <span>{link.label}</span>
                  </Link>
                ))}
              <hr className="my-2" />
              {isAuthenticated ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-accent"
                  >
                    {/* Profile Picture Circle */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-medium overflow-hidden flex-shrink-0">
                      {user?.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.firstName || "User"} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                      )}
                    </div>
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-accent w-full"
                  >
                    <LogIn className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium hover:bg-accent"
                  >
                    <LogIn className="h-5 w-5" />
                    <span>Login</span>
                  </Link>
                  <div className="px-4 py-2">
                    <Link
                      href="/auth/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center w-full h-10 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                    >
                      Get Started
                    </Link>
                  </div>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
