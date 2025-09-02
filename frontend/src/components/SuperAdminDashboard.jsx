import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import toast from "react-hot-toast";

const SuperAdminDashboard = () => {
  const {
    user,
    getAllUsers,
    createAdmin,
    updateUserRole,
    updateUserStatus,
    deleteUser,
  } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [showContactView, setShowContactView] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  // Check if user signed up through Google (has googleId)
  const isGoogleUser = user?.googleId || user?.authProvider === "google";

  // Search and pagination states
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(5);

  // Contact management states
  const [contacts, setContacts] = useState([]);
  const [contactSearchTerm, setContactSearchTerm] = useState("");
  const [contactCurrentPage, setContactCurrentPage] = useState(1);
  const [contactsPerPage, setContactsPerPage] = useState(5);

  // Notification states
  const [viewedUsers, setViewedUsers] = useState(new Set());
  const [viewedContacts, setViewedContacts] = useState(new Set());

  // Form states
  const [adminForm, setAdminForm] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({
    id: "",
    name: "",
    type: "",
  });

  // Contact delete confirmation modal state
  const [showContactDeleteConfirm, setShowContactDeleteConfirm] =
    useState(false);
  const [contactDeleteTarget, setContactDeleteTarget] = useState({
    id: "",
    name: "",
  });

  useEffect(() => {
    loadUsers();
    loadContacts();
    loadViewedStatus();
  }, []);

  const loadViewedStatus = () => {
    const savedViewedUsers = localStorage.getItem("superAdminViewedUsers");
    const savedViewedContacts = localStorage.getItem(
      "superAdminViewedContacts"
    );

    if (savedViewedUsers) {
      setViewedUsers(new Set(JSON.parse(savedViewedUsers)));
    }
    if (savedViewedContacts) {
      setViewedContacts(new Set(JSON.parse(savedViewedContacts)));
    }
  };

  const saveViewedStatus = (type, id) => {
    if (type === "user") {
      const newViewedUsers = new Set([...viewedUsers, id]);
      setViewedUsers(newViewedUsers);
      localStorage.setItem(
        "superAdminViewedUsers",
        JSON.stringify([...newViewedUsers])
      );
    } else if (type === "contact") {
      const newViewedContacts = new Set([...viewedContacts, id]);
      setViewedContacts(newViewedContacts);
      localStorage.setItem(
        "superAdminViewedContacts",
        JSON.stringify([...newViewedContacts])
      );
    }
  };

  // Listen for contact updates
  useEffect(() => {
    const handleContactUpdate = () => {
      loadContacts();
    };

    window.addEventListener("contactUpdated", handleContactUpdate);
    return () => {
      window.removeEventListener("contactUpdated", handleContactUpdate);
    };
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const result = await getAllUsers();
    if (result.success) {
      setUsers(result.users);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const loadContacts = () => {
    const savedContacts = localStorage.getItem("contactSubmissions");
    if (savedContacts) {
      setContacts(JSON.parse(savedContacts));
    }
  };

  // Filter out current superadmin and apply search - only show regular users in User Management
  const filteredUsers = users.filter(
    (userItem) =>
      userItem._id !== user?._id && // Exclude current superadmin
      userItem.role === "user" && // Only show regular users
      (userItem.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userItem.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userItem.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userItem.username?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter admins for admin management tab
  const filteredAdmins = users.filter(
    (userItem) =>
      userItem._id !== user?._id && // Exclude current superadmin
      (userItem.role === "admin" || userItem.role === "super_admin") && // Only show admins
      (userItem.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userItem.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userItem.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userItem.username?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Contact filtering and pagination
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name?.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
      contact.message?.toLowerCase().includes(contactSearchTerm.toLowerCase())
  );

  const indexOfLastContact = contactCurrentPage * contactsPerPage;
  const indexOfFirstContact = indexOfLastContact - contactsPerPage;
  const currentContacts = filteredContacts.slice(
    indexOfFirstContact,
    indexOfLastContact
  );
  const totalContactPages = Math.ceil(
    filteredContacts.length / contactsPerPage
  );

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    const result = await createAdmin(adminForm);
    if (result.success) {
      toast.success("Admin created successfully!");
      setShowCreateAdmin(false);
      setAdminForm({
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
      });
      loadUsers();
    } else {
      toast.error(result.error);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    const result = await updateUserRole(userId, newRole);
    if (result.success) {
      toast.success("User role updated successfully!");
      loadUsers();
    } else {
      toast.error(result.error);
    }
  };

  const handleStatusChange = async (userId, isActive) => {
    const result = await updateUserStatus(userId, isActive);
    if (result.success) {
      toast.success(
        `User ${isActive ? "activated" : "deactivated"} successfully!`
      );
      loadUsers();
    } else {
      toast.error(result.error);
    }
  };

  const handleDeleteUser = async (userId, userName, userType = "user") => {
    setDeleteTarget({ id: userId, name: userName, type: userType });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget.id) return;

    const result = await deleteUser(deleteTarget.id);
    if (result.success) {
      toast.success(`${deleteTarget.name} ${t("userDeleted")}`);
      setShowDeleteConfirm(false);
      setDeleteTarget({ id: "", name: "", type: "" });
      loadUsers();
    } else {
      toast.error(result.error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteTarget({ id: "", name: "", type: "" });
  };

  const handleViewContact = (contact) => {
    setSelectedContact(contact);
    setShowContactView(true);
    saveViewedStatus("contact", contact.id);
  };

  const handleDeleteContact = (contactId, contactName) => {
    setContactDeleteTarget({ id: contactId, name: contactName });
    setShowContactDeleteConfirm(true);
  };

  const confirmContactDelete = () => {
    if (!contactDeleteTarget.id) return;

    const existingContacts = JSON.parse(
      localStorage.getItem("contactSubmissions") || "[]"
    );
    const updatedContacts = existingContacts.filter(
      (contact) => contact.id !== contactDeleteTarget.id
    );
    localStorage.setItem("contactSubmissions", JSON.stringify(updatedContacts));

    // Dispatch event to update admin dashboards
    window.dispatchEvent(new Event("contactUpdated"));

    toast.success(t("contactDeleted"));
    setShowContactDeleteConfirm(false);
    setContactDeleteTarget({ id: "", name: "" });
    loadContacts();
  };

  const cancelContactDelete = () => {
    setShowContactDeleteConfirm(false);
    setContactDeleteTarget({ id: "", name: "" });
  };

  const getRoleBadge = (role) => {
    const badges = {
      super_admin: "bg-purple-100 text-purple-800",
      admin: "bg-blue-100 text-blue-800",
      user: "bg-gray-100 text-gray-800",
    };
    return badges[role] || "bg-gray-100 text-gray-800";
  };

  const getStatusBadge = (isActive) => {
    return isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  // Stats excluding current superadmin
  const stats = {
    total: users.filter((u) => u._id !== user?._id).length,
    superAdmins: users.filter(
      (u) => u.role === "super_admin" && u._id !== user?._id
    ).length,
    admins: users.filter((u) => u.role === "admin").length,
    users: users.filter((u) => u.role === "user").length,
    active: users.filter((u) => u.isActive && u._id !== user?._id).length,
    inactive: users.filter((u) => !u.isActive && u._id !== user?._id).length,
  };

  // Get new items count - only count regular users for User Management tab
  const newUsersCount = users.filter(
    (u) => !viewedUsers.has(u._id) && u._id !== user?._id && u.role === "user"
  ).length;
  const newContactsCount = contacts.filter(
    (c) => !viewedContacts.has(c.id)
  ).length;

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Reset to first page when users per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [usersPerPage]);

  // Reset to first page when contact search changes
  useEffect(() => {
    setContactCurrentPage(1);
  }, [contactSearchTerm]);

  // Reset to first page when contacts per page changes
  useEffect(() => {
    setContactCurrentPage(1);
  }, [contactsPerPage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-10">
      {/* Header */}
      <div className="border-white/10">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg text-center sm:text-left">
                {t("superAdminDashboard")}
              </h1>
              <p className="text-indigo-100 mt-1 drop-shadow-md italic text-center sm:text-left text-sm sm:text-base">
                {t("welcomeBack")}, {user?.firstName} {user?.lastName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 mt-6 sm:mt-8">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-1 sm:p-2 border border-white/10 shadow-2xl">
          <nav className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
            {[
              { id: "overview", name: t("overview"), icon: "" },
              {
                id: "users",
                name: t("userManagement"),
                count: newUsersCount,
                icon: "",
              },
              {
                id: "admins",
                name: t("Admin Management"),
                count: newContactsCount,
                icon: "",
              },
              {
                id: "contacts",
                name: t("contactManagement"),
                count: newContactsCount,
                icon: "",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 py-3 sm:py-4 px-3 sm:px-6 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg border border-white/20"
                    : "text-gray-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                  {/* <span className="text-lg">{tab.icon}</span> */}
                  <span className="text-center">{tab.name}</span>
                  {tab.count > 0 && (
                    <div className="relative">
                      <span className="absolute -top-2 -right-2 w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>
                      <span className="ml-1 sm:ml-2 inline-flex items-center px-1 sm:px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white shadow-lg">
                        {tab.count}
                      </span>
                    </div>
                  )}
                </div>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-white rounded-full"></div>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {t("userStatistics")}
                </h3>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm sm:text-lg">📊</span>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">
                    {t("totalUsers")}:
                  </span>
                  <span className="font-bold text-white text-base sm:text-lg">
                    {stats.total}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">
                    {t("otherSuperAdmins")}:
                  </span>
                  <span className="font-bold text-purple-400 text-base sm:text-lg">
                    {stats.superAdmins}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">
                    {t("admins")}:
                  </span>
                  <span className="font-bold text-blue-400 text-base sm:text-lg">
                    {stats.admins}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">
                    {t("regularUsers")}:
                  </span>
                  <span className="font-bold text-green-400 text-base sm:text-lg">
                    {stats.users}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">
                    {t("activeUsers")}:
                  </span>
                  <span className="font-bold text-emerald-400 text-base sm:text-lg">
                    {stats.active}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">
                    {t("inactiveUsers")}:
                  </span>
                  <span className="font-bold text-red-400 text-base sm:text-lg">
                    {stats.inactive}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  {t("quickActions")}
                </h3>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm sm:text-lg">⚡</span>
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={() => setShowCreateAdmin(true)}
                  className="w-full px-3 sm:px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors duration-200 text-sm sm:text-base"
                >
                  👥 {t("createNewAdmin")}
                </button>
                <button
                  onClick={() => setActiveTab("users")}
                  className="w-full px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm sm:text-base"
                >
                  👤 {t("manageUsers")}
                </button>
                <button
                  onClick={() => setActiveTab("contacts")}
                  className="w-full px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm sm:text-base"
                >
                  📧 {t("viewContacts")}
                </button>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Your Profile
                </h3>
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">👤</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300">Name:</span>
                  <span className="text-white font-medium">
                    {user?.firstName} {user?.lastName}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300">Email:</span>
                  <span className="text-white font-medium">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300">Username:</span>
                  <span className="text-white font-medium">
                    {user?.username}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300">Role:</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(
                      user?.role
                    )}`}
                  >
                    {user?.role?.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300">Status:</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                      user?.isActive
                    )}`}
                  >
                    {user?.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300">Account Type:</span>
                  <span className="text-sm text-white">
                    {isGoogleUser ? "Google Account" : "Regular Account"}
                  </span>
                </div>
              </div>
              {isGoogleUser && (
                <div className="mt-4 text-sm text-gray-300 bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20">
                  <p className="font-medium text-white mb-1">
                    🔐 Google Account
                  </p>
                  <p>
                    Your password is managed by Google. To change your password,
                    please visit your Google Account settings.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
            <div className="px-6 py-4 border-b border-white/20">
              <h3 className="text-lg font-semibold text-white">
                User Management
              </h3>
              <p className="text-sm text-gray-300 mt-1">
                Managing {filteredUsers.length} regular users
              </p>
            </div>

            {/* Search Bar */}
            <div className="px-6 py-4 border-b border-white/20">
              <div className="flex items-center justify-between">
                <div className="w-[80%]">
                  <label htmlFor="search" className="sr-only">
                    Search users
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <input
                      id="search"
                      type="text"
                      placeholder="Search by name, email, or username..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-white/20 rounded-lg leading-5 bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                {/* Users per page selector */}
                <div className="flex items-center space-x-2">
                  <label
                    htmlFor="usersPerPage"
                    className="text-sm font-medium text-gray-300"
                  >
                    Show:
                  </label>
                  <select
                    id="usersPerPage"
                    value={usersPerPage}
                    onChange={(e) => setUsersPerPage(Number(e.target.value))}
                    className="block w-20 px-3 py-2 border border-white/20 rounded-lg leading-5 bg-white/10 backdrop-blur-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                  </select>
                  <span className="text-sm text-gray-300">per page</span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/20">
                    <thead className="bg-white/10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-transparent divide-y divide-white/20">
                      {currentUsers.map((userItem) => (
                        <tr key={userItem._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 w-10 h-10">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                  {userItem.firstName?.charAt(0)}
                                  {userItem.lastName?.charAt(0)}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-white flex items-center">
                                  {userItem.firstName} {userItem.lastName}
                                  {!viewedUsers.has(userItem._id) && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">
                                      NEW
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-300">
                                  {userItem.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={userItem.role}
                              onChange={(e) =>
                                handleRoleChange(userItem._id, e.target.value)
                              }
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(
                                userItem.role
                              )} border-0`}
                              disabled={userItem.role === "super_admin"}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                              <option value="super_admin">Super Admin</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() =>
                                handleStatusChange(
                                  userItem._id,
                                  !userItem.isActive
                                )
                              }
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                                userItem.isActive
                              )}`}
                              disabled={userItem.role === "super_admin"}
                            >
                              {userItem.isActive ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {new Date(userItem.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  handleStatusChange(
                                    userItem._id,
                                    !userItem.isActive
                                  );
                                  saveViewedStatus("user", userItem._id);
                                }}
                                className="text-blue-600 hover:text-blue-900 font-medium hover:bg-blue-50 px-3 py-1 rounded-md transition-colors duration-200"
                                disabled={userItem.role === "super_admin"}
                              >
                                {userItem.isActive ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteUser(
                                    userItem._id,
                                    `${userItem.firstName} ${userItem.lastName}`,
                                    "user"
                                  )
                                }
                                className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-colors duration-200"
                                title="Delete User"
                                disabled={userItem.role === "super_admin"}
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-white/20">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-300">
                        Showing {indexOfFirstUser + 1} to{" "}
                        {Math.min(indexOfLastUser, filteredUsers.length)} of{" "}
                        {filteredUsers.length} results
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-2 text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1
                        ).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                              currentPage === page
                                ? "bg-indigo-600 text-white shadow-lg"
                                : "text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "admins" && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
            <div className="px-6 py-4 border-b border-white/20">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Admin Management
                  </h3>
                  <p className="text-sm text-gray-300 mt-1">
                    Managing {filteredAdmins.length} admins
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateAdmin(true)}
                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors duration-200"
                >
                  Create New Admin
                </button>
              </div>
            </div>
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/20">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Admin
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-transparent divide-y divide-white/20">
                    {filteredAdmins.map((admin) => (
                      <tr key={admin._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">
                              {admin.firstName} {admin.lastName}
                            </div>
                            <div className="text-sm text-gray-300">
                              {admin.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(
                              admin.role
                            )}`}
                          >
                            {admin.role.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                              admin.isActive
                            )}`}
                          >
                            {admin.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {admin.role !== "super_admin" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(admin._id, !admin.isActive)
                                }
                                className="text-blue-600 hover:text-blue-900 px-3 py-1 rounded-md hover:bg-blue-50 transition-colors duration-200"
                              >
                                {admin.isActive ? "Deactivate" : "Activate"}
                              </button>
                            )}
                            <button
                              onClick={() =>
                                handleDeleteUser(
                                  admin._id,
                                  `${admin.firstName} ${admin.lastName}`,
                                  "admin"
                                )
                              }
                              className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-colors duration-200"
                              title="Delete Admin"
                              disabled={admin.role === "super_admin"}
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "contacts" && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
            <div className="px-6 py-4 border-b border-white/20">
              <h3 className="text-lg font-semibold text-white">
                Contact Management
              </h3>
              <p className="text-sm text-gray-300 mt-1">
                Managing {filteredContacts.length} contact submissions
              </p>
            </div>

            {/* Search Bar */}
            <div className="px-6 py-4 border-b border-white/20">
              <div className="flex items-center justify-between">
                <div className="w-[80%]">
                  <label htmlFor="contactSearch" className="sr-only">
                    Search contacts
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <input
                      id="contactSearch"
                      type="text"
                      placeholder="Search by name, email, or message..."
                      value={contactSearchTerm}
                      onChange={(e) => setContactSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-white/20 rounded-lg leading-5 bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                {/* Contacts per page selector */}
                <div className="flex items-center space-x-2">
                  <label
                    htmlFor="contactsPerPage"
                    className="text-sm font-medium text-gray-300"
                  >
                    Show:
                  </label>
                  <select
                    id="contactsPerPage"
                    value={contactsPerPage}
                    onChange={(e) => setContactsPerPage(Number(e.target.value))}
                    className="block w-15 pr-8 pl-3 py-2 border border-white/20 rounded-lg leading-5 bg-cyan-700 backdrop-blur-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-600 sm:text-sm appearance-none"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                  </select>
                  <span className="text-sm text-gray-300">per page</span>
                </div>
              </div>
            </div>

            {filteredContacts.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-300">No contact submissions found.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/20">
                    <thead className="bg-white/10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Company Info
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Message
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          User Info
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Submitted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-transparent divide-y divide-white/20">
                      {currentContacts.map((contact) => (
                        <tr key={contact.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 w-10 h-10">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                                  {contact.name?.charAt(0)}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-white flex items-center">
                                  {contact.name}
                                  {!viewedContacts.has(contact.id) && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">
                                      NEW
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-300">
                                  {contact.email}
                                </div>
                                {contact.phone && (
                                  <div className="text-sm text-gray-300">
                                    {contact.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {contact.companyInfo && (
                              <div className="text-sm text-white">
                                {contact.companyInfo.companyName && (
                                  <div className="font-medium">
                                    {contact.companyInfo.companyName}
                                  </div>
                                )}
                                {contact.companyInfo.companyPhone && (
                                  <div className="text-gray-300">
                                    {contact.companyInfo.companyPhone}
                                  </div>
                                )}
                                {contact.companyInfo.companyEmail && (
                                  <div className="text-gray-300">
                                    {contact.companyInfo.companyEmail}
                                  </div>
                                )}
                                {contact.companyInfo.companyAddress && (
                                  <div
                                    className="text-gray-300 max-w-xs truncate"
                                    title={contact.companyInfo.companyAddress}
                                  >
                                    {contact.companyInfo.companyAddress}
                                  </div>
                                )}
                                {!contact.companyInfo.companyName &&
                                  !contact.companyInfo.companyPhone &&
                                  !contact.companyInfo.companyEmail &&
                                  !contact.companyInfo.companyAddress && (
                                    <span className="text-gray-400 italic">
                                      No company info
                                    </span>
                                  )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div
                              className="text-sm text-white max-w-xs truncate"
                              title={contact.message}
                            >
                              {contact.message}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-300">
                              {contact.userRole === "guest" ? (
                                <span className="px-2 py-1 bg-white/10 text-white rounded-full text-xs backdrop-blur-sm">
                                  Guest User
                                </span>
                              ) : (
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    contact.userRole === "super_admin"
                                      ? "bg-purple-500/20 text-purple-300"
                                      : contact.userRole === "admin"
                                      ? "bg-blue-500/20 text-blue-300"
                                      : "bg-green-500/20 text-green-300"
                                  }`}
                                >
                                  {contact.userRole?.replace("_", " ")}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {new Date(contact.submittedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewContact(contact)}
                                className="text-indigo-400 hover:text-indigo-300 p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
                                title="View Details"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteContact(contact.id, contact.name)
                                }
                                className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-white/10 transition-colors duration-200"
                                title="Delete Contact"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalContactPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Showing {indexOfFirstContact + 1} to{" "}
                        {Math.min(indexOfLastContact, filteredContacts.length)}{" "}
                        of {filteredContacts.length} results
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            setContactCurrentPage(contactCurrentPage - 1)
                          }
                          disabled={contactCurrentPage === 1}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        {Array.from(
                          { length: totalContactPages },
                          (_, i) => i + 1
                        ).map((page) => (
                          <button
                            key={page}
                            onClick={() => setContactCurrentPage(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                              contactCurrentPage === page
                                ? "bg-indigo-600 text-white shadow-lg"
                                : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() =>
                            setContactCurrentPage(contactCurrentPage + 1)
                          }
                          disabled={contactCurrentPage === totalContactPages}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      {showCreateAdmin && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Create New Admin
              </h3>
              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={adminForm.username}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, username: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={adminForm.email}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, email: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={adminForm.password}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, password: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={adminForm.firstName}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, firstName: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={adminForm.lastName}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, lastName: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateAdmin(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Contact View Modal */}
      {showContactView && selectedContact && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center modal-backdrop">
          <div className="relative mx-auto p-0 w-4/5 max-w-4xl">
            <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 transform transition-all">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/20">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-white">
                      Contact Details
                    </h3>
                    <p className="text-sm text-gray-300">
                      View contact submission information
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowContactView(false)}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-white border-b border-white/20 pb-2">
                      Contact Information
                    </h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        Full Name
                      </label>
                      <p className="text-sm text-white">
                        {selectedContact.name}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        Email
                      </label>
                      <p className="text-sm text-white">
                        {selectedContact.email}
                      </p>
                    </div>
                    {selectedContact.phone && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300">
                          Phone
                        </label>
                        <p className="text-sm text-white">
                          {selectedContact.phone}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        Message
                      </label>
                      <p className="text-sm text-white bg-white/10 backdrop-blur-sm p-3 rounded-md border border-white/20">
                        {selectedContact.message}
                      </p>
                    </div>
                  </div>

                  {/* Company Information */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-white border-b border-white/20 pb-2">
                      Company Information
                    </h4>
                    {selectedContact.companyInfo ? (
                      <div className="space-y-3">
                        {selectedContact.companyInfo.companyName && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300">
                              Company Name
                            </label>
                            <p className="text-sm text-white">
                              {selectedContact.companyInfo.companyName}
                            </p>
                          </div>
                        )}
                        {selectedContact.companyInfo.companyPhone && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300">
                              Company Phone
                            </label>
                            <p className="text-sm text-white">
                              {selectedContact.companyInfo.companyPhone}
                            </p>
                          </div>
                        )}
                        {selectedContact.companyInfo.companyEmail && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300">
                              Company Email
                            </label>
                            <p className="text-sm text-white">
                              {selectedContact.companyInfo.companyEmail}
                            </p>
                          </div>
                        )}
                        {selectedContact.companyInfo.companyAddress && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300">
                              Company Address
                            </label>
                            <p className="text-sm text-white bg-white/10 backdrop-blur-sm p-3 rounded-md border border-white/20">
                              {selectedContact.companyInfo.companyAddress}
                            </p>
                          </div>
                        )}
                        {!selectedContact.companyInfo.companyName &&
                          !selectedContact.companyInfo.companyPhone &&
                          !selectedContact.companyInfo.companyEmail &&
                          !selectedContact.companyInfo.companyAddress && (
                            <p className="text-gray-400 italic">
                              No company information provided
                            </p>
                          )}
                      </div>
                    ) : (
                      <p className="text-gray-400 italic">
                        No company information provided
                      </p>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                <div className="mt-6 pt-4 border-t border-white/20">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        User Role
                      </label>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          selectedContact.userRole === "guest"
                            ? "bg-gray-100 text-gray-800"
                            : selectedContact.userRole === "super_admin"
                            ? "bg-purple-100 text-purple-800"
                            : selectedContact.userRole === "admin"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {selectedContact.userRole === "guest"
                          ? "Guest User"
                          : selectedContact.userRole?.replace("_", " ")}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        Submitted Date
                      </label>
                      <p className="text-sm text-white">
                        {new Date(selectedContact.submittedAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        Contact ID
                      </label>
                      <p className="text-sm text-white font-mono">
                        {selectedContact.id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-white/5 rounded-b-2xl">
                <button
                  onClick={() => setShowContactView(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  Close
                </button>
                <button
                  onClick={() =>
                    handleDeleteContact(
                      selectedContact.id,
                      selectedContact.name
                    )
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 border border-transparent rounded-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                >
                  Delete Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deleteTarget.id && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center modal-backdrop">
          <div className="relative mx-auto p-0 w-full max-w-md">
            <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 transform transition-all">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/20">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-white">
                      Confirm Deletion
                    </h3>
                    <p className="text-sm text-gray-300">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
                <button
                  onClick={cancelDelete}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-red-500 to-red-600 mb-4">
                    <svg
                      className="h-8 w-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    Delete {deleteTarget.type === "admin" ? "Admin" : "User"}
                  </h3>
                  <p className="text-sm text-gray-300 mb-6">
                    Are you sure you want to delete{" "}
                    <span className="font-semibold text-white">
                      {deleteTarget.name}
                    </span>
                    ? This action cannot be undone and will permanently remove
                    all their data.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-white/5 rounded-b-2xl">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 border border-transparent rounded-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                >
                  Delete {deleteTarget.type === "admin" ? "Admin" : "User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Delete Confirmation Modal */}
      {showContactDeleteConfirm && contactDeleteTarget.id && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center modal-backdrop">
          <div className="relative mx-auto p-0 w-full max-w-md">
            <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 transform transition-all">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/20">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-white">
                      Confirm Deletion
                    </h3>
                    <p className="text-sm text-gray-300">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
                <button
                  onClick={cancelContactDelete}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-red-500 to-red-600 mb-4">
                    <svg
                      className="h-8 w-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    Delete Contact Submission
                  </h3>
                  <p className="text-sm text-gray-300 mb-6">
                    Are you sure you want to delete the contact submission from{" "}
                    <span className="font-semibold text-white">
                      {contactDeleteTarget.name}
                    </span>
                    ? This action cannot be undone and will permanently remove
                    all their contact data.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-white/5 rounded-b-2xl">
                <button
                  onClick={cancelContactDelete}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmContactDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 border border-transparent rounded-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                >
                  Delete Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
