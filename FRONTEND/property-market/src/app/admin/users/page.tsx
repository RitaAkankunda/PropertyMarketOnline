"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Shield, UserCheck, UserX, Crown, AlertTriangle, Filter, Download } from "lucide-react";
import { Button, Card, Badge, Avatar } from "@/components/ui";
import { useAuthStore } from "@/store";
import { adminService } from "@/services/admin.service";
import { useToastContext } from "@/components/ui/toast-provider";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { success, error } = useToastContext();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [promotingUserId, setPromotingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>("all");

  useEffect(() => {
    // Wait for auth to load before checking
    if (authLoading) {
      return;
    }

    // Check if user is authenticated and is admin
    if (!isAuthenticated || !user) {
      router.push("/auth/login");
      return;
    }

    if (user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    loadUsers();
  }, [user, isAuthenticated, authLoading, router]);

  const loadUsers = async () => {
    try {
      const response = await adminService.getAllUsers();
      setUsers(response);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  const promoteToAdmin = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to promote ${email} to admin?`)) {
      return;
    }

    setPromotingUserId(userId);
    try {
      await adminService.updateUserRole(userId, 'admin');
      await loadUsers(); // Reload the list
      success(`Successfully promoted ${email} to admin!`, 4000);
    } catch (err) {
      console.error("Failed to promote user:", err);
      error("Failed to promote user. Please try again.", 5000);
    } finally {
      setPromotingUserId(null);
    }
  };

  const deleteUser = async (userId: string, email: string, firstName: string, lastName: string) => {
    setUserToDelete({ id: userId, email, firstName, lastName } as User);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setDeletingUserId(userToDelete.id);
    setShowDeleteConfirm(false);

    try {
      await adminService.deleteUser(userToDelete.id);
      await loadUsers(); // Reload the list
      success(`Successfully deleted user ${userToDelete.firstName} ${userToDelete.lastName}`, 4000);
      setUserToDelete(null);
    } catch (err) {
      console.error("Failed to delete user:", err);
      error("Failed to delete user. Please try again.", 5000);
    } finally {
      setDeletingUserId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'property_manager': return 'bg-purple-100 text-purple-800';
      case 'lister': return 'bg-blue-100 text-blue-800';
      case 'buyer': return 'bg-green-100 text-green-800';
      case 'renter': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter((userItem) => {
    return roleFilter === "all" || userItem.role === roleFilter;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {authLoading ? "Checking authentication..." : "Loading users..."}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Users className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              </div>
              <p className="text-gray-600">
                Manage user accounts and permissions
              </p>
            </div>
            <div className="flex items-center space-x-4 flex-wrap">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admins</option>
                  <option value="property_manager">Property Managers</option>
                  <option value="lister">Listers</option>
                  <option value="buyer">Buyers</option>
                  <option value="renter">Renters</option>
                </select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Export to CSV functionality
                  const csv = [
                    ['Name', 'Email', 'Role', 'Joined'],
                    ...filteredUsers.map(u => [
                      `"${u.firstName} ${u.lastName}"`,
                      `"${u.email}"`,
                      `"${u.role}"`,
                      `"${new Date(u.createdAt).toLocaleDateString()}"`
                    ])
                  ].map(row => row.join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <div className="text-sm text-gray-500">
                {filteredUsers.length} of {users.length} users
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {filteredUsers.map((userItem) => (
            <Card key={userItem.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar
                    name={`${userItem.firstName} ${userItem.lastName}`}
                    size="lg"
                    className="h-12 w-12"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {userItem.firstName} {userItem.lastName}
                    </h3>
                    <p className="text-gray-600">{userItem.email}</p>
                    <p className="text-sm text-gray-500">
                      Joined {new Date(userItem.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Badge className={getRoleBadgeColor(userItem.role)}>
                    {userItem.role === 'admin' && <Crown className="h-3 w-3 mr-1" />}
                    {userItem.role.replace('_', ' ').toUpperCase()}
                  </Badge>

                  <div className="flex space-x-2">
                    {userItem.role !== 'admin' && (
                      <Button
                        onClick={() => promoteToAdmin(userItem.id, userItem.email)}
                        disabled={promotingUserId === userItem.id}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {promotingUserId === userItem.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            Promote
                          </>
                        )}
                      </Button>
                    )}

                    {/* Don't allow deleting current user or other admins */}
                    {userItem.id !== user?.id && userItem.role !== 'admin' && (
                      <Button
                        onClick={() => deleteUser(userItem.id, userItem.email, userItem.firstName, userItem.lastName)}
                        disabled={deletingUserId === userItem.id}
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        {deletingUserId === userItem.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <>
                            <UserX className="h-4 w-4 mr-2" />
                            Delete
                          </>
                        )}
                      </Button>
                    )}

                    {userItem.role === 'admin' && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">Users will appear here once they register.</p>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && userToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-2">
                  Are you sure you want to delete this user? This action cannot be undone.
                </p>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="font-medium text-gray-900">
                    {userToDelete.firstName} {userToDelete.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{userToDelete.email}</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={cancelDelete}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeleteUser}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Delete User
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}