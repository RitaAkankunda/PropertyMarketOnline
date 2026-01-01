"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, Save } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { useAuthStore } from "@/store";

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !user) {
      router.push("/auth/login");
      return;
    }

    if (user.role !== "admin") {
      router.push("/dashboard");
      return;
    }
  }, [user, isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== "admin") {
    return null;
  }

  const handleSave = async () => {
    setSaving(true);
    // TODO: Implement settings save
    setTimeout(() => {
      setSaving(false);
      alert("Settings saved successfully!");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Settings className="w-8 h-8 text-primary" />
                Platform Settings
              </h1>
              <p className="text-muted-foreground mt-2">
                Configure platform-wide settings
              </p>
            </div>
            <Link href="/admin">
              <Button variant="outline">Back to Admin Dashboard</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6">
          {/* General Settings */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">General Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Platform Name
                </label>
                <Input defaultValue="PropertyMarket" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Support Email
                </label>
                <Input type="email" defaultValue="support@propertymarket.com" />
              </div>
            </div>
          </Card>

          {/* Feature Flags */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Feature Flags</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Enable email notifications for users
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Enable SMS notifications (coming soon)
                  </p>
                </div>
                <input type="checkbox" disabled className="w-4 h-4" />
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

