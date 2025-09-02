import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user, getAllUsers, updateUserStatus, deleteUser, updateProfile, changePassword } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showContactView, setShowContactView] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  
  // Profile editing states
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  // Contact management states
  const [contacts, setContacts] = useState([]);
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [contactCurrentPage, setContactCurrentPage] = useState(1);
  const [contactsPerPage, setContactsPerPage] = useState(5);

  // Notification states
  const [viewedUsers, setViewedUsers] = useState(new Set());
  const [viewedContacts, setViewedContacts] = useState(new Set());

  // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ id: '', name: '', type: '' });
  
  // Contact delete confirmation modal state
  const [showContactDeleteConfirm, setShowContactDeleteConfirm] = useState(false);
  const [contactDeleteTarget, setContactDeleteTarget] = useState({ id: '', name: '' });

  // Check if user signed up through Google (has googleId)
  const isGoogleUser = user?.googleId || user?.authProvider === 'google';

  // Profile form states
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadUsers();
    loadContacts();
    loadViewedStatus();
  }, []);

  // Update profile form when user data changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || ''
      });
    }
  }, [user]);

  // Listen for contact updates
  useEffect(() => {
    const handleContactUpdate = () => {
      loadContacts();
    };

    window.addEventListener('contactUpdated', handleContactUpdate);
    return () => {
      window.removeEventListener('contactUpdated', handleContactUpdate);
    };
  }, []);

  const loadViewedStatus = () => {
    const savedViewedUsers = localStorage.getItem('adminViewedUsers');
    const savedViewedContacts = localStorage.getItem('adminViewedContacts');
    
    if (savedViewedUsers) {
      setViewedUsers(new Set(JSON.parse(savedViewedUsers)));
    }
    if (savedViewedContacts) {
      setViewedContacts(new Set(JSON.parse(savedViewedContacts)));
    }
  };

  const saveViewedStatus = (type, id) => {
    if (type === 'user') {
      const newViewedUsers = new Set([...viewedUsers, id]);
      setViewedUsers(newViewedUsers);
      localStorage.setItem('adminViewedUsers', JSON.stringify([...newViewedUsers]));
    } else if (type === 'contact') {
      const newViewedContacts = new Set([...viewedContacts, id]);
      setViewedContacts(newViewedContacts);
      localStorage.setItem('adminViewedContacts', JSON.stringify([...newViewedContacts]));
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    const result = await getAllUsers();
    if (result.success) {
      // Filter out super admins and other admins - regular admins can only manage users
      const regularUsers = result.users.filter(u => u.role === 'user');
      setUsers(regularUsers);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const loadContacts = () => {
    const savedContacts = localStorage.getItem('contactSubmissions');
    if (savedContacts) {
      setContacts(JSON.parse(savedContacts));
    }
  };

  const handleStatusChange = async (userId, isActive) => {
    const result = await updateUserStatus(userId, isActive);
    if (result.success) {
      toast.success(`User ${isActive ? 'activated' : 'deactivated'} successfully!`);
      loadUsers();
    } else {
      toast.error(result.error);
    }
  };

  const handleDeleteUser = async (userId, userName, userType = 'user') => {
    setDeleteTarget({ id: userId, name: userName, type: userType });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget.id) return;

    const result = await deleteUser(deleteTarget.id);
    if (result.success) {
      toast.success(`${deleteTarget.name} deleted successfully!`);
      setShowDeleteConfirm(false);
      setDeleteTarget({ id: '', name: '', type: '' });
      loadUsers();
    } else {
      toast.error(result.error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteTarget({ id: '', name: '', type: '' });
  };

  const handleViewContact = (contact) => {
    setSelectedContact(contact);
    setShowContactView(true);
    saveViewedStatus('contact', contact.id);
  };

  const handleDeleteContact = (contactId, contactName) => {
    setContactDeleteTarget({ id: contactId, name: contactName });
    setShowContactDeleteConfirm(true);
  };

  const confirmContactDelete = () => {
    if (!contactDeleteTarget.id) return;

    const existingContacts = JSON.parse(localStorage.getItem('contactSubmissions') || '[]');
    const updatedContacts = existingContacts.filter(contact => contact.id !== contactDeleteTarget.id);
    localStorage.setItem('contactSubmissions', JSON.stringify(updatedContacts));
    
    // Dispatch event to update admin dashboards
    window.dispatchEvent(new Event('contactUpdated'));
    
    toast.success('Contact submission deleted successfully!');
    setShowContactDeleteConfirm(false);
    setContactDeleteTarget({ id: '', name: '' });
    loadContacts();
  };

  const cancelContactDelete = () => {
    setShowContactDeleteConfirm(false);
    setContactDeleteTarget({ id: '', name: '' });
  };

  // Profile update handlers
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const result = await updateProfile(profileForm);
    if (result.success) {
      toast.success(t('profileUpdated'));
      setShowProfileEdit(false);
    } else {
      toast.error(result.error);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('passwordsDoNotMatch'));
      return;
    }
    const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
    if (result.success) {
      toast.success(t('passwordChanged'));
      setShowPasswordChange(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      toast.error(result.error);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      super_admin: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      user: 'bg-gray-100 text-gray-800'
    };
    return badges[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  // Contact filtering and pagination
  const filteredContacts = contacts.filter(contact => 
    contact.name?.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
    contact.message?.toLowerCase().includes(contactSearchTerm.toLowerCase())
  );

  const indexOfLastContact = contactCurrentPage * contactsPerPage;
  const indexOfFirstContact = indexOfLastContact - contactsPerPage;
  const currentContacts = filteredContacts.slice(indexOfFirstContact, indexOfLastContact);
  const totalContactPages = Math.ceil(filteredContacts.length / contactsPerPage);

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length
  };

  // Get new items count
  const newUsersCount = users.filter(u => !viewedUsers.has(u._id)).length;
  const newContactsCount = contacts.filter(c => !viewedContacts.has(c.id)).length;

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
              <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg text-center sm:text-left">{t('dashboard')}</h1>
              <p className="text-indigo-100 mt-1 drop-shadow-md italic text-center sm:text-left text-sm sm:text-base">{t('welcomeBack')}, {user?.firstName} {user?.lastName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 mt-6 sm:mt-8">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-1 sm:p-2 border border-white/10 shadow-2xl">
          <nav className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
            {[
              { id: 'overview', name: t('overview'), icon: '' },
              { id: 'users', name: t('userManagement'), count: newUsersCount, icon: '' },
              { id: 'contacts', name: t('contactManagement'), count: newContactsCount, icon: '' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 py-3 sm:py-4 px-3 sm:px-6 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 transform hover:scale-105 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg border border-white/20'
                    : 'text-gray-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-center space-x-1 sm:space-x-2">
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
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-white">{t('userManagement')}</h3>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm sm:text-lg">📊</span>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">{t('totalUsers')}:</span>
                  <span className="font-bold text-white text-base sm:text-lg">{stats.total}</span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">{t('activeUsers')}:</span>
                  <span className="font-bold text-emerald-400 text-base sm:text-lg">{stats.active}</span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">{t('inactiveUsers')}:</span>
                  <span className="font-bold text-red-400 text-base sm:text-lg">{stats.inactive}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-white">{t('yourProfile')}</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowProfileEdit(true)}
                    className="px-3 py-1 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                  >
                    Edit
                  </button>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm sm:text-lg">👤</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">{t('name')}:</span>
                  <span className="text-white font-medium text-sm sm:text-base">{user?.firstName} {user?.lastName}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">{t('email')}:</span>
                  <span className="text-white font-medium text-sm sm:text-base">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300 text-sm sm:text-base">{t('username')}:</span>
                  <span className="text-white font-medium text-sm sm:text-base">{user?.username}</span>
                </div>

                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300">{t('role')}:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user?.role)}`}>
                    {user?.role?.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <span className="text-gray-300">{t('status')}:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(user?.isActive)}`}>
                    {user?.isActive ? t('activeUsers') : t('inactiveUsers')}
                  </span>
                </div>
                {!isGoogleUser && (
                  <div className="pt-2">
                    <button
                      onClick={() => setShowPasswordChange(true)}
                      className="w-full px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                    >
                      {t('changePassword')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Permissions</h3>
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p className="flex items-center p-2 bg-green-50 rounded-lg">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  View all regular users
                </p>
                <p className="flex items-center p-2 bg-green-50 rounded-lg">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Activate/deactivate users
                </p>
                <p className="flex items-center p-2 bg-green-50 rounded-lg">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  View contact submissions
                </p>
                <p className="flex items-center p-2 bg-red-50 rounded-lg">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  Cannot manage admins
                </p>
                <p className="flex items-center p-2 bg-red-50 rounded-lg">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  Cannot change user roles
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">User Management</h3>
              <p className="text-sm text-gray-300 mt-1">Manage regular users only</p>
            </div>
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400 mx-auto"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/20">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                                      <tbody className="bg-transparent divide-y divide-white/20">
                      {users.map((userItem) => (
                        <tr key={userItem._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                {userItem.firstName?.charAt(0)}{userItem.lastName?.charAt(0)}
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
                              <div className="text-sm text-gray-300">{userItem.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(userItem.isActive)}`}>
                            {userItem.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {new Date(userItem.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                handleStatusChange(userItem._id, !userItem.isActive);
                                saveViewedStatus('user', userItem._id);
                              }}
                              className="text-blue-600 hover:text-blue-900 font-medium hover:bg-blue-50 px-3 py-1 rounded-md transition-colors duration-200"
                            >
                              {userItem.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(userItem._id, `${userItem.firstName} ${userItem.lastName}`, 'user')}
                              className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-colors duration-200"
                              title="Delete User"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="p-6 text-center text-gray-400">
                    No regular users found.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Contact Management</h3>
              <p className="text-sm text-gray-300 mt-1">View contact form submissions</p>
            </div>
            
            {/* Search Bar */}
            <div className="px-6 py-4 border-b border-white/20">
              <div className="flex items-center justify-between">
                <div className="w-[80%]">
                  <label htmlFor="contactSearch" className="sr-only">Search contacts</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                  <label htmlFor="contactsPerPage" className="text-sm font-medium text-gray-300">
                    Show:
                  </label>
                  <select
                    id="contactsPerPage"
                    value={contactsPerPage}
                    onChange={(e) => setContactsPerPage(Number(e.target.value))}
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

            {filteredContacts.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-400">No contact submissions found.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/20">
                    <thead className="bg-white/10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Company Info</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Message</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User Info</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Submitted</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
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
                                <div className="text-sm text-gray-300">{contact.email}</div>
                                {contact.phone && (
                                  <div className="text-sm text-gray-300">{contact.phone}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {contact.companyInfo && (
                              <div className="text-sm text-white">
                                {contact.companyInfo.companyName && (
                                  <div className="font-medium">{contact.companyInfo.companyName}</div>
                                )}
                                {contact.companyInfo.companyPhone && (
                                  <div className="text-gray-300">{contact.companyInfo.companyPhone}</div>
                                )}
                                {contact.companyInfo.companyEmail && (
                                  <div className="text-gray-300">{contact.companyInfo.companyEmail}</div>
                                )}
                                {contact.companyInfo.companyAddress && (
                                  <div className="text-gray-300 max-w-xs truncate" title={contact.companyInfo.companyAddress}>
                                    {contact.companyInfo.companyAddress}
                                  </div>
                                )}
                                {!contact.companyInfo.companyName && !contact.companyInfo.companyPhone && !contact.companyInfo.companyEmail && !contact.companyInfo.companyAddress && (
                                  <span className="text-gray-400 italic">No company info</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-white max-w-xs truncate" title={contact.message}>
                              {contact.message}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-300">
                              {contact.userRole === 'guest' ? (
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs border border-gray-200">
                                  Guest User
                                </span>
                              ) : (
                                <span className={`px-2 py-1 rounded-full text-xs border ${
                                  contact.userRole === 'super_admin' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                  contact.userRole === 'admin' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                  'bg-green-100 text-green-800 border-green-200'
                                }`}>
                                  {contact.userRole?.replace('_', ' ')}
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
                                className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-50 transition-colors duration-200"
                                title="View Details"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteContact(contact.id, contact.name)}
                                className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-colors duration-200"
                                title="Delete Contact"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1v3M4 7h16" />
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
                  <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Showing {indexOfFirstContact + 1} to {Math.min(indexOfLastContact, filteredContacts.length)} of {filteredContacts.length} results
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setContactCurrentPage(contactCurrentPage - 1)}
                          disabled={contactCurrentPage === 1}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          Previous
                        </button>
                        {Array.from({ length: totalContactPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setContactCurrentPage(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                              contactCurrentPage === page
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => setContactCurrentPage(contactCurrentPage + 1)}
                          disabled={contactCurrentPage === totalContactPages}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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

        {/* Contact View Modal */}
        {showContactView && selectedContact && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center modal-backdrop">
            <div className="relative mx-auto p-0 w-4/5 max-w-4xl">
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 transform transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/20">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-white">Contact Details</h3>
                      <p className="text-sm text-gray-300">View contact submission information</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowContactView(false)}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Content */}
                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contact Information */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-white border-b border-white/20 pb-2">Contact Information</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-300">Full Name</label>
                        <p className="text-sm text-white">{selectedContact.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300">Email</label>
                        <p className="text-sm text-white">{selectedContact.email}</p>
                      </div>
                      {selectedContact.phone && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300">Phone</label>
                          <p className="text-sm text-white">{selectedContact.phone}</p>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-300">Message</label>
                        <p className="text-sm text-white bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20">{selectedContact.message}</p>
                      </div>
                    </div>

                    {/* Company Information */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-white border-b border-white/20 pb-2">Company Information</h4>
                      {selectedContact.companyInfo ? (
                        <div className="space-y-3">
                          {selectedContact.companyInfo.companyName && (
                            <div>
                              <label className="block text-sm font-medium text-gray-300">Company Name</label>
                              <p className="text-sm text-white">{selectedContact.companyInfo.companyName}</p>
                            </div>
                          )}
                          {selectedContact.companyInfo.companyPhone && (
                            <div>
                              <label className="block text-sm font-medium text-gray-300">Company Phone</label>
                              <p className="text-sm text-white">{selectedContact.companyInfo.companyPhone}</p>
                            </div>
                          )}
                          {selectedContact.companyInfo.companyEmail && (
                            <div>
                              <label className="block text-sm font-medium text-gray-300">Company Email</label>
                              <p className="text-sm text-white">{selectedContact.companyInfo.companyEmail}</p>
                            </div>
                          )}
                          {selectedContact.companyInfo.companyAddress && (
                            <div>
                              <label className="block text-sm font-medium text-gray-300">Company Address</label>
                              <p className="text-sm text-white bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20">{selectedContact.companyInfo.companyAddress}</p>
                            </div>
                          )}
                          {!selectedContact.companyInfo.companyName && !selectedContact.companyInfo.companyPhone && !selectedContact.companyInfo.companyEmail && !selectedContact.companyInfo.companyAddress && (
                            <p className="text-gray-400 italic">No company information provided</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">No company information provided</p>
                      )}
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="mt-6 pt-4 border-t border-white/20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300">User Role</label>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          selectedContact.userRole === 'guest' ? 'bg-gray-100 text-gray-800 border border-gray-200' :
                          selectedContact.userRole === 'super_admin' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                          selectedContact.userRole === 'admin' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          'bg-green-100 text-green-800 border border-green-200'
                        }`}>
                          {selectedContact.userRole === 'guest' ? 'Guest User' : selectedContact.userRole?.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300">Submitted Date</label>
                        <p className="text-sm text-white">{new Date(selectedContact.submittedAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300">Contact ID</label>
                        <p className="text-sm text-white font-mono">{selectedContact.id}</p>
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
                    onClick={() => handleDeleteContact(selectedContact.id, selectedContact.name)}
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
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-white">Confirm Deletion</h3>
                      <p className="text-sm text-gray-300">This action cannot be undone</p>
                    </div>
                  </div>
                  <button
                    onClick={cancelDelete}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-red-500 to-red-600 mb-4">
                      <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      Delete {deleteTarget.type === 'admin' ? 'Admin' : 'User'}
                    </h3>
                    <p className="text-sm text-gray-300 mb-6">
                      Are you sure you want to delete <span className="font-semibold text-white">{deleteTarget.name}</span>? 
                      This action cannot be undone and will permanently remove all their data.
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
                    Delete {deleteTarget.type === 'admin' ? 'Admin' : 'User'}
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
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-white">Confirm Deletion</h3>
                      <p className="text-sm text-gray-300">This action cannot be undone</p>
                    </div>
                  </div>
                  <button
                    onClick={cancelContactDelete}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-red-500 to-red-600 mb-4">
                      <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">
                      Delete Contact Submission
                    </h3>
                    <p className="text-sm text-gray-300 mb-6">
                      Are you sure you want to delete the contact submission from <span className="font-semibold text-white">{contactDeleteTarget.name}</span>? 
                      This action cannot be undone and will permanently remove all their contact data.
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

        {/* Profile Edit Modal */}
        {showProfileEdit && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center modal-backdrop">
            <div className="relative mx-auto p-0 w-full max-w-md">
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 transform transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/20">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-white">{t('updateProfile')}</h3>
                      <p className="text-sm text-gray-300">Update your profile information</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowProfileEdit(false)}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Form */}
                <form onSubmit={handleUpdateProfile} className="px-6 py-4">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                        {t('username')}
                      </label>
                      <input
                        type="text"
                        id="username"
                        value={profileForm.username}
                        onChange={(e) => setProfileForm({...profileForm, username: e.target.value})}
                        className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1">
                        {t('firstName')}
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                        className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">
                        {t('lastName')}
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                        className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                        {t('email')}
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                        className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-white/20">
                    <button
                      type="button"
                      onClick={() => setShowProfileEdit(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 border border-transparent rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                    >
                      {t('updateProfile')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Password Change Modal */}
        {showPasswordChange && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[9999] flex items-center justify-center modal-backdrop">
            <div className="relative mx-auto p-0 w-full max-w-md">
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 transform transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/20">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-white">{t('changePassword')}</h3>
                      <p className="text-sm text-gray-300">Update your password</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPasswordChange(false)}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Form */}
                <form onSubmit={handleChangePassword} className="px-6 py-4">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                        className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-white/20">
                    <button
                      type="button"
                      onClick={() => setShowPasswordChange(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 border border-transparent rounded-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                    >
                      {t('changePassword')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

