"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Phone, Building2, Save, ArrowLeft, Camera, Upload } from "lucide-react";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { useAuth } from "@/hooks";
import { authService } from "@/services/auth.service";
import { useToastContext } from "@/components/ui/toast-provider";
import { APP_NAME } from "@/lib/constants";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, updateUser } = useAuth();
  const { success, error } = useToastContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      // Set avatar preview if user has one
      if (user.avatar) {
        setAvatarPreview(user.avatar);
      }
    }
  }, [user, reset]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        error("Please select an image file");
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        error("Image size must be less than 5MB");
        return;
      }
      
      setAvatarFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setIsSaving(true);
    try {
      let avatarUrl = user.avatar;

      // Upload avatar file if changed
      if (avatarFile) {
        try {
          const uploadResult = await authService.uploadAvatar(avatarFile);
          avatarUrl = uploadResult.avatar;
        } catch (uploadError: any) {
          console.error("Failed to upload avatar:", uploadError);
          error(uploadError.message || "Failed to upload profile picture. Please try again.");
          setIsSaving(false);
          return;
        }
      }
      
      const updateData = {
        ...data,
        avatar: avatarUrl,
      };
      
      const updatedUser = await authService.updateProfile(updateData);
      updateUser(updatedUser);
      
      // Clear the avatar file state after successful upload
      setAvatarFile(null);
      
      success("Your profile has been updated successfully.");
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      error(error.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              // If admin, go back to admin dashboard, otherwise go back
              if (user?.role === 'admin') {
                router.push('/admin');
              } else {
                router.back();
              }
            }}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {user?.role === 'admin' ? 'Back to Admin Dashboard' : 'Back'}
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account information and preferences
          </p>
        </div>

        <div className="grid gap-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Profile Picture Upload */}
                <div className="flex flex-col items-center space-y-4 pb-6 border-b">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-medium overflow-hidden">
                      {avatarPreview ? (
                        <img 
                          src={avatarPreview} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors shadow-lg"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Upload Profile Picture
                    </button>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG or GIF (max 5MB)
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    placeholder="John"
                    icon={<User className="h-4 w-4" />}
                    error={errors.firstName?.message}
                    {...register("firstName")}
                  />

                  <Input
                    label="Last Name"
                    placeholder="Doe"
                    icon={<User className="h-4 w-4" />}
                    error={errors.lastName?.message}
                    {...register("lastName")}
                  />
                </div>

                <Input
                  type="email"
                  label="Email"
                  placeholder="you@example.com"
                  icon={<Mail className="h-4 w-4" />}
                  error={errors.email?.message}
                  {...register("email")}
                  disabled
                />

                <Input
                  type="tel"
                  label="Phone Number"
                  placeholder="+256 700 000 000"
                  icon={<Phone className="h-4 w-4" />}
                  error={errors.phone?.message}
                  {...register("phone")}
                />

                <div className="pt-4">
                  <Button
                    type="submit"
                    size="lg"
                    isLoading={isSaving}
                    className="w-full md:w-auto"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                Your account details and role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    User ID
                  </label>
                  <p className="mt-1 text-sm text-slate-900 font-mono">
                    {user.id}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Role
                  </label>
                  <p className="mt-1 text-sm text-slate-900 capitalize">
                    {user.role}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Member Since
                  </label>
                  <p className="mt-1 text-sm text-slate-900">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


