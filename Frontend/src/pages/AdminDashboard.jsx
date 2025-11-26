import React, { useState, useRef, useEffect, useMemo } from "react";
import { Routes, Route, Link, useNavigate, Navigate, useLocation } from "react-router-dom";
import {
  FaBell,
  FaHome,
  FaListAlt,
  FaChartBar,
  FaClipboardList,
  FaUserPlus,
} from "react-icons/fa";
import axios from "axios";
import API_BASE_URL from "../config/api.js";
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

import DashboardSidebar from "../components/DashboardSidebar";
import DashboardNavbar from "../components/DashboardNavbar";
import ProfilePage from "./ProfilePage";
import CreateAccountPage from "./CreateAccountPage";
import StatusToast from "../components/StatusToast.jsx";
import ComplaintsTable from "../components/ComplaintsTable";
import useBackLogoutGuard from "../hooks/useBackLogoutGuard";

const adminSidebarNavItems = [
  {
    to: "/admin-dashboard",
    label: "Home",
    icon: <FaHome size={18} />,
  },
  {
    to: "/admin-dashboard/all-complaints",
    label: "All Complaints",
    icon: <FaListAlt size={18} />,
  },
  {
    to: "/admin-dashboard/general-complaints",
    label: "General Complaints",
    icon: <FaClipboardList size={18} />,
  },
  {
    to: "/admin-dashboard/analytics",
    label: "Analytics",
    icon: <FaChartBar size={18} />,
  },
  {
    to: "/admin-dashboard/create-account",
    label: "Create/Delete Account",
    icon: <FaUserPlus size={18} />,
  },
];

const adminNavbarTestIds = {
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
  menuButton: "admin-sidebar-menu-button",
};

