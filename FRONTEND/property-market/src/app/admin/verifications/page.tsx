"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  XCircle,
  CheckCircle,
  Eye,
  FileText,
  User,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  Clock,
  Download,
  Shield,
} from "lucide-react";
import { Button, Card, Badge, Avatar, Input } from "@/components/ui";
import { useAuthStore } from "@/store";
import { useRouter } from "next/navigation";
import { providerService } from "@/services";
import { useToastContext } from "@/components/ui/toast-provider";
import type { ServiceProvider } from "@/types";

interface VerificationRequest {
  id: string;
  provider: ServiceProvider;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  documents: {
    idDocument?: string;
    businessLicense?: string;
    certifications?: string[];
  };
  notes?: string;
}

export default function VerificationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { success, error: showError } = useToastContext();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

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

    fetchVerifications();
  }, [user, isAuthenticated, authLoading, router, filter]);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      // Fetch actual verification requests from backend
      const status = filter === "all" ? undefined : filter;
      const verificationRequestsData = await providerService.getVerificationRequests(status);
      
      // Convert backend data to frontend format
      const verificationRequests: VerificationRequest[] = verificationRequestsData.map((req: any) => ({
        id: req.id,
        provider: req.provider,
        status: req.status,
        submittedAt: req.submittedAt,
        documents: {
          idDocument: req.idDocumentUrl,
          businessLicense: req.businessLicenseUrl,
          certifications: req.additionalDocuments?.map((doc: any) => doc.url) || [],
        },
        notes: req.rejectionReason,
      }));

      setRequests(verificationRequests);
    } catch (error) {
      console.error("Failed to fetch verifications:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      // Call API to approve verification request
      await providerService.reviewVerificationRequest(requestId, "approved");
      
      // Refresh the list
      await fetchVerifications();
      
      // Clear selection
      setSelectedRequest(null);
      
      success("Verification request approved successfully! The provider has been notified via email.", 5000);
    } catch (error) {
      console.error("Failed to approve verification:", error);
      showError("Failed to approve verification. Please try again.", 5000);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      showError("Please provide a reason for rejection", 4000);
      return;
    }

    try {
      // Call API to reject verification request
      await providerService.reviewVerificationRequest(requestId, "rejected", rejectionReason);
      
      // Refresh the list
      await fetchVerifications();
      
      // Clear selection and reason
      setSelectedRequest(null);
      setRejectionReason("");
      
      success("Verification request rejected. The provider has been notified with the reason.", 5000);
    } catch (error) {
      console.error("Failed to reject verification:", error);
      showError("Failed to reject verification. Please try again.", 5000);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {authLoading ? "Checking authentication..." : "Loading verifications..."}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== "admin") {
    return null;
  }

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Admin Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BadgeCheck className="w-6 h-6 text-primary" />
                Provider Verifications
              </h1>
              <p className="text-muted-foreground">
                Review and approve provider verification requests
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex gap-2">
            {[
              { value: "all", label: "All" },
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value as any)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filter === tab.value
                    ? "bg-primary text-white"
                    : "bg-white text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Requests List */}
          <div>
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Verification Requests ({requests.length})
                </h2>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading...
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No verification requests found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div
                        key={request.id}
                        onClick={() => setSelectedRequest(request)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedRequest?.id === request.id
                            ? "border-primary bg-primary/5"
                            : "hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar
                              src={request.provider.user.avatar}
                              alt={request.provider.businessName}
                              name={request.provider.businessName}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold truncate">
                                {request.provider.businessName}
                              </h3>
                              <Badge
                                variant={
                                  request.status === "pending"
                                    ? "secondary"
                                    : request.status === "approved"
                                    ? "default"
                                    : "destructive"
                                }
                                className="text-xs ml-2"
                              >
                                {request.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {request.provider.user.firstName} {request.provider.user.lastName}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {getTimeAgo(request.submittedAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {request.provider.location.city}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Request Details */}
          <div>
            {selectedRequest ? (
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">
                    Verification Details
                  </h2>
                  
                  <div className="space-y-6">
                    {/* Provider Info */}
                    <div>
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Provider Information
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-32">Business:</span>
                          <span className="font-medium">{selectedRequest.provider.businessName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-32">Owner:</span>
                          <span>
                            {selectedRequest.provider.user.firstName}{" "}
                            {selectedRequest.provider.user.lastName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-32">Email:</span>
                          <span>{selectedRequest.provider.user.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-32">Phone:</span>
                          <span>{selectedRequest.provider.user.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-32">Location:</span>
                          <span>
                            {selectedRequest.provider.location.city}
                            {selectedRequest.provider.location.district &&
                              `, ${selectedRequest.provider.location.district}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-32">Services:</span>
                          <span>{selectedRequest.provider.serviceTypes.join(", ")}</span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h3 className="font-medium mb-2">Business Description</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedRequest.provider.description}
                      </p>
                    </div>

                    {/* Documents */}
                    <div>
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Submitted Documents
                      </h3>
                      <div className="space-y-2">
                        {selectedRequest.documents.idDocument && (
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm font-medium">ID Document</span>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => window.open(selectedRequest.documents.idDocument, '_blank')}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </div>
                        )}
                        {selectedRequest.documents.certifications && selectedRequest.documents.certifications.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-sm font-medium block mb-2">Certifications ({selectedRequest.documents.certifications.length})</span>
                            {selectedRequest.documents.certifications.map((certUrl, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <span className="text-sm">Certification {index + 1}</span>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => window.open(certUrl, '_blank')}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        {selectedRequest.provider.certifications && selectedRequest.provider.certifications.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-sm font-medium block mb-2">Certifications ({selectedRequest.provider.certifications.length})</span>
                            {selectedRequest.provider.certifications.map((cert: any, index: number) => (
                              <div key={cert.id || index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div className="flex-1">
                                  <span className="text-sm font-medium block">{cert.name}</span>
                                  <span className="text-xs text-muted-foreground">Issued by: {cert.issuer}</span>
                                </div>
                                {cert.documentUrl && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => window.open(cert.documentUrl, '_blank')}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {!selectedRequest.documents.idDocument &&
                          (!selectedRequest.documents.certifications || selectedRequest.documents.certifications.length === 0) &&
                          (!selectedRequest.provider.certifications || selectedRequest.provider.certifications.length === 0) && (
                          <p className="text-sm text-muted-foreground">
                            No documents uploaded
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {selectedRequest.status === "pending" && (
                      <div className="space-y-3 pt-4 border-t">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Rejection Reason (if rejecting)
                          </label>
                          <textarea
                            className="w-full px-3 py-2 border rounded-md text-sm"
                            rows={3}
                            placeholder="Provide reason for rejection..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button
                            className="flex-1"
                            onClick={() => handleApprove(selectedRequest.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleReject(selectedRequest.id)}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}

                    {selectedRequest.status !== "pending" && (
                      <div className={`p-4 rounded-lg ${
                        selectedRequest.status === "approved"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}>
                        <div className="flex items-center gap-2 font-medium">
                          {selectedRequest.status === "approved" ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <XCircle className="w-5 h-5" />
                          )}
                          <span>
                            This verification has been {selectedRequest.status}
                          </span>
                        </div>
                        {selectedRequest.notes && (
                          <p className="text-sm mt-2">{selectedRequest.notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="p-6 text-center">
                  <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Select a Request</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a verification request from the list to view details
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
