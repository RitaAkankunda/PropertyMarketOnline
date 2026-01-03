"use client";

import { useState } from "react";
import {
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Star,
  MessageCircle,
  Bell,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  MapPin,
  Phone,
  User,
  Send,
  Smartphone,
  ChevronRight,
  X,
} from "lucide-react";

// =============================================
// TYPES
// =============================================
type JobStatus = "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
type TabType = "jobs" | "earnings" | "messages" | "ratings" | "withdraw";

interface Job {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceType: string;
  description: string;
  location: string;
  scheduledDate: string;
  scheduledTime: string;
  status: JobStatus;
  amount: number;
  createdAt: string;
  images?: string[];
}

interface Message {
  id: string;
  clientName: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  jobId: string;
}

interface Transaction {
  id: string;
  type: "earning" | "withdrawal" | "commission";
  amount: number;
  description: string;
  date: string;
  status: "completed" | "pending" | "failed";
}

// =============================================
// DUMMY DATA
// =============================================
const DUMMY_JOBS: Job[] = [
  {
    id: "JOB001",
    clientName: "Sarah Nambi",
    clientPhone: "+256 772 123 456",
    serviceType: "Electrical Installation",
    description: "Need to install new electrical outlets in 3 rooms and fix the main circuit breaker.",
    location: "Kampala, Nakawa",
    scheduledDate: "2026-01-05",
    scheduledTime: "Morning (8AM - 12PM)",
    status: "pending",
    amount: 350000,
    createdAt: "2026-01-03T10:30:00",
  },
  {
    id: "JOB002",
    clientName: "Peter Okello",
    clientPhone: "+256 701 234 567",
    serviceType: "Wiring Repair",
    description: "Faulty wiring in kitchen causing power trips. Urgent fix needed.",
    location: "Kampala, Makindye",
    scheduledDate: "2026-01-04",
    scheduledTime: "Afternoon (12PM - 4PM)",
    status: "accepted",
    amount: 180000,
    createdAt: "2026-01-02T14:00:00",
  },
  {
    id: "JOB003",
    clientName: "Grace Achieng",
    clientPhone: "+256 782 345 678",
    serviceType: "Solar Panel Installation",
    description: "Install 4 solar panels on rooftop with battery backup system.",
    location: "Entebbe",
    scheduledDate: "2026-01-06",
    scheduledTime: "Morning (8AM - 12PM)",
    status: "in_progress",
    amount: 2500000,
    createdAt: "2026-01-01T09:00:00",
  },
  {
    id: "JOB004",
    clientName: "John Mukasa",
    clientPhone: "+256 755 456 789",
    serviceType: "Inspection",
    description: "Full electrical inspection for property sale certification.",
    location: "Wakiso",
    scheduledDate: "2026-01-02",
    scheduledTime: "Morning (8AM - 12PM)",
    status: "completed",
    amount: 250000,
    createdAt: "2025-12-30T11:00:00",
  },
  {
    id: "JOB005",
    clientName: "Mary Nalwoga",
    clientPhone: "+256 776 567 890",
    serviceType: "Emergency Repair",
    description: "Power outage in entire house after storm.",
    location: "Kampala, Rubaga",
    scheduledDate: "2026-01-01",
    scheduledTime: "Evening (4PM - 7PM)",
    status: "completed",
    amount: 200000,
    createdAt: "2025-12-31T16:00:00",
  },
];

const DUMMY_MESSAGES: Message[] = [
  { id: "MSG001", clientName: "Sarah Nambi", lastMessage: "When can you arrive?", timestamp: "10 min ago", unread: true, jobId: "JOB001" },
  { id: "MSG002", clientName: "Peter Okello", lastMessage: "Thanks, see you tomorrow!", timestamp: "2 hours ago", unread: false, jobId: "JOB002" },
  { id: "MSG003", clientName: "Grace Achieng", lastMessage: "Please bring extra cables", timestamp: "Yesterday", unread: true, jobId: "JOB003" },
  { id: "MSG004", clientName: "John Mukasa", lastMessage: "Great work, thank you!", timestamp: "2 days ago", unread: false, jobId: "JOB004" },
];

