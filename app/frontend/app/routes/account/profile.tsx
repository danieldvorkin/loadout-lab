import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useMutation, useQuery } from '@apollo/client/react';
import { useAuth } from '../../lib/auth-context';
import { UPDATE_USER_PROFILE, GET_USER_PROFILE } from '../../lib/graphql-operations';

export function meta() {
  return [
    { title: "Edit Profile - Loadout Lab" },
    { name: "description", content: "Update your Loadout Lab profile information" },
  ];
}

const DISCIPLINES = [
  { value: '', label: 'Select a discipline' },
  { value: 'prs', label: 'PRS (Precision Rifle Series)' },
  { value: 'nrl', label: 'NRL (National Rifle League)' },
  { value: 'hunting', label: 'Hunting' },
  { value: 'long_range', label: 'Long Range Shooting' },
  { value: 'tactical', label: 'Tactical' },
  { value: 'benchrest', label: 'Benchrest' },
];

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  
  const { data, loading: profileLoading } = useQuery(GET_USER_PROFILE, {
    skip: !isAuthenticated,
    fetchPolicy: 'network-only',
  });

  const [updateProfile, { loading: updating }] = useMutation(UPDATE_USER_PROFILE);

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    phoneNumber: '',
    bio: '',
    location: '',
    dateOfBirth: '',
    preferredDiscipline: '',
    website: '',
    socialLinks: {
      instagram: '',
      youtube: '',
      facebook: '',
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (data?.currentUser) {
      const userData = data.currentUser;
      setFormData({
        username: userData.username || '',
        fullName: userData.fullName || '',
        phoneNumber: userData.phoneNumber || '',
        bio: userData.bio || '',
        location: userData.location || '',
        dateOfBirth: userData.dateOfBirth || '',
        preferredDiscipline: userData.preferredDiscipline || '',
        website: userData.website || '',
        socialLinks: {
          instagram: userData.socialLinks?.instagram || '',
          youtube: userData.socialLinks?.youtube || '',
          facebook: userData.socialLinks?.facebook || '',
        },
      });
    }
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors([]);
    setSuccessMessage('');
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value },
    }));
    setErrors([]);
    setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSuccessMessage('');

    try {
      const { data: result } = await updateProfile({
        variables: {
          username: formData.username || null,
          fullName: formData.fullName || null,
          phoneNumber: formData.phoneNumber || null,
          bio: formData.bio || null,
          location: formData.location || null,
          dateOfBirth: formData.dateOfBirth || null,
          preferredDiscipline: formData.preferredDiscipline || null,
          website: formData.website || null,
          socialLinks: formData.socialLinks,
        },
      });

      if (result?.updateUserProfile?.errors?.length > 0) {
        setErrors(result.updateUserProfile.errors);
      } else if (result?.updateUserProfile?.user) {
        updateUser(result.updateUserProfile.user);
        setSuccessMessage('Profile updated successfully!');
      }
    } catch (error) {
      setErrors([(error as Error).message]);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 rounded-full bg-sky-500 animate-pulse"></div>
          <div className="text-lg text-slate-600 font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                  🎯 Loadout Lab
                </h1>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/account" className="text-sm text-slate-600 hover:text-sky-600 transition-colors">
                ← Back to Settings
              </Link>
              <button
                onClick={logout}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <nav className="flex items-center text-sm text-slate-500 mb-4">
            <Link to="/account" className="hover:text-sky-600 transition-colors">Account</Link>
            <ChevronRightIcon className="w-4 h-4 mx-2" />
            <span className="text-slate-800 font-medium">Profile</span>
          </nav>
          <h1 className="text-3xl font-bold text-slate-800">Edit Profile</h1>
          <p className="mt-2 text-slate-600">Update your personal information and public profile</p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 rounded-xl bg-green-50 border border-green-200 p-4">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">{successMessage}</span>
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
            <div className="flex gap-3">
              <ExclamationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-800 font-medium">There were errors with your submission</h3>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Avatar Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Profile Picture</h2>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold">
                {user.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-sm text-slate-600">
                  Your avatar is generated from your username. Custom avatar uploads coming soon!
                </p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-slate-800"
                  placeholder="Your unique username"
                />
              </div>

              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-slate-800"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-slate-500">Email cannot be changed</p>
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-slate-800"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-slate-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-slate-800"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-slate-800"
                  placeholder="City, State/Country"
                />
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="bio" className="block text-sm font-medium text-slate-700 mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-slate-800 resize-none"
                placeholder="Tell us about yourself and your shooting experience..."
              />
              <p className="mt-1 text-xs text-slate-500">{formData.bio.length}/500 characters</p>
            </div>
          </div>

          {/* Shooting Preferences */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">Shooting Preferences</h2>
            <div>
              <label htmlFor="preferredDiscipline" className="block text-sm font-medium text-slate-700 mb-2">
                Preferred Discipline
              </label>
              <select
                id="preferredDiscipline"
                name="preferredDiscipline"
                value={formData.preferredDiscipline}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-slate-800 bg-white"
              >
                {DISCIPLINES.map(discipline => (
                  <option key={discipline.value} value={discipline.value}>
                    {discipline.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">Website & Social Links</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-slate-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-slate-800"
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div>
                <label htmlFor="instagram" className="block text-sm font-medium text-slate-700 mb-2">
                  Instagram
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                  <input
                    type="text"
                    id="instagram"
                    value={formData.socialLinks.instagram}
                    onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-slate-800"
                    placeholder="username"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="youtube" className="block text-sm font-medium text-slate-700 mb-2">
                  YouTube Channel
                </label>
                <input
                  type="url"
                  id="youtube"
                  value={formData.socialLinks.youtube}
                  onChange={(e) => handleSocialLinkChange('youtube', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-slate-800"
                  placeholder="https://youtube.com/@yourchannel"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link
              to="/account"
              className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={updating}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-medium hover:from-sky-600 hover:to-indigo-600 shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Icons
function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ExclamationCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  );
}
