import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useMutation, useQuery } from '@apollo/client/react';
import { useAuth } from '../../lib/auth-context';
import { UPDATE_USER_PROFILE, GET_USER_PROFILE } from '../../lib/graphql-operations';

export function meta() {
  return [
    { title: "Preferences - Loadout Lab" },
    { name: "description", content: "Manage your notification preferences and settings" },
  ];
}

export default function PreferencesPage() {
  const { user, isAuthenticated, isLoading: authLoading, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const { data: profileData, loading: profileLoading } = useQuery(GET_USER_PROFILE, {
    skip: !isAuthenticated,
    fetchPolicy: 'network-only',
  });

  const [updateProfile, { loading: updating }] = useMutation(UPDATE_USER_PROFILE);

  const [preferences, setPreferences] = useState({
    emailUpdates: true,
    buildNotifications: true,
    marketingEmails: false,
    newComponentAlerts: true,
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (profileData?.currentUser?.notificationPreferences) {
      const prefs = profileData.currentUser.notificationPreferences;
      setPreferences({
        emailUpdates: prefs.email_updates ?? prefs.emailUpdates ?? true,
        buildNotifications: prefs.build_notifications ?? prefs.buildNotifications ?? true,
        marketingEmails: prefs.marketing_emails ?? prefs.marketingEmails ?? false,
        newComponentAlerts: prefs.new_component_alerts ?? prefs.newComponentAlerts ?? true,
      });
    }
  }, [profileData]);

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    setSuccessMessage('');
    setErrors([]);
  };

  const handleSave = async () => {
    setErrors([]);
    setSuccessMessage('');

    try {
      const { data } = await updateProfile({
        variables: {
          notificationPreferences: {
            email_updates: preferences.emailUpdates,
            build_notifications: preferences.buildNotifications,
            marketing_emails: preferences.marketingEmails,
            new_component_alerts: preferences.newComponentAlerts,
          },
        },
      });

      if (data?.updateUserProfile?.errors?.length > 0) {
        setErrors(data.updateUserProfile.errors);
      } else if (data?.updateUserProfile?.user) {
        updateUser(data.updateUserProfile.user);
        setSuccessMessage('Preferences saved successfully!');
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

  const preferenceItems = [
    {
      key: 'emailUpdates' as const,
      title: 'Email Updates',
      description: 'Receive important updates about your account and builds via email.',
      icon: EmailIcon,
    },
    {
      key: 'buildNotifications' as const,
      title: 'Build Notifications',
      description: 'Get notified when there are updates to components in your builds.',
      icon: BuildIcon,
    },
    {
      key: 'newComponentAlerts' as const,
      title: 'New Component Alerts',
      description: 'Be the first to know when new components are added to the database.',
      icon: ComponentIcon,
    },
    {
      key: 'marketingEmails' as const,
      title: 'Marketing & Promotions',
      description: 'Receive occasional emails about new features and special offers.',
      icon: MegaphoneIcon,
    },
  ];

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
            <span className="text-slate-800 font-medium">Preferences</span>
          </nav>
          <h1 className="text-3xl font-bold text-slate-800">Preferences</h1>
          <p className="mt-2 text-slate-600">Manage your notification preferences and settings</p>
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
                <h3 className="text-red-800 font-medium">Error</h3>
                <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Notification Preferences */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Notification Preferences</h2>
          <p className="text-sm text-slate-600 mb-6">Choose what notifications you'd like to receive.</p>

          <div className="space-y-4">
            {preferenceItems.map(item => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">{item.title}</div>
                      <div className="text-sm text-slate-500">{item.description}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle(item.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences[item.key] ? 'bg-sky-500' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                        preferences[item.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Display Preferences */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Display Preferences</h2>
          <p className="text-sm text-slate-600 mb-6">Customize how information is displayed.</p>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <ScaleIcon className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-800">Weight Units</div>
                  <div className="text-sm text-slate-500">Choose between ounces or grams</div>
                </div>
              </div>
              <select className="px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm bg-white">
                <option value="oz">Ounces (oz)</option>
                <option value="g">Grams (g)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <CurrencyIcon className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-800">Currency</div>
                  <div className="text-sm text-slate-500">Choose your preferred currency</div>
                </div>
              </div>
              <select className="px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm bg-white">
                <option value="usd">USD ($)</option>
                <option value="eur">EUR (€)</option>
                <option value="gbp">GBP (£)</option>
                <option value="cad">CAD ($)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Link
            to="/account"
            className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={updating}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-medium hover:from-sky-600 hover:to-indigo-600 shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
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

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

function BuildIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function ComponentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  );
}

function MegaphoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
    </svg>
  );
}

function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
    </svg>
  );
}

function CurrencyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