const DUMMY_TRANSACTIONS: Transaction[] = [
  { id: "TXN001", type: "earning", amount: 250000, description: "Job #JOB004 - Inspection", date: "2026-01-02", status: "completed" },
  { id: "TXN002", type: "earning", amount: 200000, description: "Job #JOB005 - Emergency Repair", date: "2026-01-01", status: "completed" },
  { id: "TXN003", type: "commission", amount: -22500, description: "Platform fee (5%)", date: "2026-01-02", status: "completed" },
  { id: "TXN004", type: "withdrawal", amount: -400000, description: "MTN Mobile Money", date: "2025-12-30", status: "completed" },
  { id: "TXN005", type: "earning", amount: 180000, description: "Job #JOB006 - Maintenance", date: "2025-12-28", status: "completed" },
];

const DUMMY_RATINGS = [
  { id: 1, clientName: "John Mukasa", rating: 5, comment: "Excellent work! Very professional and arrived on time.", date: "2026-01-02", jobType: "Inspection" },
  { id: 2, clientName: "Mary Nalwoga", rating: 5, comment: "Fixed our power issue quickly. Highly recommend!", date: "2026-01-01", jobType: "Emergency Repair" },
  { id: 3, clientName: "David Ssempijja", rating: 4, comment: "Good service, but was slightly late.", date: "2025-12-28", jobType: "Installation" },
  { id: 4, clientName: "Christine Auma", rating: 5, comment: "Very knowledgeable and explained everything clearly.", date: "2025-12-25", jobType: "Wiring" },
];

