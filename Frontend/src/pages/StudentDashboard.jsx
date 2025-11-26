import React, { useState, useRef, useEffect, useMemo } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaBell,
  FaPlus,
  FaTrash,
  FaTimes,
  FaHome,
  FaPlusCircle,
  FaListAlt,
  FaListUl,
} from "react-icons/fa";
import axios from "axios";
import API_BASE_URL from "../config/api.js";

import DashboardSidebar from "../components/DashboardSidebar";
import DashboardNavbar from "../components/DashboardNavbar";
import DashboardHome from "./DashboardHome";
import ProfilePage from "./ProfilePage";
import ComplaintsTable from "../components/ComplaintsTable";

import AddComplaintPage from "./AddComplaintPage"; 
import useBackLogoutGuard from "../hooks/useBackLogoutGuard";

const studentSidebarTestIds = {
  container: "sidebar-container",
  logoButton: "sidebar-logo-button",
  logoMark: "sidebar-ccr-logo",
  portalLabel: "sidebar-portal-label",
  nav: "sidebar-nav-menu",
};

const studentSidebarNavItems = [
  {
    to: "/student-dashboard",
    label: "Home",
    icon: <FaHome size={18} />,
    testId: "sidebar-home-link",
  },
  {
    to: "/student-dashboard/add-complaint",
    label: "Add New Complaint",
    icon: <FaPlusCircle size={18} />,
    testId: "sidebar-add-complaint-link",
  },
  {
    to: "/student-dashboard/my-complaints",
    label: "My Complaints",
    icon: <FaListAlt size={18} />,
    testId: "sidebar-my-complaints-link",
  },
  {
    to: "/student-dashboard/all-complaints",
    label: "All Complaints",
    icon: <FaListUl size={18} />,
    testId: "sidebar-all-complaints-link",
  },
];

const studentNavbarTestIds = {
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
  menuButton: "sidebar-menu-button",
};

