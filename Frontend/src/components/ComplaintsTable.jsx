import React from "react";
import { Link } from "react-router-dom";
import { FaThumbsUp, FaEye, FaTrash } from "react-icons/fa";

// Helper functions
const getComplaintId = (id) => {
  if (!id) return "N/A";
  return `CC${id.slice(-6).toUpperCase()}`;
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

const getStatusBadge = (status) => {
  const statusStyles = {
    pending: "bg-yellow-100 text-yellow-800",
    "in-progress": "bg-blue-100 text-blue-800",
    resolved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  if (!status)
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800`}>
        N/A
      </span>
    );

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

const getPriorityBadge = (priority) => {
  const priorityStyles = {
    High: "bg-red-100 text-red-800",
    Medium: "bg-yellow-100 text-yellow-800",
    Low: "bg-green-100 text-green-800",
  };

  if (!priority)
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800`}>
        N/A
      </span>
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

const getUserName = (userId) => {
  if (!userId) return "Unknown";
  return userId.name || "Unknown";
};

/**
 * ComplaintsTable - A reusable component for displaying complaints in a table format
 * 
 * @param {Array} complaints - Array of complaint objects
 * @param {Object} config - Configuration object with the following properties:
 *   - showId: boolean - Show complaint ID column
 *   - showTitle: boolean - Show title column
 *   - showCommittee: boolean - Show committee/category column
 *   - showStatus: boolean - Show status column
 *   - showPriority: boolean - Show priority column
 *   - showDate: boolean - Show date column
 *   - showUpvotes: boolean - Show upvotes column with upvote button
 *   - showFiledBy: boolean - Show filed by (user name) column
 *   - showActions: boolean - Show actions column
 *   - actionType: string - Type of actions: 'view-delete', 'view-only', 'admin-actions', 'committee-actions', 'upvote-only'
 *   - onUpvote: function - Callback for upvote action (complaintId) => {}
 *   - onDelete: function - Callback for delete action (complaintId) => {}
 *   - onView: function - Callback for view action (complaint) => {}
 *   - onUpdateStatus: function - Callback for update status action (complaint) => {}
 *   - upvoting: object - Object tracking upvoting state { [complaintId]: boolean }
 *   - deletingId: string - ID of complaint being deleted
 *   - viewLinkBase: string - Base path for view links (e.g., '/student-dashboard/complaint')
 *   - emptyMessage: string - Message to show when no complaints
 *   - canDeleteComplaint: function - Predicate that controls when delete action is visible
 */
const ComplaintsTable = ({
  complaints = [],
  config = {},
}) => {
  const {
    showId = true,
    showTitle = true,
    showCommittee = false,
    showStatus = true,
    showPriority = false,
    showDate = true,
    showUpvotes = false,
    showFiledBy = false,
    showActions = false,
    actionType = "view-only",
    onUpvote,
    onDelete,
    onView,
    onUpdateStatus,
    upvoting = {},
    deletingId = null,
    viewLinkBase = "",
    emptyMessage = "No complaints found.",
    canDeleteComplaint = () => true,
  } = config;

  if (complaints.length === 0) {
    return (
      <div className="text-center py-12">
        {typeof emptyMessage === "string" ? (
          <p className="text-gray-500 text-lg">{emptyMessage}</p>
        ) : (
          <div className="text-gray-500 text-lg">{emptyMessage}</div>
        )}
      </div>
    );
  }

  const renderViewButton = (complaint) => {
    if (!viewLinkBase) return null;
    return (
      <Link
        to={`${viewLinkBase}/${complaint?._id}`}
        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm"
      >
        <FaEye />
        View
      </Link>
    );
  };

  const renderActions = (complaint) => {
    if (!showActions) return null;

    switch (actionType) {
      case "view-delete":
        return (
          <div className="flex flex-wrap items-center gap-3">
            {renderViewButton(complaint)}
            {onDelete && canDeleteComplaint(complaint) && (
              <button
                onClick={() => complaint && onDelete(complaint._id)}
                disabled={deletingId === complaint?._id}
                className={`inline-flex items-center gap-1 text-sm font-medium transition-colors ${
                  deletingId === complaint?._id
                    ? "text-red-400 cursor-not-allowed"
                    : "text-red-600 hover:text-red-800"
                }`}
              >
                <FaTrash />
                {deletingId === complaint?._id ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
        );

      case "view-only":
        return renderViewButton(complaint);

      case "admin-actions":
        return (
          <div className="flex gap-2">
            {onUpdateStatus && (
              <button
                onClick={() => complaint && onUpdateStatus(complaint)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Update Status
              </button>
            )}
            {onView && (
              <button
                onClick={() => complaint && onView(complaint)}
                className="px-3 py-1 bg-white border border-gray-200 text-blue-600 text-sm rounded hover:bg-gray-50"
              >
                View
              </button>
            )}
          </div>
        );

      case "committee-actions":
        return (
          <div className="flex gap-2">
            {onUpdateStatus && (
              <button
                onClick={() => complaint && onUpdateStatus(complaint)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Update Status
              </button>
            )}
            {onView && (
              <button
                onClick={() => complaint && onView(complaint)}
                className="px-3 py-1 bg-white border border-gray-200 text-blue-600 text-sm rounded hover:bg-gray-50"
              >
                View
              </button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Render mobile card view
  const renderMobileCard = (complaint) => {
    const shortId = getComplaintId(complaint?._id);
    const mongoId = complaint?._id || '';

    return (
      <div
        key={mongoId || Math.random()}
        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
        data-testid={`complaint-row-${shortId}`}
        data-complaint-id={mongoId}
      >
        {/* Header: ID, Priority, Status */}
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex-1 min-w-0">
            {showId && (
              <div className="font-mono text-xs text-gray-500 mb-1" data-testid={`complaint-id-${shortId}`}>
                {shortId}
              </div>
            )}
            {showTitle && (
              <h3 className="font-semibold text-gray-800 text-base leading-tight break-words" data-testid={`complaint-title-${shortId}`}>
                {complaint?.title}
              </h3>
            )}
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-1">
            {showPriority && (
              <div data-testid={`complaint-priority-${shortId}`}>
                {getPriorityBadge(complaint?.priority)}
              </div>
            )}
            {showStatus && (
              <div>{getStatusBadge(complaint?.status)}</div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-2 mb-3">
          {showCommittee && (
            <div className="flex items-center gap-2 text-sm" data-testid={`complaint-committee-${shortId}`}>
              <span className="text-gray-500 font-medium">Committee:</span>
              <span className="text-gray-700">{complaint?.category || 'N/A'}</span>
            </div>
          )}
          
          {showFiledBy && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 font-medium">Filed By:</span>
              <span className="text-gray-700">{getUserName(complaint?.userId)}</span>
            </div>
          )}

          {showDate && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 font-medium">Date:</span>
              <span className="text-gray-600">{formatDate(complaint?.createdAt)}</span>
            </div>
          )}

          {complaint?.isAnonymous && (
            <span
              className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600"
              data-testid={`complaint-anonymous-${shortId}`}
            >
              Anonymous
            </span>
          )}
        </div>

        {/* Footer: Upvotes and Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          {showUpvotes && (
            <div className="flex items-center gap-2">
              {onUpvote && (
                <button
                  onClick={() => complaint && onUpvote(complaint._id)}
                  disabled={upvoting[complaint?._id]}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
                    complaint?.hasUpvoted
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  } ${upvoting[complaint?._id] ? "opacity-50 cursor-not-allowed" : ""}`}
                  title={
                    complaint?.hasUpvoted
                      ? "Remove upvote"
                      : "Upvote this complaint"
                  }
                >
                  <FaThumbsUp size={14} />
                  <span>{complaint?.upvoteCount || complaint?.upvotes?.length || 0}</span>
                </button>
              )}
              {!onUpvote && (
                <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                  <FaThumbsUp size={14} />
                  <span>{complaint?.upvoteCount || complaint?.upvotes?.length || 0}</span>
                </div>
              )}
            </div>
          )}
          
          {showActions && (
            <div className="flex items-center gap-2">
              {renderActions(complaint)}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
    
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left" data-testid="complaints-table">
          <thead>
            <tr className="bg-gray-50 border-b">
              {showId && (
                <th className="p-3 text-sm font-semibold text-gray-600">
                  {showPriority ? "ID" : "Complaint ID"}
                </th>
              )}
              {showTitle && (
                <th className="p-3 text-sm font-semibold text-gray-600">Title</th>
              )}
              {showCommittee && (
                <th className="p-3 text-sm font-semibold text-gray-600">Committee</th>
              )}
              {showPriority && (
                <th className="p-3 text-sm font-semibold text-gray-600">Priority</th>
              )}
              {showStatus && (
                <th className={`p-3 text-sm font-semibold text-gray-600 ${showPriority ? "w-36" : ""}`}>
                  Status
                </th>
              )}
              {showUpvotes && (
                <th className="p-3 text-sm font-semibold text-gray-600">Upvotes</th>
              )}
              {showFiledBy && (
                <th className="p-3 text-sm font-semibold text-gray-600">Filed By</th>
              )}
              {showDate && (
                <th className="p-3 text-sm font-semibold text-gray-600">Date</th>
              )}
              {showActions && (
                <th className="p-3 text-sm font-semibold text-gray-600">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {complaints.map((complaint) => {
              const shortId = getComplaintId(complaint?._id);
              const mongoId = complaint?._id || '';

              return (
              <tr
                key={mongoId || Math.random()}
                className="border-b hover:bg-gray-50 transition-colors"
                data-testid={`complaint-row-${shortId}`}
                data-complaint-id={mongoId}
              >
                {showId && (
                  <td className="p-3 text-gray-700 font-mono text-sm" data-testid={`complaint-id-${shortId}`}>
                    {shortId}
                  </td>
                )}
                {showTitle && (
                  <td className="p-3 text-gray-700" data-testid={`complaint-title-${shortId}`}>
                    <div className="max-w-xs overflow-hidden">
                      <div className="truncate">
                        {complaint?.title}
                      </div>
                      {complaint?.isAnonymous && (
                        <span
                          className="mt-1 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600"
                          data-testid={`complaint-anonymous-${shortId}`}
                        >
                          Anonymous
                        </span>
                      )}
                    </div>
                  </td>
                )}
                {showCommittee && (
                  <td className="p-3 text-gray-700" data-testid={`complaint-committee-${shortId}`}>
                    {complaint?.category || 'N/A'}
                  </td>
                )}
                {showPriority && (
                  <td className="p-3" data-testid={`complaint-priority-${shortId}`}>
                    {getPriorityBadge(complaint?.priority)}
                  </td>
                )}
                {showStatus && (
                  <td className={`p-3 ${showPriority ? "whitespace-nowrap" : ""}`}>
                    {getStatusBadge(complaint?.status)}
                  </td>
                )}
                {showUpvotes && (
                  <td className="p-3 text-gray-600 text-sm text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span>
                        {complaint?.upvoteCount || complaint?.upvotes?.length || 0}
                      </span>
                      {onUpvote && (
                        <button
                          onClick={() => complaint && onUpvote(complaint._id)}
                          disabled={upvoting[complaint?._id]}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                            complaint?.hasUpvoted
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          } ${upvoting[complaint?._id] ? "opacity-50 cursor-not-allowed" : ""}`}
                          title={
                            complaint?.hasUpvoted
                              ? "Remove upvote"
                              : "Upvote this complaint"
                          }
                        >
                          <FaThumbsUp size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
                {showFiledBy && (
                  <td className="p-3 text-gray-600 text-sm">
                    {getUserName(complaint?.userId)}
                  </td>
                )}
                {showDate && (
                  <td className="p-3 text-gray-600 text-sm">
                    {formatDate(complaint?.createdAt)}
                  </td>
                )}
                {showActions && <td className="p-3">{renderActions(complaint)}</td>}
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>

      
      <div className="md:hidden space-y-3">
        {complaints.map((complaint) => renderMobileCard(complaint))}
      </div>
    </>
  );
};

export default ComplaintsTable;