// =============================================
// STATUS BADGE COMPONENT
// =============================================
function StatusBadge({ status }: { status: JobStatus }) {
  const config = {
    pending: { color: "bg-yellow-100 text-yellow-700", label: "Pending" },
    accepted: { color: "bg-blue-100 text-blue-700", label: "Accepted" },
    in_progress: { color: "bg-purple-100 text-purple-700", label: "In Progress" },
    completed: { color: "bg-green-100 text-green-700", label: "Completed" },
    cancelled: { color: "bg-red-100 text-red-700", label: "Cancelled" },
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config[status].color}`}>
      {config[status].label}
    </span>
  );
}

// =============================================
// JOB DETAIL MODAL
// =============================================
function JobDetailModal({ 
  job, 
  onClose,
  onUpdateStatus 
}: { 
  job: Job; 
  onClose: () => void;
  onUpdateStatus: (jobId: string, status: JobStatus) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-orange-500 text-white p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-orange-100">Job #{job.id}</p>
            <h2 className="font-bold text-lg">{job.serviceType}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Status</span>
            <StatusBadge status={job.status} />
          </div>

          {/* Client Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Client Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span>{job.clientName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{job.clientPhone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{job.location}</span>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Schedule</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{new Date(job.scheduledDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{job.scheduledTime}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Job Description</h3>
            <p className="text-sm text-gray-600">{job.description}</p>
          </div>

          {/* Amount */}
          <div className="bg-orange-50 rounded-lg p-4 flex items-center justify-between">
            <span className="text-gray-700">Amount</span>
            <span className="text-xl font-bold text-orange-600">UGX {job.amount.toLocaleString()}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t p-4 space-y-2">
          {job.status === "pending" && (
            <div className="flex gap-2">
              <button 
                onClick={() => { onUpdateStatus(job.id, "accepted"); onClose(); }}
                className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" /> Accept Job
              </button>
              <button 
                onClick={() => { onUpdateStatus(job.id, "cancelled"); onClose(); }}
                className="flex-1 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" /> Decline
              </button>
            </div>
          )}
          {job.status === "accepted" && (
            <button 
              onClick={() => { onUpdateStatus(job.id, "in_progress"); onClose(); }}
              className="w-full py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              Start Job
            </button>
          )}
          {job.status === "in_progress" && (
            <button 
              onClick={() => { onUpdateStatus(job.id, "completed"); onClose(); }}
              className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Mark as Completed
            </button>
          )}
          <button 
            onClick={onClose}
            className="w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// WITHDRAW MODAL
// =============================================
function WithdrawModal({ 
  balance,
  onClose,
  onWithdraw 
}: { 
  balance: number;
  onClose: () => void;
  onWithdraw: (amount: number, method: string, phone: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      onWithdraw(Number(amount), method, phone);
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Withdrawal Initiated!</h2>
          <p className="text-gray-600 mb-4">
            UGX {Number(amount).toLocaleString()} will be sent to your {method === "mtn" ? "MTN" : "Airtel"} number.
          </p>
          <p className="text-sm text-gray-500 mb-6">Processing time: 1-5 minutes</p>
          <button onClick={onClose} className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold text-lg">Withdraw Funds</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Available Balance */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500">Available Balance</p>
            <p className="text-2xl font-bold text-gray-900">UGX {balance.toLocaleString()}</p>
          </div>

          {step === 1 && (
            <>
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Withdrawal Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  max={balance}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
                <div className="flex gap-2 mt-2">
                  {[50000, 100000, 200000].map(val => (
                    <button
                      key={val}
                      onClick={() => setAmount(String(val))}
                      className="flex-1 py-2 text-sm border rounded-lg hover:bg-gray-50"
                    >
                      {(val/1000)}K
                    </button>
                  ))}
                  <button
                    onClick={() => setAmount(String(balance))}
                    className="flex-1 py-2 text-sm border rounded-lg hover:bg-gray-50 text-orange-600"
                  >
                    All
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Withdraw To
                </label>
                <div className="space-y-2">
                  <div 
                    onClick={() => setMethod("mtn")}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${method === "mtn" ? "border-orange-500 bg-orange-50" : ""}`}
                  >
                    <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <span className="font-medium">MTN Mobile Money</span>
                  </div>
                  <div 
                    onClick={() => setMethod("airtel")}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${method === "airtel" ? "border-orange-500 bg-orange-50" : ""}`}
                  >
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-medium">Airtel Money</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!amount || !method || Number(amount) > balance || Number(amount) < 5000}
                className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                Continue
              </button>
            </>
          )}

          {step === 2 && (
            <>
              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {method === "mtn" ? "MTN" : "Airtel"} Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={method === "mtn" ? "077X XXX XXX" : "070X XXX XXX"}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount</span>
                  <span>UGX {Number(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Fee (1%)</span>
                  <span>UGX {(Number(amount) * 0.01).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>You Receive</span>
                  <span className="text-orange-600">UGX {(Number(amount) * 0.99).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!phone || phone.length < 10 || isProcessing}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : "Withdraw"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================
// CHAT MODAL
// =============================================
function ChatModal({ 
  message, 
  onClose 
}: { 
  message: Message; 
  onClose: () => void;
}) {
  const [newMessage, setNewMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: "client", text: "Hello, I submitted a service request.", time: "10:00 AM" },
    { id: 2, sender: "provider", text: "Hi! Yes, I received it. I can come tomorrow morning.", time: "10:05 AM" },
    { id: 3, sender: "client", text: message.lastMessage, time: "10:10 AM" },
  ]);

  const handleSend = () => {
    if (newMessage.trim()) {
      setChatMessages([...chatMessages, { 
        id: chatMessages.length + 1, 
        sender: "provider", 
        text: newMessage, 
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }]);
      setNewMessage("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium">{message.clientName}</p>
              <p className="text-xs text-gray-500">Job #{message.jobId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "provider" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                msg.sender === "provider" 
                  ? "bg-orange-500 text-white rounded-br-md" 
                  : "bg-gray-100 text-gray-900 rounded-bl-md"
              }`}>
                <p className="text-sm">{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.sender === "provider" ? "text-orange-100" : "text-gray-400"}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
          />
          <button 
            onClick={handleSend}
            className="p-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// MAIN DASHBOARD COMPONENT
