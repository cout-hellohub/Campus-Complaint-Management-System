import React from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaBell,
  FaTachometerAlt,
  FaTasks,
  FaChartBar,
  FaSpinner,
  FaFileAlt,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import axios from "axios";
import API_BASE_URL from "../config/api.js";
import StatusToast from "../components/StatusToast.jsx";
import useBackLogoutGuard from "../hooks/useBackLogoutGuard";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardNavbar from "../components/DashboardNavbar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';

// Import shared pages (like Profile)
import ProfilePage from "./ProfilePage";
import ComplaintsTable from "../components/ComplaintsTable";

// Shared UI helpers used by multiple sub-pages
const getBorderColor = (color) => {
  switch (color) {
    case "blue":
      return "border-blue-500";
    case "green":
      return "border-green-500";
    case "yellow":
      return "border-yellow-500";
    case "red":
      return "border-red-500";
    default:
      return "border-gray-500";
  }
};

const getBackgroundColor = (color) => {
  switch (color) {
    case "blue":
      return "bg-blue-50";
    case "green":
      return "bg-green-50";
    case "yellow":
      return "bg-yellow-50";
    case "red":
      return "bg-red-50";
    default:
      return "bg-gray-50";
  }
};

const getLabelColor = (color) => {
  switch (color) {
    case "blue":
      return "text-blue-700";
    case "green":
      return "text-green-700";
    case "yellow":
      return "text-yellow-700";
    case "red":
      return "text-red-700";
    default:
      return "text-gray-700";
  }
};

const committeeSidebarNavItems = [
  {
    to: "/committee-dashboard",
    label: "Dashboard",
    icon: <FaTachometerAlt size={18} />,
  },
  {
    to: "/committee-dashboard/assigned-complaints",
    label: "Assigned Complaints",
    icon: <FaTasks size={18} />,
  },
  {
    to: "/committee-dashboard/analytics",
    label: "Analytics",
    icon: <FaChartBar size={18} />,
  },
];

const committeeNavbarTestIds = {
  container: "dashboard-header",
  title: "dashboard-title",
  headerControls: "header-controls-container",
  bellButton: "notification-bell-button",
  bellIcon: "notification-bell-icon",
  bellBadge: "notification-badge",
  notificationsWrapper: "notification-dropdown",
  notificationsTitle: "notification-dropdown-title",
  markAllReadButton: "mark-all-read-button",
  profileButton: "user-profile-dropdown-button",
  profileAvatar: "user-avatar",
  profileName: "user-name-display",
  profileMenu: "user-dropdown-menu",
  profileLink: "dropdown-profile-link",
  logoutButton: "dropdown-logout-button",
  menuButton: "committee-sidebar-menu-button",
};

// --- 2. Placeholder Pages for Committee Features ---

