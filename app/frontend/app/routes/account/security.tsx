import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useMutation, useQuery } from '@apollo/client/react';
import { useAuth } from '../../lib/auth-context';
import { CHANGE_PASSWORD, DELETE_ACCOUNT, GET_USER_PROFILE } from '../../lib/graphql-operations';

export function meta() {
  return [
    { title: "Security Settings - Loadout Lab" },
    { name: "description", content: "Manage your password and account security" },
  ];
}

export default function SecurityPage() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  
  const { data: profileData, loading: profileLoading } = useQuery(GET_USER_PROFILE, {
    skip: !isAuthenticated,
    fetchPolicy: 'network-only',
  });

  const [changePassword, { loading: changingPassword }] = useMutation(CHANGE_PASSWORD);
  const [deleteAccount, { loading: deletingAccount }] = useMutation(DELETE_ACCOUNT);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    newPasswordConfirmation: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteForm, setDeleteForm] = useState({
    password: '',
    confirmation: '',
  });
  const [deleteErrors, setDeleteErrors] = useState<string[]>([]);

  const isOAuthUser = profileData?.currentUser?.isOauthUser;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    setPasswordErrors([]);
    setPasswordSuccess('');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors([]);
    setPasswordSuccess('');

    // Basic validation
    if (passwordForm.newPassword !== passwordForm.newPasswordConfirmation) {
      setPasswordErrors(['Passwords do not match']);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordErrors(['Password must be at least 6 characters']);
      return;
    }

    try {
      const { data } = await changePassword({
        variables: {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          newPasswordConfirmation: passwordForm.newPasswordConfirmation,
        },
      });

      if (data?.changePassword?.success) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          newPasswordConfirmation: '',
        });
      } else {
        setPasswordErrors(data?.changePassword?.errors || ['Failed to change password']);
      }
    } catch (error) {
      setPasswordErrors([(error as Error).message]);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteErrors([]);

    try {
      const { data } = await deleteAccount({
        variables: {
          password: deleteForm.password || null,
          confirmation: deleteForm.confirmation,
        },
      });

      if (data?.deleteAccount?.success) {
        logout();
        navigate('/');
      } else {
        setDeleteErrors(data?.deleteAccount?.errors || ['Failed to delete account']);
      }
    } catch (error) {
      setDeleteErrors([(error as Error).message]);
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
            <span className="text-slate-800 font-medium">Security</span>
          </nav>
          <h1 className="text-3xl font-bold text-slate-800">Security Settings</h1>
          <p className="mt-2 text-slate-600">Manage your password and account security</p>
        </div>

        {/* OAuth Notice */}
        {isOAuthUser && (
          <div className="mb-6 rounded-xl bg-sky-50 border border-sky-200 p-4">
            <div className="flex items-start gap-3">
              <GoogleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sky-800 font-medium">Connected with Google</h3>
                <p className="text-sm text-sky-700 mt-1">
                  Your account is connected to Google. You can optionally set a password to enable email/password login.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Password Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">
            {isOAuthUser ? 'Set Password' : 'Change Password'}
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            {isOAuthUser 
              ? 'Set a password to enable email/password login in addition to Google sign-in.'
              : 'Update your password regularly to keep your account secure.'}
          </p>

          {passwordSuccess && (
            <div className="mb-6 rounded-xl bg-green-50 border border-green-200 p-4">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">{passwordSuccess}</span>
              </div>
            </div>
          )}

          {passwordErrors.length > 0 && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4">
              <div className="flex gap-3">
                <ExclamationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-red-800 font-medium">Error</h3>
                  <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                    {passwordErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {!isOAuthUser && (
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  required={!isOAuthUser}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-slate-800"
                  placeholder="Enter your current password"
                />
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-slate-800"
                placeholder="Enter your new password"
              />
              <p className="mt-1 text-xs text-slate-500">Minimum 6 characters</p>
            </div>

            <div>
              <label htmlFor="newPasswordConfirmation" className="block text-sm font-medium text-slate-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                id="newPasswordConfirmation"
                name="newPasswordConfirmation"
                value={passwordForm.newPasswordConfirmation}
                onChange={handlePasswordChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all text-slate-800"
                placeholder="Confirm your new password"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={changingPassword}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-medium hover:from-sky-600 hover:to-indigo-600 shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingPassword ? 'Updating...' : (isOAuthUser ? 'Set Password' : 'Update Password')}
              </button>
            </div>
          </form>
        </div>

        {/* Active Sessions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Active Sessions</h2>
          <p className="text-sm text-slate-600 mb-4">Manage your active login sessions.</p>
          
          <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <DeviceIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-slate-800">Current Session</div>
                <div className="text-sm text-slate-500">This device • Active now</div>
              </div>
            </div>
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
              Active
            </span>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Danger Zone</h2>
          <p className="text-sm text-slate-600 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-6 py-3 rounded-xl border-2 border-red-300 text-red-600 font-medium hover:bg-red-50 hover:border-red-400 transition-all"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Account</h3>
            <p className="text-slate-600 mb-6">
              This action cannot be undone. This will permanently delete your account, all your builds, and remove all associated data.
            </p>

            {deleteErrors.length > 0 && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3">
                <ul className="text-sm text-red-700 list-disc list-inside">
                  {deleteErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-4">
              {!isOAuthUser && (
                <div>
                  <label htmlFor="deletePassword" className="block text-sm font-medium text-slate-700 mb-2">
                    Enter your password
                  </label>
                  <input
                    type="password"
                    id="deletePassword"
                    value={deleteForm.password}
                    onChange={(e) => setDeleteForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all text-slate-800"
                    placeholder="Your password"
                  />
                </div>
              )}

              <div>
                <label htmlFor="deleteConfirmation" className="block text-sm font-medium text-slate-700 mb-2">
                  Type <span className="font-bold text-red-600">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  id="deleteConfirmation"
                  value={deleteForm.confirmation}
                  onChange={(e) => setDeleteForm(prev => ({ ...prev, confirmation: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all text-slate-800"
                  placeholder="DELETE"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteForm({ password: '', confirmation: '' });
                  setDeleteErrors([]);
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount || deleteForm.confirmation !== 'DELETE'}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deletingAccount ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
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

function DeviceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
    </svg>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