// =============================================
export default function ProviderDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("jobs");
  const [jobFilter, setJobFilter] = useState<JobStatus | "all">("all");
  const [jobs, setJobs] = useState(DUMMY_JOBS);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedChat, setSelectedChat] = useState<Message | null>(null);
  const [showWithdraw, setShowWithdraw] = useState(false);
  
  // Calculate stats
  const stats = {
    totalEarnings: 1580000,
    pendingPayments: 350000,
    availableBalance: 427500,
    completedJobs: jobs.filter(j => j.status === "completed").length,
    pendingJobs: jobs.filter(j => j.status === "pending").length,
    activeJobs: jobs.filter(j => j.status === "in_progress" || j.status === "accepted").length,
    rating: 4.8,
    totalReviews: DUMMY_RATINGS.length,
  };

  const filteredJobs = jobFilter === "all" 
    ? jobs 
    : jobs.filter(j => j.status === jobFilter);

  const handleUpdateStatus = (jobId: string, newStatus: JobStatus) => {
    setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
  };

  const handleWithdraw = (amount: number, method: string, phone: string) => {
    console.log("Withdraw:", { amount, method, phone });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modals */}
      {selectedJob && (
        <JobDetailModal 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)} 
          onUpdateStatus={handleUpdateStatus}
        />
      )}
      {selectedChat && (
        <ChatModal message={selectedChat} onClose={() => setSelectedChat(null)} />
      )}
      {showWithdraw && (
        <WithdrawModal 
          balance={stats.availableBalance} 
          onClose={() => setShowWithdraw(false)}
          onWithdraw={handleWithdraw}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Provider Dashboard</h1>
              <p className="text-orange-100">ElectroPro Services</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 bg-white/20 rounded-lg relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">3</span>
              </button>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 -mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Earnings</p>
                <p className="font-bold text-gray-900">UGX {(stats.totalEarnings/1000).toFixed(0)}K</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Available</p>
                <p className="font-bold text-gray-900">UGX {(stats.availableBalance/1000).toFixed(0)}K</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Active Jobs</p>
                <p className="font-bold text-gray-900">{stats.activeJobs}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Rating</p>
                <p className="font-bold text-gray-900">{stats.rating} ({stats.totalReviews})</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 mt-6">
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm overflow-x-auto">
          {[
            { id: "jobs", label: "Jobs", icon: Briefcase },
            { id: "earnings", label: "Earnings", icon: TrendingUp },
            { id: "messages", label: "Messages", icon: MessageCircle, badge: 2 },
            { id: "ratings", label: "Ratings", icon: Star },
            { id: "withdraw", label: "Withdraw", icon: Wallet },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? "bg-orange-500 text-white" 
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge && (
                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                  activeTab === tab.id ? "bg-white text-orange-500" : "bg-red-500 text-white"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-6">
        {/* JOBS TAB */}
        {activeTab === "jobs" && (
          <div className="space-y-4">
            {/* Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { id: "all", label: "All" },
                { id: "pending", label: "Pending" },
                { id: "accepted", label: "Accepted" },
                { id: "in_progress", label: "In Progress" },
                { id: "completed", label: "Completed" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setJobFilter(filter.id as JobStatus | "all")}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                    jobFilter === filter.id 
                      ? "bg-orange-500 text-white" 
                      : "bg-white text-gray-600 border"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Job Cards */}
            <div className="space-y-3">
              {filteredJobs.map((job) => (
                <div 
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-400">#{job.id}</span>
                        <StatusBadge status={job.status} />
                      </div>
                      <h3 className="font-semibold text-gray-900">{job.serviceType}</h3>
                      <p className="text-sm text-gray-500 mt-1">{job.clientName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-600">UGX {job.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{new Date(job.scheduledDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {job.scheduledTime}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EARNINGS TAB */}
        {activeTab === "earnings" && (
          <div className="space-y-4">
            {/* Earnings Summary */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Earnings Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">UGX {(stats.totalEarnings/1000).toFixed(0)}K</p>
                  <p className="text-xs text-gray-500">Total Earned</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">UGX {(stats.pendingPayments/1000).toFixed(0)}K</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">UGX {(stats.availableBalance/1000).toFixed(0)}K</p>
                  <p className="text-xs text-gray-500">Available</p>
                </div>
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">Transaction History</h3>
              </div>
              <div className="divide-y">
                {DUMMY_TRANSACTIONS.map((txn) => (
                  <div key={txn.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        txn.type === "earning" ? "bg-green-100" : 
                        txn.type === "withdrawal" ? "bg-orange-100" : "bg-red-100"
                      }`}>
                        {txn.type === "earning" ? <ArrowDownRight className="w-5 h-5 text-green-600" /> :
                         txn.type === "withdrawal" ? <ArrowUpRight className="w-5 h-5 text-orange-600" /> :
                         <DollarSign className="w-5 h-5 text-red-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{txn.description}</p>
                        <p className="text-xs text-gray-500">{txn.date}</p>
                      </div>
                    </div>
                    <span className={`font-bold ${txn.amount > 0 ? "text-green-600" : "text-gray-900"}`}>
                      {txn.amount > 0 ? "+" : ""}UGX {Math.abs(txn.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === "messages" && (
          <div className="bg-white rounded-xl shadow-sm divide-y">
            {DUMMY_MESSAGES.map((msg) => (
              <div 
                key={msg.id}
                onClick={() => setSelectedChat(msg)}
                className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50"
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-orange-600" />
                  </div>
                  {msg.unread && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`font-medium ${msg.unread ? "text-gray-900" : "text-gray-600"}`}>
                      {msg.clientName}
                    </p>
                    <span className="text-xs text-gray-400">{msg.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{msg.lastMessage}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            ))}
          </div>
        )}

        {/* RATINGS TAB */}
        {activeTab === "ratings" && (
          <div className="space-y-4">
            {/* Rating Summary */}
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-8 h-8 ${star <= Math.round(stats.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} 
                  />
                ))}
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.rating}</p>
              <p className="text-gray-500">{stats.totalReviews} reviews</p>
            </div>

            {/* Reviews List */}
            <div className="space-y-3">
              {DUMMY_RATINGS.map((review) => (
                <div key={review.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{review.clientName}</p>
                      <p className="text-xs text-gray-500">{review.jobType} • {review.date}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-4 h-4 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WITHDRAW TAB */}
        {activeTab === "withdraw" && (
          <div className="space-y-4">
            {/* Balance Card */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white text-center">
              <p className="text-orange-100">Available Balance</p>
              <p className="text-4xl font-bold my-2">UGX {stats.availableBalance.toLocaleString()}</p>
              <button 
                onClick={() => setShowWithdraw(true)}
                className="mt-4 px-8 py-3 bg-white text-orange-600 rounded-lg font-medium hover:bg-orange-50"
              >
                Withdraw Funds
              </button>
            </div>

            {/* Withdraw Options */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Withdrawal Methods</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">MTN Mobile Money</p>
                    <p className="text-sm text-gray-500">Instant transfer • 1% fee</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Airtel Money</p>
                    <p className="text-sm text-gray-500">Instant transfer • 1% fee</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </div>

            {/* Recent Withdrawals */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">Recent Withdrawals</h3>
              </div>
              <div className="divide-y">
                {DUMMY_TRANSACTIONS.filter(t => t.type === "withdrawal").map((txn) => (
                  <div key={txn.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <ArrowUpRight className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{txn.description}</p>
                        <p className="text-xs text-gray-500">{txn.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-gray-900">UGX {Math.abs(txn.amount).toLocaleString()}</span>
                      <p className="text-xs text-green-600">Completed</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
