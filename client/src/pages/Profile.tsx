import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ContactMode } from '../types';
import api from '../api/client';
import { toast } from 'sonner';
import { User, Mail, Phone, ShieldCheck, Camera, Lock, Loader2, Save } from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [contactPreference, setContactPreference] = useState<ContactMode>(
    user?.contactPreference || ContactMode.WHATSAPP
  );
  const [savingProfile, setSavingProfile] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const { data } = await api.patch('/users/me', {
        fullName,
        phone,
        contactPreference,
      });
      updateUser(data);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const { data } = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(data);
      toast.success('Avatar updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload avatar');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      setChangingPassword(true);
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-display text-estate-900">Account Settings</h1>
        <p className="text-sm text-estate-500 mt-1">Manage your personal details, contact preferences, and credentials</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column - Avatar and summary */}
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="relative mb-4 group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-primary-100 border-2 border-primary-200 flex items-center justify-center text-2xl font-bold text-primary-700">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                user?.fullName?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full cursor-pointer shadow-md transition-transform group-hover:scale-105">
              <Camera className="w-4 h-4" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>

          <h3 className="font-bold text-estate-900 text-base">{user?.fullName}</h3>
          <p className="text-xs text-estate-500">{user?.email}</p>

          <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-primary-100 text-primary-800 uppercase tracking-wider">
              {user?.role}
            </span>
            {user?.phoneVerified ? (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified
              </span>
            ) : (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                Unverified Phone
              </span>
            )}
          </div>
        </div>

        {/* Right column - Form tabs */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Form */}
          <div className="card p-6">
            <h3 className="text-base font-bold text-estate-900 mb-4 pb-2 border-b border-estate-100">
              Personal Information
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-estate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-field pl-10 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                    Email (Read-only)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-estate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="input-field pl-10 text-sm bg-estate-50 text-estate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-estate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-field pl-10 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                  Preferred Contact Channel
                </label>
                <select
                  value={contactPreference}
                  onChange={(e) => setContactPreference(e.target.value as ContactMode)}
                  className="input-field text-sm"
                >
                  <option value={ContactMode.WHATSAPP}>WhatsApp (Recommended)</option>
                  <option value={ContactMode.CALL}>Direct Phone Call</option>
                  <option value={ContactMode.EMAIL}>Email Message</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn-primary text-sm flex items-center gap-2 py-2 px-5"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="card p-6">
            <h3 className="text-base font-bold text-estate-900 mb-4 pb-2 border-b border-estate-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-estate-600" />
              Security & Password
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-field text-sm"
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field text-sm"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-estate-600 mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="btn-outline text-sm flex items-center gap-2 py-2 px-5"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