// Admin Dashboard Home with real-time complaints
const AdminDashboardHome = () => {
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

      // Fetch all complaints for admin
      const { data } = await axios.get(
        `${API_BASE_URL}/complaints/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const complaints = data.complaints || [];

      // Calculate stats
      const statsData = {
        total: complaints.length,
        pending: complaints.filter((c) => c.status === "pending").length,
        inProgress: complaints.filter((c) => c.status === "in-progress").length,
        resolved: complaints.filter((c) => c.status === "resolved").length,
        rejected: complaints.filter((c) => c.status === "rejected").length,
      };

      setStats(statsData);
      // Get only the 5 most recent complaints
      setRecentComplaints(complaints.slice(0, 5));
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

  const getBackgroundColor = (color) => {
    switch (color) {
      case "blue": return "bg-blue-50";
      case "green": return "bg-green-50";
      case "yellow": return "bg-yellow-50";
      case "red": return "bg-red-50";
      default: return "bg-gray-50";
    }
  };

  const getBorderColor = (color) => {
    switch (color) {
      case "blue": return "border-blue-500";
      case "green": return "border-green-500";
      case "yellow": return "border-yellow-500";
      case "red": return "border-red-500";
      default: return "border-gray-500";
    }
  };

  const getLabelColor = (color) => {
    switch (color) {
      case "blue": return "text-blue-700";
      case "green": return "text-green-700";
      case "yellow": return "text-yellow-700";
      case "red": return "text-red-700";
      default: return "text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin Dashboard</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin Dashboard</h1>
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
    { label: "Total Complaints", value: stats.total, color: "blue" },
    { label: "Pending", value: stats.pending, color: "red" },
    { label: "In Progress", value: stats.inProgress, color: "yellow" },
    { label: "Resolved", value: stats.resolved, color: "green" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Complaint Overview</h1>
        <p className="text-gray-600 mt-2">
          Here's an overview of the most recent complaint activity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statsCards.map((stat) => (
          <div
            key={stat.label}
            className={`p-6 rounded-lg shadow-lg border-l-8 ${getBackgroundColor(stat.color)} ${getBorderColor(stat.color)}`}
          >
            <div className="flex justify-between items-center">
              <span className={`text-sm font-medium ${getLabelColor(stat.color)}`}>
                {stat.label}
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-800 mt-2">
              {stat.value}
            </p>
          </div>
        ))}

        {/* Rejected Complaints card */}
        <div
          className={`p-6 rounded-lg shadow-lg border-l-8 ${getBackgroundColor("gray")} ${getBorderColor("gray")}`}
        >
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Rejected Complaints</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats.rejected}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Recent Complaints
          </h2>
          <Link
            to="/admin-dashboard/all-complaints"
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
            emptyMessage: "No complaints have been filed yet.",
          }}
        />
      </div>
    </div>
  );
};

const AllComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusDescription, setStatusDescription] = useState("");
  const [updating, setUpdating] = useState(false);
  const [sortConfig, setSortConfig] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    status: [],
    committee: [],
    priority: [],
  });
  const [tempFilters, setTempFilters] = useState(filters);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  // ------------------------

  useEffect(() => {
    fetchAllComplaints();
  }, []);

  // --- PAGINATION RESET ---
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, sortConfig]);
  // ------------------------

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  const fetchAllComplaints = async () => {
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
        `${API_BASE_URL}/complaints/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setComplaints(data.complaints || []);
    } catch (err) {
      console.error("Fetch All Complaints Error:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to fetch complaints. Please try again."
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

      await fetchAllComplaints();

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
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status);
    setStatusDescription("");
    setShowStatusModal(true);
  };

  const openViewModal = (complaint) => {
    setSelectedComplaint(complaint);
    setShowViewModal(true);
  };

  const getComplaintId = (id) => {
    if (!id) return "";
    return `CC${id.slice(-6).toUpperCase()}`;
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
    if (filters.committee.length > 0) {
      processableComplaints = processableComplaints.filter(c => c && filters.committee.includes(c.category));
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

  // --- PAGINATION CALCULATION ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedAndFilteredComplaints.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedAndFilteredComplaints.length / itemsPerPage);
  // ------------------------------

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
    const defaultFilters = { status: [], committee: [], priority: [] };
    setFilters(defaultFilters);
    setTempFilters(defaultFilters);
    setShowFilterModal(false);
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

  const getSortLabel = () => {
    if (!sortConfig) return "Sort By";
    if (sortConfig.key === "priority") {
      return `Priority: ${sortConfig.direction === "ascending" ? "Low ↓" : "High ↑"}`;
    }
    if (sortConfig.key === "createdAt") {
      return `Date: ${sortConfig.direction === "ascending" ? "Oldest ↓" : "Newest ↑"}`;
    }
    return "Sort By";
  };

  const toastNode = (
    <StatusToast toast={toast} onClose={() => setToast(null)} />
  );

  if (loading) {
    return (
      <>
        {toastNode}
        <div className="bg-white p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">All Complaints</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading complaints...</div>
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
        <h1 className="text-2xl font-bold text-gray-800 mb-4">All Complaints</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchAllComplaints}
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
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">All Complaints</h1>
            <p className="text-sm text-gray-600 mt-1">
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedAndFilteredComplaints.length)} of {sortedAndFilteredComplaints.length}
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
                  className="w-full xs:w-auto px-3 xs:px-6 py-1.5 border border-gray-300 rounded-lg text-sm bg-white shadow-sm appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium touch-manipulation"
                >
                  <option value="" className="text-gray-500">{getSortLabel()}</option>
                  <option value="priority-descending">Priority: High to Low</option>
                  <option value="priority-ascending">Priority: Low to High</option>
                  <option value="createdAt-descending">Date: New to Old</option>
                  <option value="createdAt-ascending">Date: Old to New</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                </div>
              </div>

              <button
                onClick={() => {
                  setTempFilters(filters);
                  setShowFilterModal(true);
                }}
                className={`flex items-center space-x-1 px-3 py-2 text-sm rounded-lg shadow-sm font-medium transition-colors border touch-manipulation ${
                  (filters.status.length > 0 || filters.committee.length > 0 || filters.priority.length > 0)
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd"></path>
                </svg>
                {(filters.status.length > 0 || filters.committee.length > 0 || filters.priority.length > 0) && (
                  <span className={`text-xs font-bold ${ (filters.status.length > 0 || filters.committee.length > 0 || filters.priority.length > 0) ? 'text-white' : 'text-blue-600'}`}>
                    ({filters.status.length + filters.committee.length + filters.priority.length})
                  </span>
                )}
              </button>

              <button
                onClick={fetchAllComplaints}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 touch-manipulation"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

      <ComplaintsTable
        complaints={currentItems}
        config={{
          showId: true,
          showTitle: true,
          showPriority: true,
          showStatus: true,
          showFiledBy: true,
          showDate: true,
          showCommittee: true,
          showActions: true,
          actionType: "admin-actions",
          onUpdateStatus: openStatusModal,
          onView: openViewModal,
          emptyMessage: "No complaints found matching current criteria.",
        }}
      />

      {/* --- PAGINATION CONTROLS (Google Style) --- */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-2">
          {/* Previous Button */}
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded text-sm font-medium ${
              currentPage === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-blue-600 hover:bg-blue-50 hover:text-blue-800'
            }`}
          >
            Previous
          </button>

          {/* Page Numbers */}
          <div className="flex space-x-1">
            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              // Logic to show limited page numbers if there are too many pages
              if (
                totalPages > 10 &&
                pageNumber !== 1 &&
                pageNumber !== totalPages &&
                Math.abs(currentPage - pageNumber) > 2
              ) {
                  if (Math.abs(currentPage - pageNumber) === 3) return <span key={pageNumber} className="px-2 text-gray-400">...</span>;
                  return null;
              }

              return (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    currentPage === pageNumber
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded text-sm font-medium ${
              currentPage === totalPages
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-blue-600 hover:bg-blue-50 hover:text-blue-800'
            }`}
          >
            Next
          </button>
        </div>
      )}

      {showViewModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Complaint Details</h2>
                <p className="text-sm text-gray-600 mt-1">ID: {getComplaintId(selectedComplaint._id)}</p>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Title</h3>
                <p className="text-gray-800 mb-3">{selectedComplaint.title}</p>

                <h3 className="text-sm font-semibold text-gray-700">Description</h3>
                <p className="text-gray-700 mb-3 whitespace-pre-line">{selectedComplaint.description}</p>

                <div className="flex flex-wrap gap-3 mt-2">
                  <div className="text-sm text-gray-600 flex items-center gap-2"><strong>Status:</strong><span>{getStatusBadge(selectedComplaint.status)}</span></div>
                  <div className="text-sm text-gray-600"><strong>Priority:</strong> {selectedComplaint.priority || 'N/A'}</div>
                  <div className="text-sm text-gray-600"><strong>Committee:</strong> {selectedComplaint.category || 'N/A'}</div>
                  <div className="text-sm text-gray-600"><strong>Filed By:</strong> {selectedComplaint.userId?.name || 'Anonymous'}</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700">Attachments</h3>
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

      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">
              Filter Complaints
            </h2>

            <div className="space-y-6">

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
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Committee
                </h3>
                <div className="flex flex-wrap gap-4">
                  {[...new Set(complaints.map(c => c.category).filter(c => c))]
                    .filter(category => category !== "Canteen")
                    .filter(category => category !== "Tech Committee")
                    .sort()
                    .map((category) => (
                      <label key={category} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempFilters.committee.includes(category)}
                          onChange={(e) =>
                            handleFilterChange("committee", category, e.target.checked)
                          }
                          className="form-checkbox h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="text-gray-700 text-sm">{category}</span>
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

const AnalyticsPage = () => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [topStats, setTopStats] = React.useState({
    total: 0,
    resolved: 0,
    avgResolutionDays: 0,
    pending: 0,
    monthDeltaPct: null,
  });
  const [committeeStats, setCommitteeStats] = React.useState([]);
  const [overallCategoryCounts, setOverallCategoryCounts] = React.useState([]);
  const [overallPriorityCounts, setOverallPriorityCounts] = React.useState({ High: 0, Medium: 0, Low: 0 });
  const [overallDailyCounts30Days, setOverallDailyCounts30Days] = React.useState([]);
  const [showGeneratingModal, setShowGeneratingModal] = React.useState(false);
  const [showDownloadModal, setShowDownloadModal] = React.useState(false);
  const [pdfBlob, setPdfBlob] = React.useState(null);

  const committeeNameMap = {
    Canteen: "Cafeteria Management Committee",
    Hostel: "Hostel Management Committee",
    Academic: "Academic Committee",
    Sports: "Sports Committee",
    Tech: "Tech-Support Committee",
    'Internal Complaints': "Internal Complaints Committee",
    'Annual Fest': "Annual Fest Committee",
    Cultural: "Cultural Committee",
    Placement: "Student Placement Cell",
    Admin: "General Complaints",
    // legacy / alternate keys
    "Anti-Ragging": "Internal Complaints Committee",
  };

  useEffect(() => {
    fetchAnalytics();
    // No automatic refresh — user must press Refresh button
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem('ccms_token');
      if (!token) throw new Error('Missing auth token');

      const { data } = await axios.get(`${API_BASE_URL}/complaints/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const complaints = data.complaints || [];

      const total = complaints.length;
      const resolved = complaints.filter(c => c.status === 'resolved').length;
      const pending = complaints.filter(c => c.status === 'pending').length;

      // average resolution time in days
      const resolvedTimes = complaints.map((c) => {
        try {
          // find resolved timestamp from statusHistory or updatedAt
          let resolvedAt = null;
          if (Array.isArray(c.statusHistory)) {
            const found = c.statusHistory.find(s => s && s.status === 'resolved');
            if (found && found.updatedAt) resolvedAt = new Date(found.updatedAt);
          }
          if (!resolvedAt && c.status === 'resolved' && c.updatedAt) resolvedAt = new Date(c.updatedAt);
          if (resolvedAt && c.createdAt) {
            const created = new Date(c.createdAt);
            return (resolvedAt - created) / (1000*60*60*24);
          }
        } catch (e) { }
        return null;
      }).filter(v => v != null && !isNaN(v));

      const avgResolutionDays = resolvedTimes.length ? (resolvedTimes.reduce((a,b)=>a+b,0)/resolvedTimes.length) : 0;

      // month-over-month delta for total complaints (simple)
      const now = new Date();
      const currMonth = now.getMonth();
      const currYear = now.getFullYear();
      const prev = new Date(now.getFullYear(), now.getMonth()-1, 1);
      const prevMonth = prev.getMonth();
      const prevYear = prev.getFullYear();

      const countThisMonth = complaints.filter(c => {
        try { const d = new Date(c.createdAt); return d.getMonth()===currMonth && d.getFullYear()===currYear; } catch(e){ return false; }
      }).length;
      const countPrevMonth = complaints.filter(c => {
        try { const d = new Date(c.createdAt); return d.getMonth()===prevMonth && d.getFullYear()===prevYear; } catch(e){ return false; }
      }).length;
      const monthDeltaPct = countPrevMonth === 0 ? null : Math.round(((countThisMonth - countPrevMonth)/countPrevMonth)*100);

      // group by category/committee
      // Only include committees that are registered in the backend (canonical list)
      const registeredCommittees = [
        'Canteen',
        'Hostel',
        'Sports',
        'Tech',
        'Academic',
        'Internal Complaints',
        'Annual Fest',
        'Cultural',
        'Placement',
        'Admin',
      ];

      const group = {};
      for (const c of complaints) {
        const raw = (c.category || '').toString().trim();
        if (!raw) continue;

        // Try to resolve the complaint's category to one of the registered committee keys.
        let matchedKey = null;
        for (const key of registeredCommittees) {
          // Exact match (most common)
          if (raw === key) {
            matchedKey = key;
            break;
          }
          // Some stored values may use display names like "Hostel Management" or "Cafeteria"
          const display = committeeNameMap[key] || key;
          if (raw === display) {
            matchedKey = key;
            break;
          }
          // Loose contains match (case-insensitive)
          if (raw.toLowerCase().includes(key.toLowerCase()) || display.toLowerCase().includes(raw.toLowerCase())) {
            matchedKey = key;
            break;
          }
        }

        // If we couldn't match this complaint's category to a registered committee, skip it.
        if (!matchedKey) continue;

        const mapped = committeeNameMap[matchedKey] || matchedKey;
        // store by canonical key but include display name
        if (!group[matchedKey]) group[matchedKey] = { committeeKey: matchedKey, committee: mapped, total: 0, resolved: 0, pending: 0 };
        group[matchedKey].total += 1;
        if (c.status === 'resolved') group[matchedKey].resolved += 1;
        if (c.status === 'pending') group[matchedKey].pending += 1;
      }

      const committeeArr = Object.values(group).map(item => ({
        ...item,
        resolutionRate: item.total ? Math.round((item.resolved / item.total) * 100) : 0,
      })).sort((a, b) => b.total - a.total);

      setTopStats({ total, resolved, avgResolutionDays: Number(avgResolutionDays.toFixed(1)), pending, monthDeltaPct, monthCount: countThisMonth });
      setCommitteeStats(committeeArr);

      // Overall Category Breakdown - use same matching logic as committee stats
      const categories = [
        'Admin', 'Hostel', 'Tech', 'Canteen', 'Internal Complaints', 'Academic', 'Sports', 'Placement', 'Annual Fest'
      ];
      const catCounts = categories.map(cat => {
        let total = 0;
        let resolvedCnt = 0;
        for (const c of complaints) {
          const raw = (c.category || '').toString().trim();
          if (!raw) continue;

          const display = committeeNameMap[cat] || cat;

          const isMatch =
            raw === cat ||
            raw === display ||
            raw.toLowerCase().includes(cat.toLowerCase()) ||
            display.toLowerCase().includes(raw.toLowerCase());

          if (isMatch) {
            total++;
            if (c.status === 'resolved') resolvedCnt++;
          }
        }
        const label = (committeeNameMap[cat] || cat).replace(/\s+Committee$/i, '').trim();
        return { category: label, total, resolved: resolvedCnt };
      }).filter(c => c.total > 0);
      setOverallCategoryCounts(catCounts);

      // Priority breakdown
      setOverallPriorityCounts({
        High: complaints.filter(c => c.priority === 'High').length,
        Medium: complaints.filter(c => c.priority === 'Medium').length,
        Low: complaints.filter(c => c.priority === 'Low').length,
      });

      // Last 30 days trend
      const today = new Date();
      const days = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        days.push(d.toISOString().slice(0,10));
      }
      const daily = days.map(ds => ({
        date: ds,
        count: complaints.filter(c => {
          try { return c.createdAt && new Date(c.createdAt).toISOString().slice(0,10) === ds; } catch { return false; }
        }).length
      }));
      setOverallDailyCounts30Days(daily);

    } catch (err) {
      console.error('Fetch analytics failed', err);
      setError(err?.response?.data?.message || err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setShowGeneratingModal(true);
    setShowDownloadModal(false);
    setPdfBlob(null);
    try {
      const token = localStorage.getItem('ccms_token');
      const response = await axios.get(`${API_BASE_URL}/reports/admin-monthly`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      setPdfBlob(response.data);
      setShowGeneratingModal(false);
      setShowDownloadModal(true);
    } catch (e) {
      console.error('Admin report generation failed', e);
      setShowGeneratingModal(false);
    }
  };

  if (loading) return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Overall Analytics</h1>
      <div className="flex items-center justify-center py-12 text-gray-500">Loading analytics...</div>
    </div>
  );

  if (error) return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Overall Analytics</h1>
      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-800">{error}</div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Overall Analytics</h1>
          <p className="mt-2 text-gray-600">A visual overview of complaint trends, statistics and committee performance.</p>
        </div>
        <div>
          <button onClick={fetchAnalytics} className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm hover:bg-gray-50">Refresh</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <div className="p-6 bg-blue-50 rounded-xl">
          <h2 className="font-semibold text-lg">Total Complaints</h2>
          <p className="text-3xl font-bold text-blue-700 mt-2">{topStats.total}</p>
          <p className="text-sm text-gray-600 mt-1">{topStats.monthCount} in current month</p>
        </div>

        <div className="p-6 bg-green-50 rounded-xl">
          <h2 className="font-semibold text-lg">Resolved Complaints</h2>
          <p className="text-3xl font-bold text-green-700 mt-2">{topStats.resolved}</p>
          <p className="text-sm text-gray-600 mt-1">{topStats.total?`${Math.round((topStats.resolved/topStats.total)*100)}% resolution rate`:'—'}</p>
        </div>

        <div className="p-6 bg-yellow-50 rounded-xl">
          <h2 className="font-semibold text-lg">Avg. Resolution Time</h2>
          <p className="text-3xl font-bold text-yellow-700 mt-2">{topStats.avgResolutionDays} days</p>
        </div>

        <div className="p-6 bg-purple-50 rounded-xl">
          <h2 className="font-semibold text-lg">Pending Complaints</h2>
          <p className="text-3xl font-bold text-purple-700 mt-2">{topStats.pending}</p>
        </div>
      </div>

      {/* Overall Portal Analytics Graphs */}
      {overallCategoryCounts.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Overall Category Breakdown</h3>
            <div style={{ width: '100%', height: 330 }}>
              <ResponsiveContainer>
                {/* Custom shape overlays resolved over total */}
                <BarChart data={overallCategoryCounts}>
                  <XAxis dataKey="category" tick={{ fontSize: 10 }} angle={-90} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-2 border border-gray-300 rounded shadow-lg text-sm">
                            <p className="font-semibold">{data.category}</p>
                            <p className="text-blue-600">Total: {data.total}</p>
                            <p className="text-green-600">Resolved: {data.resolved}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="total"
                    shape={(props) => {
                      const { x, y, width, height, payload } = props;
                      const total = payload?.total || 0;
                      const resolved = payload?.resolved || 0;
                      const resolvedHeight = total > 0 ? height * (resolved / total) : 0;
                      return (
                        <g>
                          {/* Assigned/Total (blue) */}
                          <rect x={x} y={y} width={width} height={height} fill="#4F46E5" />
                          {/* Resolved overlay (green) */}
                          <rect x={x} y={y + (height - resolvedHeight)} width={width} height={resolvedHeight} fill="#10B981" />
                        </g>
                      );
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-2"><span style={{ width:12, height:12, background:'#4F46E5', borderRadius:2 }} /> Assigned</div>
              <div className="flex items-center gap-2"><span style={{ width:12, height:12, background:'#10B981', borderRadius:2 }} /> Resolved</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Overall Priority Breakdown</h3>
            <div className="flex items-center gap-4">
              <div style={{ width: '100%', height: 330 }} className="flex-1">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'High', value: overallPriorityCounts.High },
                        { name: 'Medium', value: overallPriorityCounts.Medium },
                        { name: 'Low', value: overallPriorityCounts.Low },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={120}
                      innerRadius={60}
                    >
                      <Cell fill="#DC2626" />
                      <Cell fill="#F59E0B" />
                      <Cell fill="#10B981" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-40">
                {[{label:'High',color:'#DC2626',value:overallPriorityCounts.High},{label:'Medium',color:'#F59E0B',value:overallPriorityCounts.Medium},{label:'Low',color:'#10B981',value:overallPriorityCounts.Low}]
                  .filter(i=>i.value>0)
                  .map(i => (
                    <div key={i.label} className="flex items-center gap-2">
                      <span style={{ width:12, height:12, background:i.color, borderRadius:4 }} />
                      <span className="text-sm text-gray-700">{i.label} :</span>
                      <span className="ml-auto font-bold">{i.value}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow md:col-span-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Overall Last 30 Days Trend</h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={overallDailyCounts30Days} margin={{ top:5, right:20, left:0, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize:11 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#4F46E5" dot={{ r:2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      

      <div className="mt-10">
        <h2 className="font-semibold text-lg text-gray-800 mb-3">Committee-wise Analytics</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="p-3 border">Committee</th>
                <th className="p-3 border">Total Complaints</th>
                <th className="p-3 border">Resolved</th>
                <th className="p-3 border">Pending</th>
                <th className="p-3 border">Resolution Rate</th>
                <th className="p-3 border">View Analytics</th>
              </tr>
            </thead>
            <tbody>
              {committeeStats.map((r) => (
                <tr key={r.committee}>
                  <td className="p-3 border">{r.committee}</td>
                  <td className="p-3 border">{r.total}</td>
                  <td className="p-3 border">{r.resolved}</td>
                  <td className="p-3 border">{r.pending}</td>
                  <td className="p-3 border">{r.resolutionRate}%</td>
                  <td className="p-3 border">
                      <Link
                        to={`/admin-dashboard/committee-analytics?ct=${encodeURIComponent(r.committeeKey)}`}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        View
                      </Link>
                  </td>
                </tr>
              ))}
              {committeeStats.length === 0 && (
                <tr>
                  <td className="p-3 border" colSpan={5}>No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Report Button */}
      <div className="mt-10 flex justify-center">
        <button onClick={handleGenerateReport} className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">
          Generate Report
        </button>
      </div>

      {showGeneratingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl text-center w-80">
            <div className="animate-spin h-8 w-8 mx-auto mb-3 border-4 border-blue-600 border-t-transparent rounded-full" />
            <p className="mt-2 text-gray-700 font-medium">Generating report...</p>
          </div>
        </div>
      )}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-80 text-center">
            <h2 className="text-xl font-semibold text-gray-900">Report Generated</h2>
            <p className="mt-2 text-gray-600">Your PDF report is ready.</p>
            <button
              onClick={() => {
                const url = window.URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
                const a = document.createElement('a');
                a.href = url;
                a.download = 'Admin_Report.pdf';
                a.click();
                window.URL.revokeObjectURL(url);
              }}
              className="mt-5 w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
            >
              Download Report
            </button>
            <button onClick={() => setShowDownloadModal(false)} className="mt-3 block w-full text-gray-600 hover:text-gray-800 text-sm font-medium">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Admin-only view for a single committee's analytics.
const AdminCommitteeAnalytics = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [metrics, setMetrics] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [complaintsList, setComplaintsList] = useState([]);

  // read committee type from query param `ct`
  let committeeType = null;
  try {
    const params = new URLSearchParams(location.search);
    committeeType = params.get('ct') || null;
  } catch (e) {
    committeeType = null;
  }

  const fetchMetrics = async () => {
    if (!committeeType) {
      setError('No committee selected');
      return;
    }
    const token = localStorage.getItem('ccms_token');
    if (!token) {
      setError('Missing auth token. Please login again.');
      return;
    }

    try {
      setLoading(true);
      setError("");
      const url = `${API_BASE_URL}/committee-analytics/${encodeURIComponent(committeeType)}`;
      const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });

      const normalized = {
        total: Number(data.total) || 0,
        resolved: Number(data.resolved) || 0,
        avgResolutionTimeDays: data.avgResolutionTimeDays == null ? 0 : Number(data.avgResolutionTimeDays),
        resolutionRate: data.resolutionRate == null ? 0 : Number(data.resolutionRate),
      };
      setMetrics(normalized);

      // normalize analytics data
      let subArr = [];
      if (data.subcategoryCounts && typeof data.subcategoryCounts === 'object' && !Array.isArray(data.subcategoryCounts)) {
        subArr = Object.keys(data.subcategoryCounts).map(k => ({ category: k, count: data.subcategoryCounts[k] }));
      } else if (Array.isArray(data.categoryCounts)) {
        subArr = data.categoryCounts;
      }

      setAnalyticsData({
        subcategoryCounts: subArr,
        subcategoryResolvedCounts: data.subcategoryResolvedCounts || {},
        priorityCounts: data.priorityCounts || { High: 0, Medium: 0, Low: 0 },
        statusCounts: data.statusCounts || { pending: 0, 'in-progress': 0, resolved: 0 },
        dailyCounts30Days: data.dailyCounts30Days || [],
      });
    } catch (err) {
      console.error('Admin committee analytics fetch failed', err);
      setError(err?.response?.data?.message || 'Failed to load committee analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaintsList = async () => {
    try {
      const token = localStorage.getItem('ccms_token');
      if (!token) return;
      const { data } = await axios.get(`${API_BASE_URL}/complaints/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaintsList(data.complaints || []);
    } catch (e) {
      console.warn('Failed to fetch complaints list for admin analytics:', e?.response?.data || e.message || e);
      setComplaintsList([]);
    }
  };

  useEffect(() => {
    if (!committeeType) return;
    fetchMetrics();
    fetchComplaintsList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committeeType]);

  const handleChartClick = (type, value) => {
    try {
      localStorage.setItem('analytics_filter', JSON.stringify({ type, value }));
      navigate('/admin-dashboard/all-complaints');
    } catch (e) {
      console.warn('Failed to apply chart filter', e);
    }
  };

  const formatDays = (d) => (d == null ? "—" : `${Number(d).toFixed(1)} days`);
  const formatPct = (p) => (p == null ? "—" : `${Number(p).toFixed(0)}%`);

  // Compute resolved counts per category from full complaints list
  const resolvedByCategory = React.useMemo(() => {
    const m = {};
    (complaintsList || []).forEach((c) => {
      const cat = (c.category || '').trim();
      if (!cat) return;
      if (c.status === 'resolved') {
        m[cat] = (m[cat] || 0) + 1;
      }
    });
    return m;
  }, [complaintsList]);

  const categoryOverlayData = React.useMemo(() => {
    const resolvedMap = analyticsData?.subcategoryResolvedCounts || {};
    const arr = (analyticsData?.subcategoryCounts || []).map((item) => ({
      category: item.category,
      total: item.count,
      resolved: resolvedMap[item.category] || 0,
    }));
    return arr;
  }, [analyticsData]);

  if (loading) return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold text-gray-800">{committeeType || 'Committee'} Analytics</h1>
      <div className="flex items-center justify-center py-12 text-gray-500">Loading analytics...</div>
    </div>
  );

  if (error) return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold text-gray-800">{committeeType || 'Committee'} Analytics</h1>
      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-800">{error}</div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{committeeType || 'Committee'} Analytics</h1>
          <p className="mt-2 text-gray-600">Overview of complaints handled by this committee.</p>
        </div>
        <div>
          <button onClick={fetchMetrics} className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm hover:bg-gray-50">Refresh</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <div className="p-6 rounded-lg shadow-lg border-l-8 bg-blue-50 border-blue-500">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-700">Total Complaints</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 mt-2">{metrics ? metrics.total : '—'}</p>
        </div>

        <div className="p-6 rounded-lg shadow-lg border-l-8 bg-green-50 border-green-500">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-green-700">Resolved</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 mt-2">{metrics ? metrics.resolved : '—'}</p>
        </div>

        <div className="p-6 rounded-lg shadow-lg border-l-8 bg-yellow-50 border-yellow-500">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-yellow-700">Avg. Resolution Time</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 mt-2">{metrics ? formatDays(metrics.avgResolutionTimeDays) : '—'}</p>
        </div>

        <div className="p-6 rounded-lg shadow-lg border-l-8 bg-purple-50 border-purple-500">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-purple-700">Resolution Rate</span>
          </div>
          <p className="text-3xl font-bold text-gray-800 mt-2">{metrics ? formatPct(metrics.resolutionRate) : '—'}</p>
        </div>
      </div>

      {analyticsData && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Category Breakdown</h3>
            <div style={{ width: '100%', height: 330 }}>
              <ResponsiveContainer>
                <BarChart data={categoryOverlayData.filter(d => d.total > 0)}>
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 10 }}

                    angle={-90}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-2 border border-gray-300 rounded shadow-lg text-sm">
                            <p className="font-semibold">{data.category}</p>
                            <p className="text-blue-600">Total: {data.total}</p>
                            <p className="text-green-600">Resolved: {data.resolved}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="total"
                    onClick={(data) => data && handleChartClick('category', data.payload?.category)}
                    shape={(props) => {
                      const { x, y, width, height, payload } = props;
                      const total = payload?.total || 0;
                      const resolved = payload?.resolved || 0;
                      const resolvedHeight = total > 0 ? height * (resolved / total) : 0;
                      return (
                        <g>
                          <rect x={x} y={y} width={width} height={height} fill="#4F46E5" />
                          <rect x={x} y={y + (height - resolvedHeight)} width={width} height={resolvedHeight} fill="#10B981" />
                        </g>
                      );
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-2"><span style={{ width:12, height:12, background:'#4F46E5', borderRadius:2 }} /> Assigned</div>
              <div className="flex items-center gap-2"><span style={{ width:12, height:12, background:'#10B981', borderRadius:2 }} /> Resolved</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Priority Breakdown</h3>
            <div className="flex items-center gap-4">
              <div style={{ width: '100%', height: 330 }} className="flex-1">
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
                      outerRadius={120}
                      innerRadius={60}
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
        </div>
      )}
    </div>
  );
};

const PriorityBadge = ({ priority }) => {
  let colors = "bg-gray-100 text-gray-800";
  if (priority === "High") colors = "bg-red-100 text-red-800";
  else if (priority === "Medium") colors = "bg-yellow-100 text-yellow-800";
  else if (priority === "Low") colors = "bg-green-100 text-green-800";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors}`}>
      {priority} Priority
    </span>
  );
};

const ComplaintCard = ({ complaint, onTakeAction, onView }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
    <div className="flex justify-between items-start mb-3">
      <h2 className="text-xl font-bold text-gray-800">{complaint.title}</h2>
      <PriorityBadge priority={complaint.priority} />
    </div>
    <p className="text-gray-600 mb-4">{complaint.description}</p>
    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
      <span className="text-gray-500">
        <strong>Committee:</strong> {complaint.committee}
      </span>
      <span className="text-gray-500">
        <strong>Type:</strong> {complaint.type}
      </span>
      <span className="text-gray-500">
        <strong>Anonymous:</strong> {complaint.anonymous}
      </span>
    </div>
    <div className="mt-4 pt-4 border-t border-gray-100">
      <button onClick={() => onTakeAction && onTakeAction(complaint)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
        Take Action
      </button>
      <button onClick={() => onView && onView(complaint)} className="ml-3 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm font-medium">
        View Details
      </button>
    </div>
  </div>
);

const GeneralComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusDescription, setStatusDescription] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchAdminComplaints = async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem('ccms_token');
        if (!token) {
          setError('Missing auth token. Please login again.');
          setLoading(false);
          return;
        }

        const { data } = await axios.get(`${API_BASE_URL}/complaints/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const all = data.complaints || [];

        // Filter complaints routed to Admin / General by the classifier
        const filtered = all.filter(c => {
          const cat = (c.category || '').toString().toLowerCase();
          // include categories that explicitly mention admin or general
          return cat.includes('admin') || cat === 'general' || cat.includes('general');
        });

        setComplaints(filtered);
      } catch (err) {
        console.error('Fetch admin/general complaints failed', err);
        setError(err?.response?.data?.message || err.message || 'Failed to fetch complaints');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminComplaints();
  }, []);

  if (loading) return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Other / General Complaints</h1>
      <div className="flex items-center justify-center py-12 text-gray-500">Loading complaints...</div>
    </div>
  );

  if (error) return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Other / General Complaints</h1>
      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-800">{error}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Other / General Complaints</h1>
      <p className="text-gray-600">
        A dedicated queue for general campus issues that fall under Admin jurisdiction.
      </p>

      <div className="space-y-5">
        {complaints.length === 0 ? (
          <div className="text-gray-500 text-center py-8">No admin-directed complaints found.</div>
        ) : (
          complaints.map((c) => (
            <ComplaintCard
              key={c._id}
              complaint={{
                _id: c._id,
                title: c.title,
                description: c.description,
                category: c.category || 'Admin',
                type: c.type === 'general' ? 'General' : 'Personal',
                anonymous: c.isAnonymous ? 'Yes' : 'No',
                priority: c.priority || 'Medium',
                status: c.status,
                userId: c.userId,
                createdAt: c.createdAt,
              }}
              onTakeAction={() => {
                setSelectedComplaint(c);
                setNewStatus(c.status || 'pending');
                setStatusDescription('');
                setShowStatusModal(true);
              }}
              onView={() => {
                setSelectedComplaint(c);
                setShowViewModal(true);
              }}
            />
          ))
        )}
      </div>
      {/* View Modal */}
      {showViewModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-3xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Complaint Details</h2>
                <p className="text-sm text-gray-600 mt-1">ID: {selectedComplaint._id ? `CC${selectedComplaint._id.slice(-6).toUpperCase()}` : 'N/A'}</p>
              </div>
              <div>
                <button onClick={() => { setShowViewModal(false); setSelectedComplaint(null); }} className="text-sm text-gray-600 hover:text-gray-800">Close</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Title</h3>
                <p className="text-gray-800 mb-3">{selectedComplaint.title}</p>

                <h3 className="text-sm font-semibold text-gray-700">Description</h3>
                <p className="text-gray-700 mb-3 whitespace-pre-line">{selectedComplaint.description}</p>

                <div className="flex flex-wrap gap-3 mt-2">
                  <div className="text-sm text-gray-600 flex items-center gap-2"><strong>Status:</strong><span className="">{selectedComplaint.status}</span></div>
                  <div className="text-sm text-gray-600"><strong>Priority:</strong> {selectedComplaint.priority || 'N/A'}</div>
                  <div className="text-sm text-gray-600"><strong>Committee:</strong> {selectedComplaint.category || 'N/A'}</div>
                  <div className="text-sm text-gray-600"><strong>Filed By:</strong> {selectedComplaint.userId?.name || 'Anonymous'}</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700">Attachments</h3>
                <div className="mt-2 space-y-3">
                  <p className="text-gray-500">No attachments available in this view.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Update Complaint Status</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2"><strong>Complaint:</strong> {selectedComplaint.title}</p>
              <p className="text-sm text-gray-600"><strong>ID:</strong> {selectedComplaint._id ? `CC${selectedComplaint._id.slice(-6).toUpperCase()}` : ''}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">New Status</label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Required)</label>
              <textarea value={statusDescription} onChange={(e) => setStatusDescription(e.target.value)} placeholder="e.g., Assigned to maintenance team, expected resolution in 2 hours." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" rows="3" />
            </div>

            <div className="flex gap-3">
              <button onClick={async () => {
                if (!newStatus || !statusDescription.trim()) return;
                try {
                  setUpdating(true);
                  const token = localStorage.getItem('ccms_token');
                  await axios.patch(`${API_BASE_URL}/complaints/${selectedComplaint._id}/status`, { status: newStatus, description: statusDescription.trim() }, { headers: { Authorization: `Bearer ${token}` } });
                  const { data } = await axios.get(`${API_BASE_URL}/complaints/all`, { headers: { Authorization: `Bearer ${localStorage.getItem('ccms_token')}` } });
                  setComplaints(data.complaints || []);
                  setShowStatusModal(false);
                  setSelectedComplaint(null);
                } catch (err) {
                  console.error('Update Status Error:', err);
                } finally {
                  setUpdating(false);
                }
              }} disabled={updating} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">{updating ? 'Updating...' : 'Update'}</button>
              <button onClick={() => { setShowStatusModal(false); setSelectedComplaint(null); setNewStatus(''); setStatusDescription(''); }} disabled={updating} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isHomeRoute =
    location.pathname === "/admin-dashboard" ||
    location.pathname === "/admin-dashboard/";
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
  const profileInitial = currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A';
  const profileName = currentUser?.name ? currentUser.name : 'Admin';

  const handleLogout = () => {
    // remove jwt token from local storage
    localStorage.removeItem("ccms_token");
    localStorage.removeItem("ccms_user");
    localStorage.removeItem("role");
    navigate("/login", { replace: true });
  };

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
    } catch (error) {
      console.error("Admin notifications fetch error", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

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

      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Admin mark as read error", error);
    }
  };

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

      setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Admin mark all read error", error);
    }
  };

  const dismissNotification = async (notificationId, isRead) => {
    try {
      const token = localStorage.getItem("ccms_token");
      if (!token) return;

      const { data } = await axios.delete(`${API_BASE_URL}/notifications/${notificationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setNotifications((prev) => prev.filter((notification) => notification._id !== notificationId));
      if (!isRead) {
        if (typeof data?.unreadCount === "number") {
          setUnreadCount(data.unreadCount);
        } else {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error("Admin delete notification error", error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification) return;
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    const complaintId = notification?.complaint?._id || notification?.complaint;
    if (complaintId) {
      navigate(`/admin-dashboard/all-complaints?complaintId=${complaintId}`);
    } else {
      navigate(`/admin-dashboard/all-complaints`);
    }
    setNotificationDropdownOpen(false);
  };

  const handleNotificationDelete = (notification) => {
    if (!notification) return;
    dismissNotification(notification._id, notification.isRead);
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

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        portalLabel="Admin Portal"
        logoInitials="CCR"
        logoRoute="/admin-dashboard"
        navItems={adminSidebarNavItems}
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
          onMarkAllRead={markAllAsRead}
          onNotificationClick={handleNotificationClick}
          onNotificationDelete={handleNotificationDelete}
          notificationDropdownOpen={notificationDropdownOpen}
          notificationDropdownRef={notificationRef}
          notificationButtonRef={notificationButtonRef}
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
          dropdownRef={dropdownRef}
          profileRoute="/admin-dashboard/profile"
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
          menuButtonTestId={adminNavbarTestIds.menuButton}
          testIds={adminNavbarTestIds}
        />

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<AdminDashboardHome />} />
            <Route path="all-complaints" element={<AllComplaintsPage />} />
            <Route path="general-complaints" element={<GeneralComplaintsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="committee-analytics" element={<AdminCommitteeAnalytics />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="create-account" element={<CreateAccountPage />} />
            <Route path="*" element={<Navigate to="/admin-dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}