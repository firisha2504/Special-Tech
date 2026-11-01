import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Key,
  Users,
  Save,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Download,
  Info,
  Check,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { rbacApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const AdminPermissionManager = () => {
  const { user: currentUser } = useAuth();

  // Data states
  const [admins, setAdmins] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); // ALL | SUPER_ADMIN | ADMIN
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | ACTIVE | INACTIVE

  // Permission selection state for the selected admin
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());
  const [originalPermissions, setOriginalPermissions] = useState(new Set());

  // Modals & Notifications
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }

  // Create Admin Form State
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ADMIN',
    isSuperAdmin: false,
    permissions: [],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [exportingBackup, setExportingBackup] = useState(false);

  const showNotify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Fetch all admins and system permissions
  const fetchData = async () => {
    try {
      setLoading(true);
      const [permsRes, usersRes] = await Promise.all([
        rbacApi.getPermissions(),
        rbacApi.getUsers(),
      ]);

      if (permsRes.data.success) {
        setPermissions(permsRes.data.data || []);
        setGroupedPermissions(permsRes.data.grouped || {});
      }

      if (usersRes.data.success) {
        const adminList = usersRes.data.data || [];
        setAdmins(adminList);

        // Select first admin by default or preserve selection
        if (adminList.length > 0) {
          const target = selectedAdminId
            ? adminList.find((a) => a.id === selectedAdminId) || adminList[0]
            : adminList[0];
          setSelectedAdminId(target.id);
          const permsSet = new Set(target.permissions || []);
          setSelectedPermissions(new Set(permsSet));
          setOriginalPermissions(new Set(permsSet));
        }
      }
    } catch (err) {
      showNotify('error', err.response?.data?.message || 'Failed to load permissions and administrators.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // When selected admin changes, update permission selection set
  const selectedAdmin = useMemo(() => {
    return admins.find((a) => a.id === selectedAdminId) || null;
  }, [admins, selectedAdminId]);

  const selectAdmin = (admin) => {
    setSelectedAdminId(admin.id);
    const permsSet = new Set(admin.permissions || []);
    setSelectedPermissions(new Set(permsSet));
    setOriginalPermissions(new Set(permsSet));
  };

  // Check if current user has unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!selectedAdmin || selectedAdmin.isSuperAdmin) return false;
    if (selectedPermissions.size !== originalPermissions.size) return true;
    for (const slug of selectedPermissions) {
      if (!originalPermissions.has(slug)) return true;
    }
    return false;
  }, [selectedAdmin, selectedPermissions, originalPermissions]);

  // Permission toggles
  const handleTogglePermission = (slug) => {
    if (selectedAdmin?.isSuperAdmin) return;
    const next = new Set(selectedPermissions);
    if (next.has(slug)) {
      next.delete(slug);
    } else {
      next.add(slug);
    }
    setSelectedPermissions(next);
  };

  const handleToggleGroup = (category) => {
    if (selectedAdmin?.isSuperAdmin) return;
    const groupPerms = groupedPermissions[category] || [];
    const groupSlugs = groupPerms.map((p) => p.slug);
    const allSelected = groupSlugs.every((s) => selectedPermissions.has(s));

    const next = new Set(selectedPermissions);
    if (allSelected) {
      groupSlugs.forEach((s) => next.delete(s));
    } else {
      groupSlugs.forEach((s) => next.add(s));
    }
    setSelectedPermissions(next);
  };

  const handleSelectAll = () => {
    if (selectedAdmin?.isSuperAdmin) return;
    const allSlugs = permissions.map((p) => p.slug);
    setSelectedPermissions(new Set(allSlugs));
  };

  const handleClearAll = () => {
    if (selectedAdmin?.isSuperAdmin) return;
    setSelectedPermissions(new Set());
  };

  // Save Permissions
  const handleSavePermissions = async () => {
    if (!selectedAdmin) return;
    try {
      setSaving(true);
      const permArray = Array.from(selectedPermissions);
      const res = await rbacApi.updatePermissions(selectedAdmin.id, {
        permissions: permArray,
      });

      if (res.data.success) {
        showNotify('success', res.data.message || 'Permissions updated successfully.');
        setOriginalPermissions(new Set(selectedPermissions));
        // Refresh admin list in state
        setAdmins((prev) =>
          prev.map((a) =>
            a.id === selectedAdmin.id
              ? { ...a, permissions: permArray, permissionCount: permArray.length }
              : a
          )
        );
      }
    } catch (err) {
      showNotify('error', err.response?.data?.message || 'Failed to update permissions.');
    } finally {
      setSaving(false);
      setIsConfirmModalOpen(false);
    }
  };

  // Toggle Account Active / Inactive Status
  const handleToggleStatus = async (admin) => {
    const nextStatus = !admin.isActive;
    try {
      const res = await rbacApi.updateStatus(admin.id, { isActive: nextStatus });
      if (res.data.success) {
        showNotify('success', res.data.message);
        setAdmins((prev) =>
          prev.map((a) => (a.id === admin.id ? { ...a, isActive: nextStatus } : a))
        );
      }
    } catch (err) {
      showNotify('error', err.response?.data?.message || 'Status update failed.');
    }
  };

  // Delete Admin
  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;
    try {
      const res = await rbacApi.deleteUser(adminToDelete.id);
      if (res.data.success) {
        showNotify('success', res.data.message);
        setAdmins((prev) => prev.filter((a) => a.id !== adminToDelete.id));
        if (selectedAdminId === adminToDelete.id) {
          const remaining = admins.filter((a) => a.id !== adminToDelete.id);
          if (remaining.length > 0) {
            selectAdmin(remaining[0]);
          } else {
            setSelectedAdminId(null);
          }
        }
      }
    } catch (err) {
      showNotify('error', err.response?.data?.message || 'Deletion failed.');
    } finally {
      setIsDeleteModalOpen(false);
      setAdminToDelete(null);
    }
  };

  // Create Admin Submission
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!createForm.name || !createForm.email || !createForm.password) {
      showNotify('error', 'Please fill in all required fields.');
      return;
    }
    if (createForm.password.length < 8) {
      showNotify('error', 'Password must be at least 8 characters long.');
      return;
    }

    try {
      setCreating(true);
      const isSuper = createForm.role === 'SUPER_ADMIN';
      const payload = {
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        role: isSuper ? 'SUPER_ADMIN' : 'ADMIN',
        isSuperAdmin: isSuper,
        permissions: isSuper ? [] : createForm.permissions,
      };

      const res = await rbacApi.createUser(payload);
      if (res.data.success) {
        showNotify('success', res.data.message);
        setIsCreateModalOpen(false);
        setCreateForm({
          name: '',
          email: '',
          password: '',
          role: 'ADMIN',
          isSuperAdmin: false,
          permissions: [],
        });
        await fetchData();
      }
    } catch (err) {
      showNotify('error', err.response?.data?.message || 'Failed to create admin account.');
    } finally {
      setCreating(false);
    }
  };

  // Database Snapshot Export
  const handleExportBackup = async () => {
    try {
      setExportingBackup(true);
      const res = await rbacApi.exportBackup();
      if (res.data.success && res.data.backup) {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data.backup, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `special_tech_backup_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showNotify('success', 'Database backup snapshot exported successfully.');
      }
    } catch (err) {
      showNotify('error', err.response?.data?.message || 'Failed to export backup.');
    } finally {
      setExportingBackup(false);
    }
  };

  // Filtered admin accounts
  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const matchesSearch =
        admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole =
        roleFilter === 'ALL'
          ? true
          : roleFilter === 'SUPER_ADMIN'
          ? admin.isSuperAdmin || admin.role === 'SUPER_ADMIN'
          : !admin.isSuperAdmin && admin.role !== 'SUPER_ADMIN';

      const matchesStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'ACTIVE'
          ? admin.isActive
          : !admin.isActive;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [admins, searchQuery, roleFilter, statusFilter]);

  if (loading && admins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-blue mb-3" />
        <p className="text-sm">Loading Role-Based Access Control matrix...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border transition-all shadow-lg animate-in fade-in slide-in-from-top-2 duration-300 ${
            notification.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/60 border-red-500/40 text-red-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header with Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue dark:text-cyan-400 border border-brand-blue/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Role-Based Access Control & Permissions
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure administrative privileges, manage accounts, and assign granular feature permissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Export Backup Button */}
          <button
            onClick={handleExportBackup}
            disabled={exportingBackup}
            title="Download complete PostgreSQL state snapshot"
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-300/60 dark:border-slate-700"
          >
            <Download className={`w-3.5 h-3.5 ${exportingBackup ? 'animate-bounce' : ''}`} />
            <span>{exportingBackup ? 'Exporting...' : 'Export DB Backup'}</span>
          </button>

          {/* Create Admin Button (Super Admin Only) */}
          {currentUser?.isSuperAdmin && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-brand-blue hover:bg-blue-600 text-white transition-all shadow-md shadow-brand-blue/25"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Administrator</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Split Layout: Admin List (Left) & Permissions Matrix (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Admin Accounts List (4 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-[#020D20] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-blue dark:text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                Administrators ({filteredAdmins.length})
              </h2>
            </div>
            <button
              onClick={fetchData}
              title="Refresh administrator list"
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <button
              onClick={() => setRoleFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                roleFilter === 'ALL'
                  ? 'bg-brand-blue text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Roles
            </button>
            <button
              onClick={() => setRoleFilter('SUPER_ADMIN')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                roleFilter === 'SUPER_ADMIN'
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Super Admins
            </button>
            <button
              onClick={() => setRoleFilter('ADMIN')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                roleFilter === 'ADMIN'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Admins
            </button>
          </div>

          {/* Admin Accounts List */}
          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {filteredAdmins.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No administrator accounts match your criteria.
              </div>
            ) : (
              filteredAdmins.map((admin) => {
                const isSelected = selectedAdminId === admin.id;
                const isSuper = admin.isSuperAdmin || admin.role === 'SUPER_ADMIN';

                return (
                  <div
                    key={admin.id}
                    onClick={() => selectAdmin(admin)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-brand-blue/10 dark:bg-brand-blue/20 border-brand-blue dark:border-cyan-500/60 shadow-xs'
                        : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/70 dark:border-slate-800/60 hover:bg-slate-100/70 dark:hover:bg-slate-850/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div
                            className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center text-white ${
                              isSuper
                                ? 'bg-gradient-to-tr from-amber-500 to-amber-300'
                                : 'bg-gradient-to-tr from-brand-blue to-cyan-400'
                            }`}
                          >
                            {admin.name.charAt(0).toUpperCase()}
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                              admin.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {admin.name}
                            </span>
                            {admin.id === currentUser?.id && (
                              <span className="text-[9px] font-mono font-semibold px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                            {admin.email}
                          </div>
                        </div>
                      </div>

                      {/* Role Pill */}
                      {isSuper ? (
                        <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          Super
                        </span>
                      ) : (
                        <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue dark:text-cyan-400 border border-brand-blue/30">
                          Admin
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      <span>
                        {isSuper
                          ? 'Full Permissions (14/14)'
                          : `${admin.permissionCount || 0} permissions granted`}
                      </span>
                      <span className={admin.isActive ? 'text-emerald-500 font-medium' : 'text-rose-500 font-medium'}>
                        {admin.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Permission Matrix for Selected Admin (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white dark:bg-[#020D20] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs space-y-6">
          {selectedAdmin ? (
            <>
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl font-extrabold text-base flex items-center justify-center text-white shadow-sm ${
                      selectedAdmin.isSuperAdmin
                        ? 'bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300'
                        : 'bg-gradient-to-tr from-brand-blue to-cyan-400'
                    }`}
                  >
                    {selectedAdmin.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {selectedAdmin.name}
                      </h3>
                      {selectedAdmin.isSuperAdmin ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Super Admin
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-blue/20 text-brand-blue dark:text-cyan-400 border border-brand-blue/30 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Delegated Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      {selectedAdmin.email} • Added on {new Date(selectedAdmin.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Account Actions (Active toggle, Delete) */}
                {currentUser?.isSuperAdmin && (
                  <div className="flex items-center gap-2">
                    {/* Toggle Active Status Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(selectedAdmin)}
                      title={selectedAdmin.isActive ? 'Deactivate this account' : 'Activate this account'}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 ${
                        selectedAdmin.isActive
                          ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                      }`}
                    >
                      {selectedAdmin.isActive ? (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span>Deactivate</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Activate</span>
                        </>
                      )}
                    </button>

                    {/* Delete Admin Button */}
                    {selectedAdmin.id !== currentUser?.id && (
                      <button
                        type="button"
                        onClick={() => {
                          setAdminToDelete(selectedAdmin);
                          setIsDeleteModalOpen(true);
                        }}
                        title="Permanently remove admin account"
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors border border-transparent hover:border-rose-500/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Status Banner for Super Admins */}
              {selectedAdmin.isSuperAdmin ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <p className="font-bold text-amber-600 dark:text-amber-300">
                      Full System Access Unlocked
                    </p>
                    <p className="mt-0.5 text-slate-600 dark:text-amber-200/80">
                      Super Administrators automatically possess all administrative privileges across all modules, including user management, backup exports, and system settings. Feature permissions cannot be restricted for Super Admins.
                    </p>
                  </div>
                </div>
              ) : (
                /* Admin Quick Controls & Status */
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      Granted Privileges:
                    </span>
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue dark:text-cyan-400 border border-brand-blue/20">
                      {selectedPermissions.size} / {permissions.length} Active
                    </span>
                    {hasUnsavedChanges && (
                      <span className="font-semibold text-amber-500 animate-pulse flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Unsaved Changes
                      </span>
                    )}
                  </div>

                  {currentUser?.isSuperAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        Grant All
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        Revoke All
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Permission Matrix by Category */}
              <div className="space-y-4">
                {Object.entries(groupedPermissions).map(([category, perms]) => {
                  const allCategorySelected = perms.every((p) =>
                    selectedAdmin.isSuperAdmin || selectedPermissions.has(p.slug)
                  );

                  return (
                    <div
                      key={category}
                      className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/20 p-4 space-y-3"
                    >
                      {/* Category Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-brand-blue dark:text-cyan-400" />
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            {category}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ({perms.length} {perms.length === 1 ? 'permission' : 'permissions'})
                          </span>
                        </div>

                        {!selectedAdmin.isSuperAdmin && currentUser?.isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => handleToggleGroup(category)}
                            className="text-[11px] text-brand-blue dark:text-cyan-400 hover:underline font-semibold"
                          >
                            {allCategorySelected ? 'Deselect Group' : 'Select Group'}
                          </button>
                        )}
                      </div>

                      {/* Permissions List Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {perms.map((perm) => {
                          const isGranted =
                            selectedAdmin.isSuperAdmin || selectedPermissions.has(perm.slug);

                          return (
                            <label
                              key={perm.slug}
                              onClick={(e) => {
                                if (selectedAdmin.isSuperAdmin || !currentUser?.isSuperAdmin) {
                                  e.preventDefault();
                                  return;
                                }
                              }}
                              className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                                selectedAdmin.isSuperAdmin || !currentUser?.isSuperAdmin
                                  ? 'cursor-default'
                                  : 'cursor-pointer'
                              } ${
                                isGranted
                                  ? 'bg-white dark:bg-slate-900/90 border-brand-blue/50 dark:border-cyan-500/40 shadow-xs'
                                  : 'bg-white/60 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/50 opacity-60 hover:opacity-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isGranted}
                                disabled={selectedAdmin.isSuperAdmin || !currentUser?.isSuperAdmin}
                                onChange={() => handleTogglePermission(perm.slug)}
                                className="mt-1 w-4 h-4 rounded text-brand-blue focus:ring-brand-blue border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors"
                              />

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {perm.name}
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-400 px-1 py-0.2 bg-slate-100 dark:bg-slate-800 rounded">
                                    {perm.slug}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                                  {perm.description || 'Access granted for this functional module.'}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Save Changes Bar */}
              {currentUser?.isSuperAdmin && !selectedAdmin.isSuperAdmin && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 pt-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {hasUnsavedChanges ? (
                      <span className="text-amber-500 font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        You have unsaved permission modifications.
                      </span>
                    ) : (
                      <span>All permission assignments are up to date.</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!hasUnsavedChanges || saving}
                      onClick={() => setSelectedPermissions(new Set(originalPermissions))}
                      className="px-3.5 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      disabled={!hasUnsavedChanges || saving}
                      onClick={() => setIsConfirmModalOpen(true)}
                      className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-brand-blue hover:bg-blue-600 text-white transition-all shadow-md shadow-brand-blue/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 text-slate-400 text-sm">
              Select an administrator from the list to inspect and configure permissions.
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal Before Saving Permissions */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#020D20] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-blue/10 text-brand-blue dark:text-cyan-400 border border-brand-blue/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Confirm Permission Updates
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target Account: {selectedAdmin?.name}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
              <p>
                <strong>Admin Email:</strong> {selectedAdmin?.email}
              </p>
              <p>
                <strong>Assigned Permissions:</strong> {selectedPermissions.size} of {permissions.length} modules
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                Changes will take effect immediately. The administrator will only be able to view and manage authorized modules upon saving.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSavePermissions}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-brand-blue hover:bg-blue-600 text-white transition-all shadow-md shadow-brand-blue/25"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? 'Applying Changes...' : 'Confirm & Save'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Administrator Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#020D20] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-blue/10 text-brand-blue dark:text-cyan-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Create New Administrator
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Add an internal staff member and assign their initial privileges.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sarah.jenkins@specialtech.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password (Minimum 8 characters) *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="Enter secure password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full pl-3.5 pr-10 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-blue"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Administrative Level *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      createForm.role === 'ADMIN'
                        ? 'bg-brand-blue/10 border-brand-blue text-brand-blue dark:text-cyan-400'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="ADMIN"
                      checked={createForm.role === 'ADMIN'}
                      onChange={() => setCreateForm({ ...createForm, role: 'ADMIN', isSuperAdmin: false })}
                      className="text-brand-blue"
                    />
                    <div>
                      <div className="text-xs font-bold">Admin</div>
                      <div className="text-[10px] opacity-75">Delegated Permissions</div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      createForm.role === 'SUPER_ADMIN'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-500 dark:text-amber-300'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="SUPER_ADMIN"
                      checked={createForm.role === 'SUPER_ADMIN'}
                      onChange={() => setCreateForm({ ...createForm, role: 'SUPER_ADMIN', isSuperAdmin: true, permissions: [] })}
                      className="text-amber-500"
                    />
                    <div>
                      <div className="text-xs font-bold">Super Admin</div>
                      <div className="text-[10px] opacity-75">Full System Access</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Initial Permissions Selection for Delegated Admins */}
              {createForm.role === 'ADMIN' && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Initial Permissions ({createForm.permissions.length} selected)
                  </label>
                  <div className="max-h-44 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 scrollbar-thin">
                    {permissions.map((p) => {
                      const isChecked = createForm.permissions.includes(p.slug);
                      return (
                        <label
                          key={p.slug}
                          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const next = isChecked
                                ? createForm.permissions.filter((slug) => slug !== p.slug)
                                : [...createForm.permissions, p.slug];
                              setCreateForm({ ...createForm, permissions: next });
                            }}
                            className="rounded text-brand-blue"
                          />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {p.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-brand-blue hover:bg-blue-600 text-white transition-all shadow-md shadow-brand-blue/25 disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{creating ? 'Creating Account...' : 'Create Admin'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Admin Confirmation Modal */}
      {isDeleteModalOpen && adminToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#020D20] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Delete Administrator Account
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete the account for{' '}
              <strong>{adminToDelete.name}</strong> ({adminToDelete.email})? All associated permission assignments will be removed.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setAdminToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAdmin}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-md shadow-rose-600/25"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPermissionManager;
