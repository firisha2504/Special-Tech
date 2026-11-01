import React, { useState, useEffect, useRef } from 'react';
import { adminApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building,
  FileText,
  Calendar,
  Clock,
  Shield,
  ShieldCheck,
  Key,
  Lock,
  Camera,
  Trash2,
  Edit2,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
  Activity,
  Upload,
  X,
  Sparkles,
  Info,
} from 'lucide-react';

export const AdminProfileManager = () => {
  const { user, updateUser, updateToken } = useAuth();

  // State
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }

  // Personal Info Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    jobTitle: '',
    department: '',
    bio: '',
  });

  // Password Management State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  // Photo Upload & Preview State
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showDeletePhotoModal, setShowDeletePhotoModal] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState(false);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch full profile from API
  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getProfile();
      if (res.data?.success) {
        const p = res.data.profile;
        setProfile(p);
        setFormData({
          name: p.name || '',
          phone: p.phone || '',
          jobTitle: p.jobTitle || '',
          department: p.department || '',
          bio: p.bio || '',
        });
        // Sync with global auth user context
        if (updateUser) {
          updateUser({
            name: p.name,
            avatar: p.avatar,
            role: p.role,
            isSuperAdmin: p.isSuperAdmin,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Format Dates
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not available';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Not available';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Password Strength Calculation
  const checkPasswordStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    return {
      score,
      isMinLength: pass.length >= 8,
      hasUpper: /[A-Z]/.test(pass),
      hasLower: /[a-z]/.test(pass),
      hasNumber: /[0-9]/.test(pass),
      hasSpecial: /[^A-Za-z0-9]/.test(pass),
    };
  };

  const strength = checkPasswordStrength(passwordData.newPassword);

  // Handle Photo File Pick
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setToast({
        type: 'error',
        message: 'Unsupported image format. Please select a JPEG, PNG, or WebP image.',
      });
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToast({
        type: 'error',
        message: 'Image size exceeds 5MB limit. Please choose a smaller photo.',
      });
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  // Upload Selected Photo
  const handleUploadPhoto = async () => {
    if (!selectedFile) return;
    setUploadingPhoto(true);
    try {
      const data = new FormData();
      data.append('photo', selectedFile);

      const res = await adminApi.uploadProfilePhoto(data);
      if (res.data?.success) {
        const newAvatar = res.data.avatar;
        setProfile((prev) => ({ ...prev, avatar: newAvatar }));
        if (updateUser) {
          updateUser({ avatar: newAvatar });
        }
        setToast({ type: 'success', message: 'Profile photo updated successfully!' });
        setSelectedFile(null);
        setPreviewUrl(null);
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      setToast({
        type: 'error',
        message: err.response?.data?.message || 'Failed to upload profile photo',
      });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove Photo
  const handleRemovePhoto = async () => {
    setRemovingPhoto(true);
    try {
      const res = await adminApi.removeProfilePhoto();
      if (res.data?.success) {
        setProfile((prev) => ({ ...prev, avatar: null }));
        if (updateUser) {
          updateUser({ avatar: null });
        }
        setToast({ type: 'success', message: 'Profile photo removed. Default avatar restored.' });
        setShowDeletePhotoModal(false);
      }
    } catch (err) {
      console.error('Photo removal error:', err);
      setToast({
        type: 'error',
        message: err.response?.data?.message || 'Failed to remove profile photo',
      });
    } finally {
      setRemovingPhoto(false);
    }
  };

  // Save Personal Info
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setToast({ type: 'error', message: 'Full name cannot be empty.' });
      return;
    }

    setSavingProfile(true);
    try {
      const res = await adminApi.updateProfile(formData);
      if (res.data?.success) {
        const updated = res.data.profile;
        setProfile((prev) => ({ ...prev, ...updated }));
        if (updateUser) {
          updateUser({ name: updated.name });
        }
        setToast({ type: 'success', message: 'Personal profile updated successfully!' });
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setToast({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update profile information',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (!strength.hasUpper || !strength.hasLower || !strength.hasNumber) {
      setPasswordError('Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number.');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await adminApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.data?.success) {
        setPasswordSuccess('Your password has been changed securely.');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        if (res.data.token && updateToken) {
          updateToken(res.data.token);
        }
        setToast({ type: 'success', message: 'Password updated successfully!' });
      }
    } catch (err) {
      console.error('Change password error:', err);
      setPasswordError(err.response?.data?.message || 'Failed to change password. Please check your current password.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-500 dark:text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue dark:text-brand-cyan" />
        <p className="text-sm font-medium">Loading administrator profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 space-y-3">
        <div className="flex items-center gap-2 font-bold text-base">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>Profile Unavailable</span>
        </div>
        <p className="text-sm">{error}</p>
        <button
          type="button"
          onClick={fetchProfile}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const isSuper = Boolean(profile?.isSuperAdmin || profile?.role === 'SUPER_ADMIN');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Banner */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold transition-all duration-300 animate-in slide-in-from-bottom-3 ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 hover:opacity-80 p-0.5 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Invisible file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 1. PROFILE HEADER CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-6 sm:p-8">
        {/* Subtle Background Accent Gradient */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-gradient-to-br from-brand-blue/10 via-cyan-400/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Avatar and Identity */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full md:w-auto">
            {/* Avatar with Camera Trigger Overlay */}
            <div className="relative group flex-shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden ring-4 ring-white dark:ring-slate-900 shadow-md bg-gradient-to-tr from-brand-blue to-cyan-400 flex items-center justify-center text-white font-extrabold text-3xl">
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{profile?.name ? profile.name.charAt(0).toUpperCase() : 'A'}</span>
                )}
              </div>

              {/* Camera Hover Overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload Profile Photo"
                className="absolute inset-0 rounded-3xl bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer gap-1"
              >
                <Camera className="w-6 h-6" />
                <span className="text-[10px] font-bold tracking-wider uppercase">Change</span>
              </button>

              {/* Status Dot */}
              <span
                title={profile?.isActive ? 'Active Administrator' : 'Inactive Account'}
                className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900 shadow-xs"
              />
            </div>

            {/* Title & Badges */}
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {profile?.name || 'Administrator'}
                </h1>

                {/* Role Badge */}
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold tracking-wide ${
                    isSuper
                      ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      : 'bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue dark:text-brand-cyan border border-brand-blue/30'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{isSuper ? 'Super Administrator' : 'Administrator'}</span>
                </div>

                {/* Status Badge */}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Active</span>
                </span>
              </div>

              {/* Email & Subtitle */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 font-mono">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profile?.email}</span>
                </span>
                {profile?.jobTitle && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span>{profile.jobTitle}</span>
                  </span>
                )}
                {profile?.department && (
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{profile.department}</span>
                  </span>
                )}
              </div>

              {/* Bio summary */}
              {profile?.bio && (
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl line-clamp-2 leading-relaxed pt-1">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
            {profile?.avatar && (
              <button
                type="button"
                onClick={() => setShowDeletePhotoModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                title="Remove current profile photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Photo</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-brand-blue dark:text-brand-cyan" />
              <span>{profile?.avatar ? 'Change Photo' : 'Upload Photo'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                isEditing
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700'
                  : 'bg-brand-blue hover:bg-blue-600 text-white shadow-brand-blue/20'
              }`}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Editing' : 'Edit Profile'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* PHOTO PREVIEW MODAL (Appears after file selection before upload) */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-brand-blue dark:text-brand-cyan" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Preview Profile Photo</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl(null);
                  setSelectedFile(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-3 py-2">
              <div className="w-32 h-32 rounded-3xl overflow-hidden ring-4 ring-brand-blue/20 shadow-lg">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                File: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedFile?.name}</span> ({(selectedFile?.size / 1024).toFixed(1)} KB)
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={uploadingPhoto}
                onClick={() => {
                  setPreviewUrl(null);
                  setSelectedFile(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={uploadingPhoto}
                onClick={handleUploadPhoto}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-brand-blue hover:bg-blue-600 text-white transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
              >
                {uploadingPhoto ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Save Photo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE PHOTO MODAL */}
      {showDeletePhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Remove Profile Photo?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Your custom uploaded photo will be deleted and your profile will revert to the default initial avatar.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={removingPhoto}
                onClick={() => setShowDeletePhotoModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={removingPhoto}
                onClick={handleRemovePhoto}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer disabled:opacity-60"
              >
                {removingPhoto ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <span>Yes, Remove Photo</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKSPACE ON DESKTOP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Personal Info & Password Management (2 Cols wide on desktop) */}
        <div className="lg:col-span-2 space-y-8">
          {/* PERSONAL INFORMATION CARD */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-blue/10 dark:bg-brand-blue/20 text-brand-blue dark:text-brand-cyan">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Profile Information</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Personal administrative credentials and directory details</p>
                </div>
              </div>

              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue dark:text-brand-cyan hover:underline cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>
              )}
            </div>

            {isEditing ? (
              /* EDIT MODE FORM */
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Full Name <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                    />
                  </div>

                  {/* Email (Read-only System Guard) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>Email Address</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Read-Only</span>
                    </label>
                    <input
                      type="email"
                      disabled
                      value={profile?.email || ''}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/30 text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed select-none"
                    />
                    <p className="text-[10px] text-slate-400">Primary authentication email identifier</p>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Phone Number</span>
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +1 (555) 019-2834"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                    />
                  </div>

                  {/* Job Title */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      <span>Job Title</span>
                    </label>
                    <input
                      type="text"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      placeholder="e.g. Lead Enterprise Architect"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                    />
                  </div>

                  {/* Department */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>Department / Unit</span>
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g. Cloud Infrastructure & Platform Engineering"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                    />
                  </div>

                  {/* Biography */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Biography</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formData.bio.length} / 500 characters
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={500}
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Brief description of your role, focus areas, and operational responsibilities..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue leading-relaxed resize-none"
                    />
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={savingProfile}
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: profile?.name || '',
                        phone: profile?.phone || '',
                        jobTitle: profile?.jobTitle || '',
                        department: profile?.department || '',
                        bio: profile?.bio || '',
                      });
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-brand-blue hover:bg-blue-600 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-60"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Profile</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* VIEW MODE DETAILS (Two-Column Clean Layout) */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 text-xs">
                {/* Full Name */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Full Name</span>
                  <div className="text-slate-900 dark:text-white font-bold text-sm">
                    {profile?.name || 'Administrator'}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Email Address</span>
                  <div className="text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                    <span>{profile?.email}</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 font-sans font-semibold">
                      Verified
                    </span>
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Phone Number</span>
                  <div className="text-slate-900 dark:text-white font-mono">
                    {profile?.phone || <span className="text-slate-400 italic">Unspecified</span>}
                  </div>
                </div>

                {/* Job Title */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Job Title</span>
                  <div className="text-slate-900 dark:text-white font-semibold">
                    {profile?.jobTitle || <span className="text-slate-400 italic font-normal">Unspecified</span>}
                  </div>
                </div>

                {/* Department */}
                <div className="space-y-1 sm:col-span-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Department</span>
                  <div className="text-slate-900 dark:text-white font-semibold">
                    {profile?.department || <span className="text-slate-400 italic font-normal">Unspecified</span>}
                  </div>
                </div>

                {/* Biography */}
                <div className="space-y-1 sm:col-span-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Biography</span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {profile?.bio || <span className="text-slate-400 italic font-normal">No biography provided yet. Click "Edit Details" to add a bio.</span>}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* SECURITY & PASSWORD MANAGEMENT CARD */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-6 sm:p-7 space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="p-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Security & Password Management</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Update your account authentication credentials</p>
              </div>
            </div>

            {/* Error or Success feedback */}
            {passwordError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-5">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  <span>Current Password <span className="text-rose-500">*</span></span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Enter your existing account password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>New Password <span className="text-rose-500">*</span></span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="At least 8 characters"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Confirm New Password <span className="text-rose-500">*</span></span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Re-enter new password"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Real-time Password Strength Criteria */}
              {passwordData.newPassword && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Password Strength</span>
                    <span
                      className={`font-bold ${
                        strength.score <= 2
                          ? 'text-rose-500'
                          : strength.score === 3
                          ? 'text-amber-500'
                          : 'text-emerald-500'
                      }`}
                    >
                      {strength.score <= 2 ? 'Weak' : strength.score === 3 ? 'Moderate' : 'Strong'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        strength.score <= 2
                          ? 'bg-rose-500 w-1/3'
                          : strength.score === 3
                          ? 'bg-amber-500 w-2/3'
                          : 'bg-emerald-500 w-full'
                      }`}
                    />
                  </div>

                  {/* Checklist */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] pt-1">
                    <span className={`flex items-center gap-1.5 ${strength.isMinLength ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      <Check className="w-3 h-3" /> At least 8 characters
                    </span>
                    <span className={`flex items-center gap-1.5 ${strength.hasUpper ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      <Check className="w-3 h-3" /> 1 uppercase letter
                    </span>
                    <span className={`flex items-center gap-1.5 ${strength.hasLower ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      <Check className="w-3 h-3" /> 1 lowercase letter
                    </span>
                    <span className={`flex items-center gap-1.5 ${strength.hasNumber ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      <Check className="w-3 h-3" /> 1 numeric digit
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer shadow-xs disabled:opacity-60"
                >
                  {savingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-3.5 h-3.5" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Role & Permissions + Account Activity (1 Col wide on desktop) */}
        <div className="space-y-8">
          {/* ROLE & PERMISSION CARD */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="p-2 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-500">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Role & Permissions</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Access policies & scope</p>
              </div>
            </div>

            {/* Current Role Banner */}
            <div
              className={`p-4 rounded-2xl border ${
                isSuper
                  ? 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20'
                  : 'bg-gradient-to-br from-brand-blue/10 via-brand-blue/5 to-transparent border-brand-blue/20'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                <Shield className={`w-4 h-4 ${isSuper ? 'text-amber-500' : 'text-brand-blue dark:text-brand-cyan'}`} />
                <span>{isSuper ? 'Super Administrator' : 'Administrator'}</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                {isSuper
                  ? 'Full administrative control over all platform modules, system settings, database backups, and user management.'
                  : 'Scoped role with permissions granted by Super Administrator. Cannot be self-modified.'}
              </p>
            </div>

            {/* Permissions List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Active Permissions</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {isSuper ? 'All Active' : `${profile?.permissions?.length || 0} granted`}
                </span>
              </div>

              {isSuper ? (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Unrestricted Global Access</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    You have unrestricted access to all 14 administrative modules including AI discovery, backup export, and admin authorization.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {Array.isArray(profile?.permissionDetails) && profile.permissionDetails.length > 0 ? (
                    profile.permissionDetails.map((perm) => (
                      <div
                        key={perm.id || perm.slug}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 flex items-start gap-2 text-xs"
                      >
                        <Check className="w-3.5 h-3.5 text-brand-blue dark:text-brand-cyan mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{perm.name}</div>
                          {perm.description && (
                            <div className="text-[10px] text-slate-400 truncate">{perm.description}</div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-400 text-xs italic text-center">
                      No granular permissions currently assigned.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ACCOUNT STATUS & AUDIT TRAIL CARD */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="p-2 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-500">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Account Security & Activity</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Audit logs & session telemetry</p>
              </div>
            </div>

            {/* Key Telemetry Stats */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Account Created</span>
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatDate(profile?.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Last Login</span>
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatDateTime(profile?.lastLoginAt)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Account Status</span>
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Active
                </span>
              </div>
            </div>

            {/* Recent Account Activity Log */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Recent Account Activity</span>
                <span className="text-[10px] text-slate-400 font-mono">Immutable Audit Logs</span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {Array.isArray(profile?.recentActivity) && profile.recentActivity.length > 0 ? (
                  profile.recentActivity.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatTimeAgo(log.createdAt)}
                        </span>
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 flex items-center justify-between text-[10px]">
                        <span>IP: {log.ipAddress || 'Internal'}</span>
                        <span>{formatDateTime(log.createdAt)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400 italic">
                    No recent activity logged.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfileManager;