// C2: View & manage assigned complaints
const AssignedComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusDescription, setStatusDescription] = useState("");
  const [updating, setUpdating] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [committees, setCommittees] = useState([]);
  const [selectedCommittee, setSelectedCommittee] = useState("");
  const [forwarding, setForwarding] = useState(false);

  // --- STATE FOR SEARCH, SORTING, AND FILTERING ---
  const [sortConfig, setSortConfig] = useState(null); 
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    status: [], 
    priority: [], 
  });
  const [tempFilters, setTempFilters] = useState(filters);
  const [searchTerm, setSearchTerm] = useState(""); 
  // --- END STATE ---

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const location = useLocation();
  const navigate = useNavigate();
  const targetComplaintIdRef = useRef(null);

  useEffect(() => {
    // capture complaintId query param if present so we can open it after fetch
    try {
      const params = new URLSearchParams(location.search);
      const cid = params.get('complaintId');
      if (cid) targetComplaintIdRef.current = cid;
    } catch (e) {
      targetComplaintIdRef.current = null;
    }

    fetchAssignedComplaints();
    fetchCommittees();
  }, [location.search]);

  const fetchCommittees = async () => {
    try {
      const token = localStorage.getItem("ccms_token");
      if (!token) return;

      const { data } = await axios.get(
        `${API_BASE_URL}/committees`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setCommittees(data.committees || []);
    } catch (err) {
      console.error("Fetch Committees Error:", err);
      // Don't show error toast, just log it
    }
  };

  const fetchAssignedComplaints = async () => {
    try {
      setLoading(true);
      setError("");
      
      const token = localStorage.getItem("ccms_token");
      if (!token) {
        setError("You are not logged in. Please login again.");
        setLoading(false);
        return;
      }

      const { data } = await axios.get(
        `${API_BASE_URL}/complaints/assigned`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setComplaints(data.complaints || []);
      // If a complaintId was passed in the URL, open it once complaints are loaded
      try {
        const cid = targetComplaintIdRef.current;
        if (cid) {
          const found = (data.complaints || []).find((c) => c._id === cid);
          if (found) {
            setSelectedComplaint(found);
            setShowViewModal(true);
            // clear the param from URL
            navigate('/committee-dashboard/assigned-complaints', { replace: true });
          }
        }
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error("Fetch Assigned Complaints Error:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to fetch assigned complaints. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || !statusDescription.trim()) {
      showToast("Please select a status and provide a description.", "error");
      return;
    }

    try {
      setUpdating(true);
      const token = localStorage.getItem("ccms_token");

      await axios.patch(
        `${API_BASE_URL}/complaints/${selectedComplaint._id}/status`,
        {
          status: newStatus,
          description: statusDescription.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      
      await fetchAssignedComplaints();
      
    
      setShowStatusModal(false);
      setSelectedComplaint(null);
      setNewStatus("");
      setStatusDescription("");
      
      showToast("Status updated successfully!", "success");
    } catch (err) {
      console.error("Update Status Error:", err);
      showToast(
        err?.response?.data?.message ||
          "Failed to update status. Please try again.",
        "error"
      );
    } finally {
      setUpdating(false);
    }
  };

  const openStatusModal = (complaint) => {
    if (!complaint) return;
    const normalizedStatus = (complaint.status || "").toLowerCase();
    if (normalizedStatus === "resolved" || normalizedStatus === "rejected") {
      showToast("You cannot update complaints that are already resolved or rejected.", "error");
      return;
    }
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status);
    setStatusDescription("");
    setShowStatusModal(true);
  };


  const openViewModal = (complaint) => {
    setSelectedComplaint(complaint);
    setShowViewModal(true);
  };

  const openForwardModal = (complaint) => {
    setSelectedComplaint(complaint);
    setSelectedCommittee("");
    setShowForwardModal(true);
  };

  const handleForward = async () => {
    if (!selectedCommittee) {
      showToast("Please select a committee to forward to.", "error");
      return;
    }

    if (!selectedComplaint) {
      showToast("No complaint selected.", "error");
      return;
    }

    try {
      setForwarding(true);
      const token = localStorage.getItem("ccms_token");

      await axios.put(
        `${API_BASE_URL}/complaints/${selectedComplaint._id}/forward`,
        {
          newCommitteeId: selectedCommittee,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      showToast("Complaint forwarded successfully.", "success");
      setShowForwardModal(false);
      setSelectedComplaint(null);
      setSelectedCommittee("");
      
      // Refresh the complaints list
      await fetchAssignedComplaints();
    } catch (err) {
      console.error("Forward Complaint Error:", err);
      showToast(
        err?.response?.data?.message ||
          "Failed to forward complaint. Please try again.",
        "error"
      );
    } finally {
      setForwarding(false);
    }
  };

  // --- HELPER FUNCTIONS ---
  const getComplaintId = (id) => {
    if (!id) return "N/A";
    return `CC${id.slice(-6).toUpperCase()}`;
  };

  const getUserName = (userId) => {
    if (!userId) return "Unknown";
 
    return userId.name || "Unknown";
  };
  
  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: "bg-yellow-50 text-yellow-700",
      "in-progress": "bg-blue-50 text-blue-700",
      resolved: "bg-green-50 text-green-700",
      rejected: "bg-gray-100 text-gray-800",
    };

    if (!status) return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800`}>N/A</span>
    );

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
          statusStyles[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityStyles = {
      High: "bg-red-100 text-red-800",
      Medium: "bg-yellow-100 text-yellow-800",
      Low: "bg-green-100 text-green-800",
    };

    if (!priority) return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800`}>N/A</span>
    );


    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${
          priorityStyles[priority] || "bg-gray-100 text-gray-800"
        }`}
      >
        {priority}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSortLabel = () => {
    if (!sortConfig) return "Sort By";
    
    if (sortConfig.key === "priority" && sortConfig.direction === "ascending") {
        return "Priority: Low ↓";
    }
    if (sortConfig.key === "priority" && sortConfig.direction === "descending") {
        return "Priority: High ↑";
    }
    if (sortConfig.key === "createdAt" && sortConfig.direction === "ascending") {
        return "Date: Oldest ↓";
    }
    if (sortConfig.key === "createdAt" && sortConfig.direction === "descending") {
        return "Date: Newest ↑";
    }

    return "Sort By";
  };
  
  const sortComplaints = (key, newDirection) => {
    setSortConfig({ key, direction: newDirection });
  };

  const sortedAndFilteredComplaints = useMemo(() => {
    let processableComplaints = [...complaints];


    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase().trim();
      const searchWords = lowerCaseSearch.split(/\s+/).filter(word => word.length > 0);

      processableComplaints = processableComplaints.filter(c => {
        if (!c) return false;
        
        
        const title = (c.title || "").toLowerCase();
        const category = (c.category || "").toLowerCase();
        const complaintId = getComplaintId(c._id).toLowerCase();
        const userName = (c.userId?.name || "").toLowerCase();
        
 
        const directMatch = 
          title.includes(lowerCaseSearch) ||
          category.includes(lowerCaseSearch) ||
          complaintId.includes(lowerCaseSearch);

        if (directMatch) return true;
        
  
        if (searchWords.length > 0) {
            const wordMatch = searchWords.every(word => userName.includes(word));
            if (wordMatch) return true;
        }

        return false;
      });
    }

    if (filters.status.length > 0) {
      processableComplaints = processableComplaints.filter(c => c && filters.status.includes(c.status));
    }
    if (filters.priority.length > 0) {
      processableComplaints = processableComplaints.filter(c => c && filters.priority.includes(c.priority));
    }

  
    if (sortConfig && sortConfig.key) {
      processableComplaints.sort((a, b) => {
        if (!a) return sortConfig.direction === "ascending" ? 1 : -1;
        if (!b) return sortConfig.direction === "ascending" ? -1 : 1;
        
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === "priority") {
          const priorityOrder = { High: 3, Medium: 2, Low: 1 };
          aVal = priorityOrder[aVal] || 0;
          bVal = priorityOrder[bVal] || 0;
        }
        
        if (aVal == null) return sortConfig.direction === "ascending" ? 1 : -1;
        if (bVal == null) return sortConfig.direction === "ascending" ? -1 : 1;

        if (aVal < bVal) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return processableComplaints;
  }, [complaints, sortConfig, filters, searchTerm]);

  const handleFilterChange = (filterType, value, isChecked) => {
    setTempFilters(prev => {
      const currentValues = prev[filterType];
      if (isChecked) {
        return { ...prev, [filterType]: [...currentValues, value] };
      } else {
        return { ...prev, [filterType]: currentValues.filter(v => v !== value) };
      }
    });
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    const defaultFilters = { status: [], priority: [] };
    setFilters(defaultFilters);
    setTempFilters(defaultFilters);
    setShowFilterModal(false);
  };

  const toastNode = (
    <StatusToast toast={toast} onClose={() => setToast(null)} />
  );
 
  if (loading) {
    return (
      <>
        {toastNode}
        <div className="bg-white p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Assigned Complaints</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading assigned complaints...</div>
        </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {toastNode}
        <div className="bg-white p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Assigned Complaints</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchAssignedComplaints}
            className="mt-2 text-sm text-red-600 hover:underline"
          >
            Try again
          </button>
        </div>
        </div>
      </>
    );
  }
 
  return (
    <>
      {toastNode}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Assigned Complaints</h1>
            <p className="text-sm text-gray-600 mt-1">
              Showing: {sortedAndFilteredComplaints.length} complaints (Filtered from {complaints.length})
            </p>
          </div>
          
          <div className="flex flex-col xs:flex-row gap-2 md:gap-3 md:items-center">
            <div className="relative w-full xs:w-auto">
              <input
                type="text"
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full xs:w-48 sm:w-64 pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 touch-manipulation"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            
            <div className="flex gap-2 md:gap-3">
              <div className="relative flex-1 xs:flex-initial">
                <select
                  value={sortConfig ? `${sortConfig.key}-${sortConfig.direction}` : ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      const [key, direction] = value.split('-');
                      sortComplaints(key, direction);
                    } else {
                      setSortConfig(null);
                    }
                  }}
                  className="w-full xs:w-auto px-3 xs:px-6 py-1.5 border border-gray-300 rounded-lg text-sm bg-white shadow-sm appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer touch-manipulation"
                >
                  <option value="" className="text-gray-500">{getSortLabel()}</option>
                  <option value="priority-descending">Priority: High to Low</option>
                  <option value="priority-ascending">Priority: Low to High</option>
                  <option value="createdAt-descending">Date: New to Old</option>
                  <option value="createdAt-ascending">Date: Old to New</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>

              <button
                onClick={() => {
                  setTempFilters(filters);
                  setShowFilterModal(true);
                }}
                className={`flex items-center space-x-1 px-3 py-2 text-sm rounded-lg shadow-sm font-medium transition-colors border touch-manipulation ${
                  (filters.status.length > 0 || filters.priority.length > 0)
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd"></path>
                </svg>
                { (filters.status.length > 0 || filters.priority.length > 0) && (
                  <span className={`text-xs font-bold ${ (filters.status.length > 0 || filters.priority.length > 0) ? 'text-white' : 'text-blue-600'}`}>
                    ({filters.status.length + filters.priority.length})
                  </span>
                )}
              </button>

              <button
                onClick={fetchAssignedComplaints}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium px-2 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 touch-manipulation"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

      <ComplaintsTable
        complaints={sortedAndFilteredComplaints}
        config={{
          showId: true,
          showTitle: true,
          showUpvotes: true,
          showPriority: true,
          showStatus: true,
          showFiledBy: true,
          showDate: true,
          showActions: true,
          actionType: "committee-actions",
          onUpdateStatus: openStatusModal,
          onView: openViewModal,
          emptyMessage: "No complaints found matching current criteria.",
        }}
      />

      {showStatusModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Update Complaint Status
            </h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Complaint:</strong> {selectedComplaint.title}
              </p>
              <p className="text-sm text-gray-600">
                <strong>ID:</strong> {getComplaintId(selectedComplaint._id)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description (Required)
              </label>
              <textarea
                value={statusDescription}
                onChange={(e) => setStatusDescription(e.target.value)}
                placeholder="e.g., Assigned to maintenance team, expected resolution in 2 hours."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows="3"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleStatusUpdate}
                disabled={updating}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {updating ? "Updating..." : "Update"}
              </button>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedComplaint(null);
                  setNewStatus("");
                  setStatusDescription("");
                }}
                disabled={updating}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      
      {showViewModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start mb-4 border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-blue-700">Complaint Details</h2>
                <p className="text-sm text-gray-500 mt-1">ID: <span className="font-medium text-gray-700">{getComplaintId(selectedComplaint._id)}</span></p>
              </div>
              <div>
                <button
                  onClick={() => { setShowViewModal(false); setSelectedComplaint(null); }}
                  className="text-sm text-red-500 hover:text-red-700 transition-colors bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-600">Title</h3>
                <p className="text-gray-800 mb-3">{selectedComplaint.title}</p>

                <h3 className="text-sm font-semibold text-gray-600">Description</h3>
                <p className="text-gray-700 mb-3 whitespace-pre-line">{selectedComplaint.description}</p>

                <div className="flex flex-wrap gap-3 mt-2">
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <strong>Status:</strong>
                      <span>{getStatusBadge(selectedComplaint.status)}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Priority:</strong> {selectedComplaint.priority || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Filed By:</strong> {selectedComplaint.userId?.name || 'Anonymous'}
                    </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => openForwardModal(selectedComplaint)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Forward to Another Committee
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-600">Attachments</h3>
                <div className="mt-2 space-y-3">
                  {(selectedComplaint.attachments || []).length === 0 && (
                    <p className="text-gray-500">No attachments uploaded.</p>
                  )}

                  {(selectedComplaint.attachments || []).map((url, idx) => {
                    const lower = (url || '').toLowerCase();
                    const ext = lower.split('.').pop() || '';
                    const isImage = /^(jpg|jpeg|png|gif|webp)$/i.test(ext);
                    const isVideo = /^(mp4|webm|ogg|mov)$/i.test(ext);
                    return (
                      <div key={idx} className="border rounded p-2">
                        {isImage && (
                          <img src={url} alt={`attachment-${idx}`} className="max-w-full h-48 object-contain rounded" />
                        )}
                        {isVideo && (
                          <video controls className="w-full h-48 bg-black rounded">
                            <source src={url} />
                            Your browser does not support the video tag.
                          </video>
                        )}
                        {!isImage && !isVideo && (
                          <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Download / Open attachment</a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORWARD MODAL */}
      {showForwardModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Forward Complaint
            </h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Complaint:</strong> {selectedComplaint.title}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Current Committee:</strong> {selectedComplaint.category}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Committee to Forward To
              </label>
              <select
                value={selectedCommittee}
                onChange={(e) => setSelectedCommittee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- Select Committee --</option>
                {committees
                  .filter((c) => c !== selectedComplaint.category)
                  .map((committee) => (
                    <option key={committee} value={committee}>
                      {committee}
                    </option>
                  ))}
              </select>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to forward this complaint to{" "}
                <strong>{selectedCommittee || "another committee"}</strong>?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleForward}
                disabled={forwarding || !selectedCommittee}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {forwarding ? "Forwarding..." : "Forward"}
              </button>
              <button
                onClick={() => {
                  setShowForwardModal(false);
                  setSelectedCommittee("");
                }}
                disabled={forwarding}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILTER MODAL (Includes Status and Priority filters) */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">
              Filter Complaints
            </h2>

            <div className="space-y-6">
              {/* Filter by Status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Complaint Status
                </h3>
                <div className="flex flex-wrap gap-4">
                  {["pending", "in-progress", "resolved", "rejected"].map((status) => (
                    <label key={status} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempFilters.status.includes(status)}
                        onChange={(e) =>
                          handleFilterChange("status", status, e.target.checked)
                        }
                        className="form-checkbox h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="text-gray-700 text-sm">
                        {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filter by Priority */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Priority
                </h3>
                <div className="flex flex-wrap gap-4">
                  {["High", "Medium", "Low"].map((priority) => (
                    <label key={priority} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempFilters.priority.includes(priority)}
                        onChange={(e) =>
                          handleFilterChange("priority", priority, e.target.checked)
                        }
                        className="form-checkbox h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="text-gray-700 text-sm">{priority}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-4 border-t">
              <button
                onClick={applyFilters}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

// C4: Department/committee analytics dashboard (committee-scoped, cached, refreshable)
const AnalyticsDashboardPage = ({ profileDisplayName = "" }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analyticsData, setAnalyticsData] = useState(null);
  const [showGeneratingModal, setShowGeneratingModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [toast, setToast] = useState(null);

  // read committeeType from query param `ct` (admin navigation) or stored user
  const location = useLocation();
  let committeeType = null;
  try {
    const u = typeof window !== 'undefined' ? localStorage.getItem('ccms_user') : null;
    const parsed = u ? JSON.parse(u) : null;
    const params = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
    const queryCt = params ? params.get('ct') : null;
    committeeType = queryCt || parsed?.committeeType || parsed?.committee || null;
  } catch (e) {
    committeeType = null;
  }

   const resolveCommitteeDisplayName = () => {
    const fallback = committeeType || "Committee";
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("ccms_user") : null;
      if (!stored) return fallback;
      const parsed = JSON.parse(stored);
      const name = typeof parsed?.name === "string" ? parsed.name.trim() : "";
      if (name) return name;
      const type = typeof parsed?.committeeType === "string" ? parsed.committeeType.trim() : "";
      if (type) return type;
      const committee = typeof parsed?.committee === "string" ? parsed.committee.trim() : "";
      if (committee) return committee;
      return fallback;
    } catch {
      return fallback;
    }
  };
  const committeeDisplayName = profileDisplayName.trim() || resolveCommitteeDisplayName();

  const CACHE_KEY = "committee_analytics";
  const [complaintsList, setComplaintsList] = useState([]);
  const navigate = useNavigate();

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const toastNode = (
    <StatusToast toast={toast} onClose={() => setToast(null)} />
  );

  const readCache = (ct) => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return obj?.[ct] || null;
    } catch (e) {
      return null;
    }
  };

  const handleGenerateReport = async () => {
  setShowGeneratingModal(true);
  setShowDownloadModal(false);
  setPdfBlob(null);

  try {
    const token = localStorage.getItem("ccms_token");

    const response = await axios.get(
      `${API_BASE_URL}/reports/committee-monthly?committeeType=${committeeType}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob", // important for PDF
      }
    );

    setPdfBlob(response.data);

    // switch modals
    setShowGeneratingModal(false);
    setShowDownloadModal(true);

  } catch (error) {
    console.error("PDF generation failed:", error);
    showToast("Failed to generate report. Please try again.", "error");
    setShowGeneratingModal(false);
  }
};


  const writeCache = (ct, data) => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      obj[ct] = { ...data, fetchedAt: Date.now() };
      localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
    } catch (e) {
      // ignore cache write errors
      console.warn("Failed to write analytics cache", e);
    }
  };

  const fetchMetrics = async (opts = { showLoading: true }) => {
    if (!committeeType) {
      setError("Committee type not found in profile. Please re-login or contact admin.");
      setMetrics(null);
      return;
    }

    const token = localStorage.getItem("ccms_token");
    if (!token) {
      setError("Missing auth token. Please login again.");
      setMetrics(null);
      return;
    }

    try {
      if (opts.showLoading) setLoading(true);
      setError("");

      const url = `${API_BASE_URL}/committee-analytics/${encodeURIComponent(
        committeeType
      )}`;

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // normalize shape defensively
      const normalized = {
        total: Number(data.total) || 0,
        resolved: Number(data.resolved) || 0,
        avgResolutionTimeDays:
          data.avgResolutionTimeDays == null ? 0 : Number(data.avgResolutionTimeDays),
        resolutionRate: data.resolutionRate == null ? 0 : Number(data.resolutionRate),
      };

      setMetrics(normalized);
      writeCache(committeeType, normalized);
    } catch (err) {
      console.error("Fetch committee analytics error:", err);
      setError(
        err?.response?.data?.message || "Failed to load analytics. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaintsList = async () => {
    try {
      const token = localStorage.getItem('ccms_token');
      if (!token) return;
      const { data } = await axios.get(`${API_BASE_URL}/complaints/assigned`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaintsList(data.complaints || []);
    } catch (e) {
      console.warn('Failed to fetch complaints list for analytics:', e?.response?.data || e.message || e);
      setComplaintsList([]);
    }
  };

  const fetchAnalyticsData = async (opts = { showLoading: true }) => {
    if (!committeeType) return;
    const token = localStorage.getItem('ccms_token');
    if (!token) return;
    try {
      if (opts.showLoading) setLoading(true);
      const url = `${API_BASE_URL}/committee-analytics/${encodeURIComponent(committeeType)}`;
      const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      // Expect exactly: categoryCounts, priorityCounts, statusCounts, dailyCounts30Days
      // Normalize subcategoryCounts: backend may return an object mapping label->count
      let subcategoryCountsArr = [];
      if (data.subcategoryCounts && typeof data.subcategoryCounts === 'object' && !Array.isArray(data.subcategoryCounts)) {
        subcategoryCountsArr = Object.keys(data.subcategoryCounts).map((k) => ({ category: k, count: data.subcategoryCounts[k] }));
      } else if (Array.isArray(data.categoryCounts) && data.categoryCounts.length) {
        // fallback to classic categoryCounts shape [{category, count}, ...]
        subcategoryCountsArr = data.categoryCounts;
      }

      setAnalyticsData({
        subcategoryCounts: subcategoryCountsArr,
        priorityCounts: data.priorityCounts || { High: 0, Medium: 0, Low: 0 },
        // statusCounts kept for compatibility though status chart was removed
        statusCounts: data.statusCounts || { pending: 0, 'in-progress': 0, resolved: 0 },
        dailyCounts30Days: data.dailyCounts30Days || [],
      });
    } catch (e) {
      console.warn('Failed to fetch analytics data', e?.response?.data || e.message || e);
    } finally {
      setLoading(false);
    }
  };

  const handleChartClick = (type, value) => {
    try {
      localStorage.setItem('analytics_filter', JSON.stringify({ type, value }));
      // Navigate to assigned complaints so the list will be filtered
      navigate('/committee-dashboard/assigned-complaints');
    } catch (e) {
      console.warn('Failed to apply chart filter', e);
    }
  };

  // On mount and whenever the selected committeeType changes: load cache, then fetch fresh
  useEffect(() => {
    if (!committeeType) {
      setError("Committee type not found in profile.");
      return;
    }

    const cached = readCache(committeeType);
    if (cached) {
      setMetrics({
        total: cached.total || 0,
        resolved: cached.resolved || 0,
        avgResolutionTimeDays: cached.avgResolutionTimeDays || 0,
        resolutionRate: cached.resolutionRate || 0,
      });
    }

    // fetch fresh but don't block UI if we showed cache
    fetchMetrics({ showLoading: !cached });
    // also fetch the complaints list so we can compute month-to-date counts client-side
    fetchComplaintsList();
    // fetch analytics (charts)
    fetchAnalyticsData({ showLoading: !cached });
  }, [committeeType]);

  const handleRefresh = () => fetchMetrics({ showLoading: true });

  // small helpers for display
  const formatDays = (d) => (d == null ? "—" : `${Number(d).toFixed(1)} days`);
  const formatPct = (p) => (p == null ? "—" : `${Number(p).toFixed(0)}%`);

  // compute month-to-date counts from complaint details (client-side)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTotalLocal = complaintsList.filter((c) => {
    try {
      const created = new Date(c.createdAt);
      return created.getMonth() === currentMonth && created.getFullYear() === currentYear;
    } catch (e) {
      return false;
    }
  }).length;

  const monthlyResolvedLocal = complaintsList.filter((c) => {
    try {
      // check statusHistory for a resolved entry in this month
      if (c.statusHistory && Array.isArray(c.statusHistory)) {
        const found = c.statusHistory.find((s) => {
          if (!s || !s.status) return false;
          if (s.status !== 'resolved') return false;
          const dt = s.updatedAt ? new Date(s.updatedAt) : null;
          return dt && dt.getMonth() === currentMonth && dt.getFullYear() === currentYear;
        });
        if (found) return true;
      }

      // fallback: if complaint.status === 'resolved' and updatedAt is in this month
      if (c.status === 'resolved') {
        const ua = c.updatedAt ? new Date(c.updatedAt) : null;
        if (ua && ua.getMonth() === currentMonth && ua.getFullYear() === currentYear) return true;
      }

      return false;
    } catch (e) {
      return false;
    }
  }).length;

  // Prefer client-side computed month-to-date counts when available,
  // otherwise fall back to backend-provided metrics if present.
  const displayMonthlyTotal = (typeof monthlyTotalLocal === 'number' && !isNaN(monthlyTotalLocal))
    ? monthlyTotalLocal
    : (metrics?.monthlyTotal != null ? metrics.monthlyTotal : null);

  const displayMonthlyResolved = (typeof monthlyResolvedLocal === 'number' && !isNaN(monthlyResolvedLocal))
    ? monthlyResolvedLocal
    : (metrics?.monthlyResolved != null ? metrics.monthlyResolved : null);

  return (
    <>
      {toastNode}
      <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{committeeDisplayName} Analytics</h1>
          <p className="mt-2 text-gray-600">Overview of complaints handled by your committee.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm hover:bg-gray-50"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2 text-gray-600">
                <FaSpinner className="animate-spin" /> Refreshing...
              </span>
            ) : (
              "Refresh"
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-lg shadow-lg border-l-8 bg-blue-50 border-blue-500">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-blue-700">
              Total Complaints
            </span>
          </div>
          <p className="text-xl font-bold text-gray-800 mt-2">
            {metrics ? metrics.total : '—'}
          </p>
          {displayMonthlyTotal != null && (
            <p className="text-sm text-gray-600 mt-1">
              {displayMonthlyTotal} in current month
            </p>
          )}
        </div>

        <div className="p-4 rounded-lg shadow-lg border-l-8 bg-green-50 border-green-500">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-green-700">Resolved</span>
          </div>
          <p className="text-xl font-bold text-gray-800 mt-2">
            {metrics ? metrics.resolved : '—'}
          </p>
          {displayMonthlyResolved != null && (
            <p className="text-sm text-gray-600 mt-1">
              {displayMonthlyResolved} in current month
            </p>
          )}
        </div>

        <div className="p-4 rounded-lg shadow-lg border-l-8 bg-yellow-50 border-yellow-500">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-yellow-700">
              Avg. Resolution Time
            </span>
          </div>
          <p className="text-xl font-bold text-gray-800 mt-2">
            {metrics ? formatDays(metrics.avgResolutionTimeDays) : '—'}
          </p>
        </div>

        <div className="p-4 rounded-lg shadow-lg border-l-8 bg-purple-50 border-purple-500">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-purple-700">
              Resolution Rate
            </span>
          </div>
          <p className="text-xl font-bold text-gray-800 mt-2">
            {metrics ? formatPct(metrics.resolutionRate) : '—'}
          </p>
        </div>

        <div
          className={`p-4 rounded-lg shadow-lg border-l-8 ${getBackgroundColor(
            "gray"
          )} ${getBorderColor("gray")}`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-700">
              Rejected Complaints
            </span>
          </div>
          <p className="text-xl font-bold text-gray-800 mt-2">
            {analyticsData?.statusCounts?.rejected || 0}
          </p>
        </div>
      </div>

      
      {/* Charts: Category, Priority, Status, Last 30 Days Trend */}
      {analyticsData && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Category Breakdown</h3>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={(analyticsData.subcategoryCounts || []).filter(d => d.count > 0)}>
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count">
                    {(analyticsData.subcategoryCounts || []).filter(d => d.count > 0).map((entry, idx) => (
                      <Cell key={`cell-${idx}`} onClick={() => handleChartClick('category', entry.category)} fill={"#4F46E5"} cursor="pointer" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Priority Breakdown</h3>
            <div className="flex items-center gap-4">
              <div style={{ width: '100%', height: 220 }} className="flex-1">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'High', value: analyticsData.priorityCounts.High || 0 },
                        { name: 'Medium', value: analyticsData.priorityCounts.Medium || 0 },
                        { name: 'Low', value: analyticsData.priorityCounts.Low || 0 },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={80}
                      innerRadius={40}
                      // keep click behavior but remove hover tooltip
                      onClick={(e) => e && handleChartClick('priority', e.name)}
                      cursor="pointer"
                    >
                      <Cell fill="#DC2626" />
                      <Cell fill="#F59E0B" />
                      <Cell fill="#10B981" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-48">
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'High', color: '#DC2626', value: analyticsData.priorityCounts.High || 0 },
                    { label: 'Medium', color: '#F59E0B', value: analyticsData.priorityCounts.Medium || 0 },
                    { label: 'Low', color: '#10B981', value: analyticsData.priorityCounts.Low || 0 },
                  ].map((item) => (
                    item.value > 0 && (
                      <div key={item.label} className="flex items-center gap-2">
                          <span style={{ width: 12, height: 12, background: item.color, borderRadius: 4, display: 'inline-block' }} />
                          <span className="text-sm text-gray-700">{item.label} :</span>
                          <span className="ml-auto font-bold">{item.value}</span>
                        </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Status Breakdown removed as requested */}

          <div className="bg-white p-4 rounded-lg shadow md:col-span-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Last 30 Days Trend</h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={analyticsData.dailyCounts30Days} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#4F46E5" dot={{ r: 2 }} onClick={(d) => { if (d && d.activePayload && d.activePayload[0]) handleChartClick('date', d.activePayload[0].payload.date); }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-6 text-sm text-gray-500">
          {metrics && (
            <span>
              Last fetched: {
                (() => {
                  try {
                    const raw = localStorage.getItem(CACHE_KEY);
                    const obj = raw ? JSON.parse(raw) : {};
                    const entry = obj?.[committeeType];
                    if (entry?.fetchedAt) return new Date(entry.fetchedAt).toLocaleString();
                  } catch (e) {}
                  return 'Now';
                })()
              }
            </span>
          )}
        </div>
        </div>
      )}

      {/* Generate Report Button */}
      <div className="mt-10 flex justify-center">
        <button
          onClick={handleGenerateReport}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
        >
          Generate Report
        </button>
      </div>

      {/* Report Generation Modals */}
      {showGeneratingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl text-center w-80">
            <FaSpinner className="animate-spin text-3xl mx-auto text-blue-600" />
            <p className="mt-4 text-gray-700 font-medium">Generating report...</p>
          </div>
        </div>
      )}

      {showDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-80 text-center relative">

            <h2 className="text-xl font-semibold text-gray-900">Report Generated</h2>
            <p className="mt-2 text-gray-600">Your PDF report is ready.</p>

            <button
              onClick={() => {
                const url = window.URL.createObjectURL(
                  new Blob([pdfBlob], { type: "application/pdf" })
                );
                const a = document.createElement("a");
                a.href = url;
                a.download = "Report.pdf";
                a.click();
                window.URL.revokeObjectURL(url);
              }}
              className="mt-5 w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
            >
              Download Report
            </button>

            <button
              onClick={() => setShowDownloadModal(false)}
              className="mt-3 block w-full text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Close
            </button>

          </div>
        </div>
      )}

    </div>
    </>
  );
};

// A simple dashboard home for the committee
const CommitteeDashboardHome = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
  });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --- NEW: Retrieve Committee Name ---
  const userStr = localStorage.getItem("ccms_user");
  let committeeName = "Committee";
  try {
    if (userStr) {
      const user = JSON.parse(userStr);
      const displayName = (user?.name && user.name.trim()) || (user?.committeeType && user.committeeType.trim());
      committeeName = displayName || "Committee";
    }
  } catch (e) {
    // Fallback to default if parsing fails
  }
  // ------------------------------------

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const token = localStorage.getItem("ccms_token");
      if (!token) {
        setError("You are not logged in. Please login again.");
        setLoading(false);
        return;
      }

      // Fetch stats and recent complaints in parallel
      const [statsResponse, complaintsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/complaints/assigned/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        axios.get(`${API_BASE_URL}/complaints/assigned`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      ]);

      setStats(statsResponse.data);
      // Get only the 5 most recent complaints
      setRecentComplaints(complaintsResponse.data.complaints?.slice(0, 5) || []);
    } catch (err) {
      console.error("Fetch Dashboard Data Error:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to fetch dashboard data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: "bg-yellow-50 text-yellow-700",
      "in-progress": "bg-blue-50 text-blue-700",
      resolved: "bg-green-50 text-green-700",
      rejected: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
          statusStyles[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getComplaintId = (id) => {
    if (!id) return "N/A";
    return `CC${id.slice(-6).toUpperCase()}`;
  };

  const getUserName = (userId) => {
    if (!userId) return "Unknown";
    return userId.name || "Unknown";
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        {/* Updated Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{committeeName} Dashboard</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        {/* Updated Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{committeeName} Dashboard</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-2 text-sm text-red-600 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      label: "Total Complaints",
      value: stats.total,
      color: "blue",
    },
    {
      label: "Pending",
      value: stats.pending,
      color: "red",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      color: "yellow",
    },
    {
      label: "Resolved",
      value: stats.resolved,
      color: "green",
    },
  ];
   

  return (
    <div className="flex flex-col gap-8">
      <div>
        {/* Updated Title */}
        <h1 className="text-3xl font-bold text-gray-800">{committeeName} Dashboard</h1>
        <p className="text-gray-600 mt-2">
          {stats.pending} complaint{stats.pending !== 1 ? 's' : ''} awaiting action.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statsCards.map((stat) => (
          <div
            key={stat.label}
            className={`p-4 rounded-lg shadow-lg border-l-8 ${getBackgroundColor(
              stat.color
            )} ${getBorderColor(stat.color)}`}
          >
            <div className="flex justify-between items-center">
              <span
                className={`text-xs font-medium ${getLabelColor(stat.color)}`}
              >
                {stat.label}
              </span>
            </div>
            <p className="text-xl font-bold text-gray-800 mt-2">
              {stat.value}
            </p>
          </div>
        ))}
        <div
          className={`p-4 rounded-lg shadow-lg border-l-8 ${getBackgroundColor(
            "gray"
          )} ${getBorderColor("gray")}`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-700">
              Rejected Complaints
            </span>
          </div>
          <p className="text-xl font-bold text-gray-800 mt-2">
            {stats.rejected}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Recent Complaints
          </h2>
          <Link
            to="/committee-dashboard/assigned-complaints"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All →
          </Link>
        </div>
        <ComplaintsTable
          complaints={recentComplaints}
          config={{
            showId: true,
            showTitle: true,
            showStatus: true,
            showFiledBy: true,
            showDate: true,
            showActions: false,
            emptyMessage: "No complaints assigned to your committee yet.",
          }}
        />
      </div>
    </div>
  );
};

// --- 3. Main Committee Dashboard Component (Exported) ---

export default function CommitteeDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isHomeRoute =
    location.pathname === "/committee-dashboard" ||
    location.pathname === "/committee-dashboard/";
  useBackLogoutGuard(navigate, { enabled: isHomeRoute });
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Read profile from localStorage and derive display values
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('ccms_user') : null;
  let currentUser = null;
  try {
    currentUser = userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    currentUser = null;
  }
  
  const profileDisplayName =
    (currentUser?.name && currentUser.name.trim()) ||
    (currentUser?.committeeType && currentUser.committeeType.trim()) ||
    "Committee Name";
  const profileInitial = profileDisplayName.charAt(0).toUpperCase();
  const profileName = profileDisplayName;

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const token = localStorage.getItem("ccms_token");
      if (!token) return;

      const { data } = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Fetch notifications error:", err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("ccms_token");
      if (!token) return;

      await axios.patch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("ccms_token");
      if (!token) return;

      await axios.patch(
        `${API_BASE_URL}/notifications/mark-all-read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all as read error:", err);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem("ccms_token");
      if (!token) return;

      await axios.delete(`${API_BASE_URL}/notifications/${notificationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Update local state
      const notification = notifications.find((n) => n._id === notificationId);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      if (notification && !notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Delete notification error:", err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const token = localStorage.getItem("ccms_token");
      if (!token) return;

      const ids = (notifications || []).map((notification) => notification?._id).filter(Boolean);
      if (ids.length === 0) {
        return;
      }

      await Promise.all(
        ids.map((id) =>
          axios.delete(`${API_BASE_URL}/notifications/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          })
        )
      );

      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Clear all notifications error:", err);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification) return;
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    setNotificationDropdownOpen(false);
    try {
      const cid = notification?.complaint?._id || notification?.complaint;
      if (cid) {
        navigate(`/committee-dashboard/assigned-complaints?complaintId=${cid}`);
        return;
      }
    } catch (err) {
      // ignore navigation errors
    }
    navigate("/committee-dashboard/assigned-complaints");
  };

  const handleNotificationDelete = (notification) => {
    if (!notification) return;
    deleteNotification(notification._id);
  };

  const handleBellClick = () => {
    setNotificationDropdownOpen((prev) => {
      const next = !prev;
      if (!prev) {
        fetchNotifications();
      }
      return next;
    });
  };

  // Fetch notifications on component mount and set up polling
  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const pollInterval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(pollInterval);
  }, []);

  const handleLogout = () => {
    // Clear stored auth data like the student dashboard does
    localStorage.removeItem("ccms_token");
    localStorage.removeItem("ccms_user");
    // Use replace to prevent navigating back into a protected route
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef, notificationsRef]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeSidebar();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isSidebarOpen) {
      return undefined;
    }

    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isSidebarOpen]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar
        portalLabel="Committee Portal"
        logoInitials="CCR"
        logoRoute="/committee-dashboard"
        navItems={committeeSidebarNavItems}
        footerContent={<p className="text-xs text-gray-500">Logged in as Handler</p>}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />
      
      <div className="flex-1 flex flex-col w-full lg:pl-64">
        <DashboardNavbar
          title="Campus Complaint Resolve"
          profileName={profileName}
          profileInitial={profileInitial}
          onLogout={handleLogout}
          notifications={notifications}
          unreadCount={unreadCount}
          loadingNotifications={loadingNotifications}
          onBellClick={handleBellClick}
          onClearAllNotifications={clearAllNotifications}
          onMarkAllRead={markAllAsRead}
          onNotificationClick={handleNotificationClick}
          onNotificationDelete={handleNotificationDelete}
          notificationDropdownOpen={notificationDropdownOpen}
          notificationDropdownRef={notificationsRef}
          notificationButtonRef={notificationButtonRef}
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
          dropdownRef={dropdownRef}
          profileRoute="/committee-dashboard/profile"
          emptyState={(
            <>
              <FaBell size={28} className="sm:hidden mx-auto mb-2 text-gray-300" />
              <FaBell size={32} className="hidden sm:block mx-auto mb-2 text-gray-300" />
              <p className="text-sm sm:text-base">No notifications yet</p>
            </>
          )}
          showMenuButton
          onMenuToggle={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
          menuButtonTestId={committeeNavbarTestIds.menuButton}
          testIds={committeeNavbarTestIds}
        />

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<CommitteeDashboardHome />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route
              path="assigned-complaints"
              element={<AssignedComplaintsPage />}
            />
            <Route path="analytics" element={<AnalyticsDashboardPage profileDisplayName={profileName} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}