const DeleteConfirmationModal = ({
  isOpen,
  title = "Delete Complaint",
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 transition hover:text-gray-600"
            aria-label="Close delete confirmation"
          >
            <FaTimes />
          </button>
        </div>
        <p className="mb-6 text-sm text-gray-600">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
              loading ? "bg-red-300" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {loading ? "Deleting..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const MyComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [upvoting, setUpvoting] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "descending" }); 
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    status: [], 
    committee: [], 
    priority: [], 
  });
  const [tempFilters, setTempFilters] = useState(filters);
  const [searchTerm, setSearchTerm] = useState(""); 

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  // ------------------------

  const currentUserId = useMemo(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("ccms_user"));
      return stored?._id || null;
    } catch (err) {
      return null;
    }
  }, []);

  const resolveIdString = (value) => {
    if (!value) return null;
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      if (value._id) return value._id.toString();
      if (value.id) return value.id.toString();
    }
    return value.toString ? value.toString() : null;
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // --- PAGINATION RESET ---
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, sortConfig]);
  // ------------------------

  useEffect(() => {
    if (!actionMessage) {
      return;
    }
    const timeout = setTimeout(() => setActionMessage(""), 4000);
    return () => clearTimeout(timeout);
  }, [actionMessage]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError("");
      setActionError("");
      
      const token = localStorage.getItem("ccms_token");
      if (!token) {
        setError("You are not logged in. Please login again.");
        setLoading(false);
        return;
      }

      const { data } = await axios.get(
        `${API_BASE_URL}/complaints/my-complaints`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const normalizedComplaints = (data.complaints || []).map((complaint) => {
        const upvotesArray = Array.isArray(complaint?.upvotes)
          ? complaint.upvotes
          : [];
        const upvoteCount = complaint?.upvoteCount ?? upvotesArray.length;
        const hasUpvoted = currentUserId
          ? upvotesArray.some(
              (upvoteId) => resolveIdString(upvoteId) === currentUserId
            )
          : false;

        return {
          ...complaint,
          upvoteCount,
          hasUpvoted,
        };
      });

      setComplaints(normalizedComplaints);
    } catch (err) {
      console.error("Fetch Complaints Error:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to fetch complaints. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (complaintId) => {
    const target = complaints.find((complaint) => complaint?._id === complaintId) || null;
    setDeleteTarget(target);
    setActionError("");
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const handleUpvote = async (complaintId) => {
    if (!complaintId) return;

    try {
      setUpvoting((prev) => ({ ...prev, [complaintId]: true }));

      const token = localStorage.getItem("ccms_token");
      if (!token) {
        setActionError("You are not logged in. Please login again.");
        return;
      }

      const { data } = await axios.post(
        `${API_BASE_URL}/complaints/${complaintId}/upvote`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setComplaints((prevComplaints) =>
        prevComplaints.map((complaint) =>
          complaint._id === complaintId
            ? {
                ...complaint,
                upvoteCount: data.upvoteCount,
                hasUpvoted: data.hasUpvoted,
              }
            : complaint
        )
      );
    } catch (err) {
      console.error("Upvote Complaint Error:", err);
      const message =
        err?.response?.data?.message ||
        "Failed to upvote the complaint. Please try again.";
      setActionError(message);
    } finally {
      setUpvoting((prev) => ({ ...prev, [complaintId]: false }));
    }
  };

  const handleDelete = async () => {
    const complaintId = deleteTarget?._id;
    if (!complaintId) {
      closeDeleteModal();
      return;
    }

    const token = localStorage.getItem("ccms_token");
    if (!token) {
      setActionError("You are not logged in. Please login again.");
      return;
    }

    try {
      setDeletingId(complaintId);
      setActionError("");
      await axios.delete(`${API_BASE_URL}/complaints/${complaintId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setComplaints((prevComplaints) =>
        prevComplaints.filter((complaint) => complaint._id !== complaintId)
      );
      setActionMessage("Complaint deleted successfully.");
      closeDeleteModal();
    } catch (err) {
      console.error("Delete Complaint Error:", err);
      setActionMessage("");
      setActionError(
        err?.response?.data?.message ||
          "Failed to delete the complaint. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };
  
  // --- DYNAMIC SORTING, FILTERING, AND SEARCH LOGIC ---
  const sortComplaints = (key, newDirection) => {
    setSortConfig({ key, direction: newDirection });
  };

  const getComplaintId = (id) => {
    if (!id) return "N/A";
    return `CC${id.slice(-6).toUpperCase()}`;
  };

  const sortedAndFilteredComplaints = useMemo(() => {
    let processableComplaints = [...complaints];

    // 1. Search Filtering
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase().trim();
      const searchWords = lowerCaseSearch.split(/\s+/).filter(word => word.length > 0);
      
      processableComplaints = processableComplaints.filter(c => {
        if (!c) return false;
        
        const title = (c.title || "").toLowerCase();
        const category = (c.category || "").toLowerCase();
        const complaintId = getComplaintId(c._id).toLowerCase();
        
        return (
          title.includes(lowerCaseSearch) ||
          category.includes(lowerCaseSearch) ||
          complaintId.includes(lowerCaseSearch)
        );
      });
    }

    // 2. Filter Modal Filtering
    if (filters.status.length > 0) {
      processableComplaints = processableComplaints.filter(c => c && filters.status.includes(c.status));
    }
    if (filters.committee.length > 0) {
      processableComplaints = processableComplaints.filter(c => c && filters.committee.includes(c.category));
    }
    if (filters.priority.length > 0) {
      processableComplaints = processableComplaints.filter(c => c && filters.priority.includes(c.priority));
    }

    // 3. Sorting
    if (sortConfig && sortConfig.key) {
      processableComplaints.sort((a, b) => {
        if (!a) return sortConfig.direction === "ascending" ? 1 : -1;
        if (!b) return sortConfig.direction === "ascending" ? -1 : 1;
        
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Custom logic for Priority
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

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">My Complaints</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading complaints...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">My Complaints</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchComplaints}
            className="mt-2 text-sm text-red-600 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">My Complaints</h1>
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
                (filters.status.length > 0 || filters.committee.length > 0 || filters.priority.length > 0)
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd"></path>
              </svg>
              { (filters.status.length > 0 || filters.committee.length > 0 || filters.priority.length > 0) && (
                <span className={`text-xs font-bold ${ (filters.status.length > 0 || filters.priority.length > 0) ? 'text-white' : 'text-blue-600'}`}>
                  ({filters.status.length + filters.committee.length + filters.priority.length})
                </span>
              )}
            </button>

            <button
              onClick={fetchComplaints}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium px-2 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 touch-manipulation"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {actionMessage}
        </div>
      )}

      {actionError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {actionError}
        </div>
      )}

      {sortedAndFilteredComplaints.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">
            You haven't filed any complaints yet, or none match your filters.
          </p>
          <Link
            to="/student-dashboard/add-complaint"
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaPlus />
            File a New Complaint
          </Link>
        </div>
      ) : (
        <>
          <ComplaintsTable
            complaints={currentItems}
            config={{
              showId: true,
              showTitle: true,
              showCommittee: true,
              showStatus: true,
              showDate: true,
              showUpvotes: true,
              showActions: true,
              actionType: "view-delete",
              onDelete: openDeleteModal,
              onUpvote: handleUpvote,
              upvoting: upvoting,
              deletingId: deletingId,
              viewLinkBase: "/student-dashboard/complaint",
              emptyMessage: "You haven't filed any complaints yet, or none match your filters.",
              canDeleteComplaint: (complaint) => complaint?.status === "pending",
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
          {/* ------------------------------------------- */}
        </>
      )}
      
      {/* FILTER MODAL */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">
              Filter My Complaints
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
              
              {/* FILTER BY PRIORITY */}
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

              {/* Filter by Committee/Category */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Committee
                </h3>
                <div className="flex flex-wrap gap-4">
                  {[...new Set(complaints.map(c => c.category).filter(c => c))]
                    .filter(category => category !== "Canteen") 
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

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Complaint"
        message={`Are you sure you want to delete "${deleteTarget?.title || "this complaint"}"? This action cannot be undone.`}
        onCancel={closeDeleteModal}
        onConfirm={handleDelete}
        loading={Boolean(deletingId && deleteTarget && deletingId === deleteTarget._id)}
      />
    </div>
  );
};

// Complaint Detail Page with Status History
const ComplaintDetailPage = () => {
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const navigate = useNavigate();

  // Get complaint ID from URL
  const complaintId = window.location.pathname.split('/').pop();

  const currentUserId = useMemo(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("ccms_user"));
      return stored?._id || null;
    } catch (err) {
      return null;
    }
  }, []);

  const isOwner = useMemo(() => {
    if (!complaint || !currentUserId) return false;
    const complaintUserId = typeof complaint.userId === "string"
      ? complaint.userId
      : complaint.userId?._id || complaint.userId?.id || "";
    return complaintUserId && complaintUserId.toString() === currentUserId;
  }, [complaint, currentUserId]);

  useEffect(() => {
    fetchComplaintDetails();
  }, [complaintId]);

  const fetchComplaintDetails = async () => {
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
        `${API_BASE_URL}/complaints/${complaintId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setComplaint(data.complaint);
    } catch (err) {
      console.error("Fetch Complaint Details Error:", err);
      if (err?.response?.status === 404) {
        setError(
          err?.response?.data?.message ||
            "This complaint either does not exist or you do not have access to view it."
        );
      } else {
        setError(
          err?.response?.data?.message ||
            "Failed to fetch complaint details. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!complaint?._id) {
      setShowDeleteModal(false);
      return;
    }

    if (complaint?.status !== "pending") {
      setError("Only pending complaints can be deleted.");
      setShowDeleteModal(false);
      return;
    }

    if (!isOwner) {
      setError("You can only delete complaints that you created.");
      setShowDeleteModal(false);
      return;
    }

    const token = localStorage.getItem("ccms_token");
    if (!token) {
      setError("You are not logged in. Please login again.");
      return;
    }

    try {
      setDeleting(true);
      await axios.delete(`${API_BASE_URL}/complaints/${complaintId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setShowDeleteModal(false);
      navigate("/student-dashboard/my-complaints", { replace: true });
    } catch (err) {
      console.error("Delete Complaint Error:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to delete the complaint. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: "bg-yellow-100 text-yellow-800",
      "in-progress": "bg-blue-100 text-blue-800",
      resolved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getComplaintId = (id) => {
    if (!id) return "N/A";
    return `CC${id.slice(-6).toUpperCase()}`;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Complaint Details</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading complaint details...</div>
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Complaint Details</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || "Complaint not found"}</p>
          <button
            onClick={() => navigate("/student-dashboard/all-complaints")}
            className="mt-2 text-sm text-red-600 hover:underline"
          >
            Back to All Complaints
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Complaint Details</h1>
            <p className="text-sm text-gray-600 mt-1">
              ID: {getComplaintId(complaint._id)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/student-dashboard/all-complaints")}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to All Complaints
            </button>
            {complaint.status === "pending" && isOwner && (
              <button
                onClick={() => {
                  setError("");
                  setShowDeleteModal(true);
                }}
                disabled={deleting}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  deleting
                    ? "bg-red-300 text-white cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                <FaTrash size={14} />
                {deleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
        </div>

        {/* Complaint Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-600 font-semibold">Title</p>
            <p className="text-gray-800">{complaint.title}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold">Status</p>
            <div className="mt-1">{getStatusBadge(complaint.status)}</div>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold">Committee</p>
            <p className="text-gray-800">{complaint.category}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold">Filed On</p>
            <p className="text-gray-800">{formatDate(complaint.createdAt)}</p>
          </div>
          {complaint.location && (
            <div>
              <p className="text-sm text-gray-600 font-semibold">Location</p>
              <p className="text-gray-800">{complaint.location}</p>
            </div>
          )}
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 font-semibold mb-2">Description</p>
          <p className="text-gray-800 whitespace-pre-wrap">{complaint.description}</p>
        </div>
      </div>

      {/* Status History */}
      {complaint.statusHistory && complaint.statusHistory.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Status Updates</h2>
          <div className="space-y-4">
            {complaint.statusHistory.map((history, index) => (
              <div
                key={index}
                className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  {getStatusBadge(history.status)}
                  <span className="text-sm text-gray-600">
                    {formatDate(history.updatedAt)}
                  </span>
                </div>
                {history.description && (
                  <p className="text-gray-700 text-sm">{history.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show message if no status updates yet */}
      {(!complaint.statusHistory || complaint.statusHistory.length === 0) && (
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Status Updates</h2>
          <p className="text-gray-500 text-center py-8">
            No status updates yet. You will be notified when there are updates on your complaint.
          </p>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Complaint"
        message={`Are you sure you want to delete "${complaint?.title || "this complaint"}"? This action cannot be undone.`}
        onCancel={() => {
          if (!deleting) {
            setShowDeleteModal(false);
          }
        }}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
};

const AllComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [upvoting, setUpvoting] = useState({}); 
  const [sortConfig, setSortConfig] = useState({ key: "upvoteCount", direction: "descending" }); 
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    status: [], 
    committee: [], 
    priority: [],
  });
  const [tempFilters, setTempFilters] = useState(filters);
  const [searchTerm, setSearchTerm] = useState(""); 
  
  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  // ------------------------

  useEffect(() => {
    fetchPublicComplaints();
  }, []);

  // --- PAGINATION RESET ---
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, sortConfig]);
  // ------------------------

  const fetchPublicComplaints = async () => {
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
        `${API_BASE_URL}/complaints/public`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Initial sort by upvote count after fetch
      const sortedData = (data.complaints || []).sort((a, b) => {
        const aUpvotes = a.upvoteCount || a.upvotes?.length || 0;
        const bUpvotes = b.upvoteCount || b.upvotes?.length || 0;
        return bUpvotes - aUpvotes; 
      });

      setComplaints(sortedData);
    } catch (err) {
      console.error("Fetch Public Complaints Error:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to fetch public complaints. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (complaintId) => {
    try {
      setUpvoting({ ...upvoting, [complaintId]: true });
      
      const token = localStorage.getItem("ccms_token");
      if (!token) {
        setError("You are not logged in. Please login again.");
        return;
      }

      const { data } = await axios.post(
        `${API_BASE_URL}/complaints/${complaintId}/upvote`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Update the complaint in the list
      setComplaints((prevComplaints) => {
        const updatedComplaints = prevComplaints.map((complaint) => {
          if (complaint._id === complaintId) {
            return {
              ...complaint,
              upvoteCount: data.upvoteCount,
              hasUpvoted: data.hasUpvoted,
              
            };
          }
          return complaint;
        });

        // Re-sort complaints by upvote count (maintaining sorting preference)
        const sorted = [...updatedComplaints]
          .sort((a, b) => {
          const aUpvotes = a.upvoteCount || a.upvotes?.length || 0;
          const bUpvotes = b.upvoteCount || b.upvotes?.length || 0;
          
          // Use default sorting (UpvoteCount > Date) when upvoting/unupvoting
          if (bUpvotes !== aUpvotes) {
            return bUpvotes - aUpvotes;
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        return sorted;
      });
      
    } catch (err) {
      console.error("Upvote Error:", err);
      const errorMsg = err?.response?.data?.message || "Failed to upvote complaint. Please try again.";
      alert(errorMsg);
    } finally {
      setUpvoting((prev) => ({ ...prev, [complaintId]: false }));
    }
  };

  // --- DYNAMIC SORTING, FILTERING, AND SEARCH LOGIC ---
  const sortComplaints = (key, newDirection) => {
    setSortConfig({ key, direction: newDirection });
  };

  const getComplaintId = (id) => {
    if (!id) return "";
    return `CC${id.slice(-6).toUpperCase()}`;
  };

  const sortedAndFilteredComplaints = useMemo(() => {
    let processableComplaints = [...complaints];

    // 1. Search Filtering (Robust Name Matching)
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase().trim();
      const searchWords = lowerCaseSearch.split(/\s+/).filter(word => word.length > 0);

      processableComplaints = processableComplaints.filter(c => {
        if (!c) return false;
        
        // Fields for direct substring search
        const title = (c.title || "").toLowerCase();
        const category = (c.category || "").toLowerCase();
        const complaintId = getComplaintId(c._id).toLowerCase();
        const userName = (c.userId?.name || "").toLowerCase();
        
        // Check for direct substring match
        const directMatch = 
          title.includes(lowerCaseSearch) ||
          category.includes(lowerCaseSearch) ||
          complaintId.includes(lowerCaseSearch);

        if (directMatch) return true;
        
        // Check for flexible word match for User Name
        if (searchWords.length > 0) {
            const wordMatch = searchWords.every(word => userName.includes(word));
            if (wordMatch) return true;
        }

        return false;
      });
    }

    // 2. Filter Modal Filtering
    if (filters.status.length > 0) {
      processableComplaints = processableComplaints.filter(c => c && filters.status.includes(c.status));
    }
    if (filters.committee.length > 0) {
      processableComplaints = processableComplaints.filter(c => c && filters.committee.includes(c.category));
    }
    if (filters.priority.length > 0) {
      processableComplaints = processableComplaints.filter(c => c && filters.priority.includes(c.priority));
    }

    // 3. Sorting
    if (sortConfig && sortConfig.key) {
      processableComplaints.sort((a, b) => {
        if (!a) return sortConfig.direction === "ascending" ? 1 : -1;
        if (!b) return sortConfig.direction === "ascending" ? -1 : 1;
        
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (sortConfig.key === "upvoteCount") {
            aVal = a.upvoteCount || a.upvotes?.length || 0;
            bVal = b.upvoteCount || b.upvotes?.length || 0;
        }

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
        
        // Fallback sort by Date Created
        return new Date(b.createdAt) - new Date(a.createdAt);
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

  // --- FILTER MODAL HANDLERS ---
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
    const defaultFilters = { status: [], committee: [],priority: [] };
    setFilters(defaultFilters);
    setTempFilters(defaultFilters);
    setShowFilterModal(false);
  };
  
  // --- HELPER FUNCTIONS ---
  const getSortLabel = () => {
    if (!sortConfig) return "Sort By";
    
    if (sortConfig.key === "upvoteCount" && sortConfig.direction === "descending") {
        return "Popularity: High ↓";
    }
    if (sortConfig.key === "upvoteCount" && sortConfig.direction === "ascending") {
        return "Popularity: Low ↑";
    }
    if (sortConfig.key === "priority" && sortConfig.direction === "descending") {
        return "Priority: High ↓";
    }
    if (sortConfig.key === "priority" && sortConfig.direction === "ascending") {
        return "Priority: Low ↑";
    }
    if (sortConfig.key === "createdAt" && sortConfig.direction === "descending") {
        return "Date: Newest ↓";
    }
    if (sortConfig.key === "createdAt" && sortConfig.direction === "ascending") {
        return "Date: Oldest ↑";
    }

    return "Sort By";
  };

  // --- RENDERING BLOCK (Loading/Error) ---
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">All Complaints</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading public complaints...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">All Complaints</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchPublicComplaints}
            className="mt-2 text-sm text-red-600 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN RENDER ---
  return (
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
                className="w-full xs:w-auto px-3 xs:px-6 py-1.5 border border-gray-300 rounded-lg text-sm bg-white shadow-sm appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer touch-manipulation"
              >
                <option value="" className="text-gray-500">{getSortLabel()}</option>
                <option value="upvoteCount-descending">Popularity: High to Low</option>
                <option value="upvoteCount-ascending">Popularity: Low to High</option>
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
                (filters.status.length > 0 || filters.committee.length > 0)
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd"></path>
              </svg>
              { (filters.status.length > 0 || filters.committee.length > 0) && (
                <span className={`text-xs font-bold ${ (filters.status.length > 0 || filters.committee.length > 0) ? 'text-white' : 'text-blue-600'}`}>
                  ({filters.status.length + filters.committee.length})
                </span>
              )}
            </button>

            <button
              onClick={fetchPublicComplaints}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium px-2 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 touch-manipulation"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {sortedAndFilteredComplaints.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">
            No public complaints found matching current criteria.
          </p>
          <Link
            to="/student-dashboard/add-complaint"
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaPlus />
            File a New Complaint
          </Link>
        </div>
      ) : (
        <>
          <ComplaintsTable
            complaints={currentItems}
            config={{
              showId: true,
              showTitle: true,
              showCommittee: true,
              showStatus: true,
              showDate: true,
              showUpvotes: true,
              showActions: true,
              actionType: "view-only",
              viewLinkBase: "/student-dashboard/complaint",
              onUpvote: handleUpvote,
              upvoting: upvoting,
              emptyMessage: "No public complaints found matching current criteria.",
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
          {/* ------------------------------------------- */}
        </>
      )}

      {/* FILTER MODAL */}
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

              {/* Filter by Committee/Category */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Committee
                </h3>
                <div className="flex flex-wrap gap-4">
                  {[...new Set(complaints.map(c => c.category).filter(c => c))]
                    .filter(category => category !== "Canteen") 
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
  );
};

export default function StudentDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const isHomeRoute =
    location.pathname === "/student-dashboard" ||
    location.pathname === "/student-dashboard/";

  const clearAllNotifications = async () => {
    try {
      const token = localStorage.getItem("ccms_token");
      if (!token) return;

      const ids = (notifications || []).map((n) => n._id).filter(Boolean);
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

  // load logged-in user (stored at login) and derive display values
  let _storedUser = null;
  try {
    _storedUser = JSON.parse(localStorage.getItem("ccms_user"));
  } catch (e) {
    _storedUser = null;
  }
  const profileName = (_storedUser && _storedUser.name) || "Name";
  const profileInitial = profileName ? profileName.charAt(0).toUpperCase() : "N";

  const handleLogout = () => {
    // Clear all authentication data from localStorage
    localStorage.removeItem("ccms_token");
    localStorage.removeItem("ccms_user");
    
    // Navigate to login and replace history to prevent back button access
    navigate("/login", { replace: true });
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const token = localStorage.getItem("ccms_token");
      if (!token) return;

      const { data } = await axios.get(
        `${API_BASE_URL}/notifications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Fetch Notifications Error:", err);
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
      console.error("Mark Notification Read Error:", err);
    }
  };

  // Mark all notifications as read
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
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Mark All Notifications Read Error:", err);
    }
  };

  // Dismiss notification
  const dismissNotification = async (notificationId, isRead) => {
    try {
      const token = localStorage.getItem("ccms_token");
      if (!token) return;

      const { data } = await axios.delete(
        `${API_BASE_URL}/notifications/${notificationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setNotifications((prev) => prev.filter((notif) => notif._id !== notificationId));

      if (!isRead) {
        if (typeof data?.unreadCount === "number") {
          setUnreadCount(data.unreadCount);
        } else {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error("Delete Notification Error:", err);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification) return;
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    if (notification.complaint) {
      navigate(`/student-dashboard/complaint/${notification.complaint._id}`);
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

  // Fetch notifications on mount and set up polling
  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Handle click outside for profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef, notificationRef]);

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
    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        closeSidebar();
      }
    };

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
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

  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const notificationButtonRef = useRef(null);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar
        portalLabel="Student Portal"
        logoInitials="CCR"
        logoRoute="/student-dashboard"
        navItems={studentSidebarNavItems}
        testIds={studentSidebarTestIds}
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
          onClearAllNotifications={clearAllNotifications}
          onNotificationClick={handleNotificationClick}
          onNotificationDelete={handleNotificationDelete}
          notificationDropdownOpen={notificationDropdownOpen}
          notificationDropdownRef={notificationRef}
          notificationButtonRef={notificationButtonRef}
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
          dropdownRef={dropdownRef}
          profileRoute="/student-dashboard/profile"
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
          menuButtonTestId={studentNavbarTestIds.menuButton}
          testIds={studentNavbarTestIds}
        />

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8" data-testid="dashboard-main-content">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="add-complaint" element={<AddComplaintPage />} />
            <Route path="my-complaints" element={<MyComplaintsPage />} />
            <Route path="complaint/:id" element={<ComplaintDetailPage />} />
            <Route path="all-complaints" element={<AllComplaintsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}