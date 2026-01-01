"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, AlertTriangle } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useAuthStore } from "@/store";

export default function AdminReportsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();

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

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <FileText className="w-8 h-8 text-primary" />
                Reports & Flagged Content
              </h1>
              <p className="text-muted-foreground mt-2">
                Review and manage reported content
              </p>
            </div>
            <Link href="/admin">
              <Button variant="outline">Back to Admin Dashboard</Button>
            </Link>
          </div>
        </div>

        <Card className="p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Reports System Coming Soon</h3>
          <p className="text-muted-foreground mb-6">
            The reporting and content moderation system will be available here.
            Users will be able to report inappropriate content, and admins will
            be able to review and take action.
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Property listing reports</p>
            <p>• User behavior reports</p>
            <p>• Content moderation tools</p>
            <p>• Automated flagging system</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

