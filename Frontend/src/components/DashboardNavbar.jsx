import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaBell, FaChevronDown, FaUserCircle, FaBars } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";

const DashboardNavbar = ({
  title,
  profileName,
  profileInitial,
  onLogout,
  notifications,
  unreadCount,
  loadingNotifications,
  onBellClick,
  onMarkAllRead,
  onNotificationClick,
  onNotificationDelete,
  notificationDropdownOpen,
  notificationDropdownRef,
  notificationButtonRef,
  dropdownOpen,
  setDropdownOpen,
  dropdownRef,
  profileRoute,
  bellBadgeLimit = 9,
  emptyState,
  showMenuButton = false,
  onMenuToggle,
  isSidebarOpen = false,
  menuButtonTestId = "sidebar-menu-button",
  onClearAllNotifications,
  testIds = {},
}) => {
  const {
    container: containerTestId = "dashboard-header",
    title: titleTestId = "dashboard-title",
    headerControls: headerControlsTestId = "header-controls-container",
    bellButton: bellButtonTestId = "notification-bell-button",
    bellIcon: bellIconTestId = "notification-bell-icon",
    bellBadge: bellBadgeTestId = "notification-badge",
    notificationsWrapper: notificationsWrapperTestId = "notification-dropdown",
    notificationsTitle: notificationsTitleTestId = "notification-dropdown-title",
    markAllReadButton: markAllReadButtonTestId = "mark-all-read-button",
    profileButton: profileButtonTestId = "user-profile-dropdown-button",
    profileAvatar: profileAvatarTestId = "user-avatar",
    profileName: profileNameTestId = "user-name-display",
    profileMenu: profileMenuTestId = "user-dropdown-menu",
    profileLink: profileLinkTestId = "dropdown-profile-link",
    logoutButton: logoutButtonTestId = "dropdown-logout-button",
  } = testIds;

  const notificationList = Array.isArray(notifications) ? notifications : [];
  const hasNotifications = notificationList.length > 0;
  const canClearNotifications = hasNotifications && typeof onClearAllNotifications === "function";
  const canMarkNotifications = hasNotifications && typeof onMarkAllRead === "function";
  const showNotificationActions = canClearNotifications || canMarkNotifications;
  const markAllDisabled = !canMarkNotifications || unreadCount <= 0;
  const actionButtonBaseClasses =
    "inline-flex items-center justify-center min-w-[110px] px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-md border transition-colors touch-manipulation";

  return (
    <header
      className="bg-white shadow-sm h-16 sm:h-20 flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 border-b"
      data-testid={containerTestId}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        {showMenuButton && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="lg:hidden inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
            aria-label={isSidebarOpen ? "Close sidebar menu" : "Open sidebar menu"}
            data-testid={menuButtonTestId}
          >
            <FaBars size={16} className="sm:hidden" />
            <FaBars size={18} className="hidden sm:block" />
          </button>
        )}
        <h1 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 truncate" data-testid={titleTestId}>
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-6" data-testid={headerControlsTestId}>
        <div className="relative" ref={notificationDropdownRef}>
          <button
            ref={notificationButtonRef}
            onClick={onBellClick}
            className="relative text-gray-500 hover:text-gray-800 active:text-gray-900 transition-colors p-1 touch-manipulation"
            data-testid={bellButtonTestId}
          >
            <FaBell size={18} className="sm:hidden" data-testid={bellIconTestId} />
            <FaBell size={22} className="hidden sm:block" data-testid={bellIconTestId} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 sm:-top-1 sm:-right-1 inline-flex items-center justify-center px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[18px] sm:min-w-[20px]">
                <span data-testid={bellBadgeTestId}>
                  {unreadCount > bellBadgeLimit ? `${bellBadgeLimit}+` : unreadCount}
                </span>
              </span>
            )}
          </button>

          {notificationDropdownOpen && (
            <div
              className="fixed sm:absolute top-16 sm:top-full left-0 right-0 sm:left-auto sm:right-0 mt-0 sm:mt-3 w-full sm:w-96 bg-white rounded-none sm:rounded-lg shadow-xl z-20 overflow-hidden border-t sm:border max-h-[calc(100vh-4rem)] sm:max-h-96 flex flex-col"
              data-testid={notificationsWrapperTestId}
            >
              <div className="p-3 sm:p-4 border-b flex items-center justify-between bg-gray-50">
                <h3 className="font-semibold text-sm sm:text-base text-gray-800" data-testid={notificationsTitleTestId}>
                  Notifications
                </h3>
                 {showNotificationActions && (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={onClearAllNotifications}
                      disabled={!canClearNotifications}
                      className={`${actionButtonBaseClasses} ${
                        canClearNotifications
                          ? "text-red-600 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-700"
                          : "text-red-300 border-gray-200 bg-gray-50 cursor-not-allowed"
                      }`}
                    >
                      Clear all
                    </button>
                  
                    <button
                      type="button"
                      onClick={markAllDisabled ? undefined : onMarkAllRead}
                      disabled={markAllDisabled}
                      className={`${actionButtonBaseClasses} ${
                        markAllDisabled
                          ? "text-blue-300 border-gray-200 bg-gray-50 cursor-not-allowed"
                          : "text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-800"
                      }`}
                      data-testid={markAllReadButtonTestId}
                    >
                      Mark all as read
                    </button>
                  </div>
                )}
              </div>

              <div className="overflow-y-auto flex-1">
                {loadingNotifications ? (
                  <div className="p-4 text-center text-sm sm:text-base text-gray-500">Loading...</div>
                ) : notificationList.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center text-gray-500">
                    {emptyState ?? (
                      <>
                        <FaBell size={28} className="sm:hidden mx-auto mb-2 text-gray-300" />
                        <FaBell size={32} className="hidden sm:block mx-auto mb-2 text-gray-300" />
                        <p className="text-sm sm:text-base">No notifications yet</p>
                      </>
                    )}
                  </div>
                ) : (
                  notificationList.map((notification) => (
                    <div
                      key={notification._id}
                      className={`px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer touch-manipulation ${
                        !notification.isRead ? "bg-blue-50" : ""
                      }`}
                      onClick={() => onNotificationClick?.(notification)}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base text-gray-800 font-medium">
                            {notification.message}
                          </p>
                          {notification.complaint && (
                            <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                              ID: {`CC${notification.complaint._id?.slice(-6).toUpperCase()}`}
                            </p>
                          )}
                          <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                            {new Date(notification.createdAt).toLocaleDateString()} {" "}
                            {new Date(notification.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        {onNotificationDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNotificationDelete(notification);
                            }}
                            className="text-gray-400 hover:text-red-600 active:text-red-700 transition-colors flex-shrink-0 p-1 touch-manipulation"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={dropdownRef} data-testid="user-profile-dropdown">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 sm:gap-3 p-1 sm:p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
            data-testid={profileButtonTestId}
          >
            <div
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm sm:text-lg"
              data-testid={profileAvatarTestId}
            >
              {profileInitial}
            </div>
            <span className="font-semibold text-sm sm:text-base text-gray-700 hidden md:block" data-testid={profileNameTestId}>
              {profileName}
            </span>
            <FaChevronDown
              size={10}
              className={`text-gray-500 transition-transform sm:hidden ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
            <FaChevronDown
              size={12}
              className={`text-gray-500 transition-transform hidden sm:block ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {dropdownOpen && (
            <div
              className="absolute top-full right-0 mt-2 sm:mt-3 w-44 sm:w-48 bg-white rounded-lg shadow-xl z-10 overflow-hidden border"
              data-testid={profileMenuTestId}
            >
              <Link
                to={profileRoute}
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
                data-testid={profileLinkTestId}
              >
                <FaUserCircle size={16} className="sm:hidden" />
                <FaUserCircle className="hidden sm:block" />
                Profile
              </Link>
              <button
                onClick={onLogout}
                className="w-full text-left flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors touch-manipulation"
                data-testid={logoutButtonTestId}
              >
                <FiLogOut size={16} className="sm:hidden" />
                <FiLogOut className="hidden sm:block" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardNavbar;
