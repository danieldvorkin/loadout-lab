import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../lib/auth-context';
import { AppNav } from '../../components/AppNav';
import { useEffect } from 'react';

export function meta() {
  return [
    { title: "Account Settings - Loadout Lab" },
    { name: "description", content: "Manage your Loadout Lab account settings" },
  ];
}

export default function AccountIndex() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
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

  const navigationItems = [
    { path: '/account/profile', label: 'Profile', icon: UserIcon, description: 'Your personal information' },
    { path: '/account/security', label: 'Security', icon: LockIcon, description: 'Password and authentication' },
    { path: '/account/preferences', label: 'Preferences', icon: SettingsIcon, description: 'Notifications and settings' },
  ];

  const isActive = (path: string) => location.pathname === path || (path === '/account' && location.pathname === '/account');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <AppNav />

      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Account Settings</h1>
          <p className="mt-2 text-slate-600">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive(item.path)
                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                        : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive(item.path) ? 'text-sky-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-slate-500">{item.description}</div>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* User Stats Card */}
            <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center gap-4 mb-4">
                {user.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.username}
                    className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-slate-800">{user.fullName || user.username}</div>
                  <div className="text-sm text-slate-500">{user.email}</div>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Member since</span>
                  <span className="text-slate-700 font-medium">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Builds</span>
                  <span className="text-slate-700 font-medium">{user.buildsCount ?? 0}</span>
                </div>
                {user.isOauthUser && (
                  <div className="flex items-center gap-2 mt-3 text-sm text-slate-500">
                    <GoogleIcon className="w-4 h-4" />
                    <span>Connected with Google</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Account Overview */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-md hover:border-sky-200 transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-slate-50 group-hover:bg-sky-50 transition-colors">
                        <Icon className="w-6 h-6 text-slate-600 group-hover:text-sky-600 transition-colors" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800 group-hover:text-sky-700 transition-colors">
                          {item.label}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">{item.description}</p>
                      </div>
                      <ChevronRightIcon className="w-5 h-5 text-slate-300 group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Quick Info Cards */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Profile Completion</h3>
                <div className="flex items-end gap-4">
                  <div className="text-4xl font-bold">{calculateProfileCompletion(user)}%</div>
                  <div className="text-sky-100 text-sm mb-1">of your profile is complete</div>
                </div>
                <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${calculateProfileCompletion(user)}%` }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Account Status</h3>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-green-700 font-medium">Active</span>
                </div>
                <p className="text-sm text-slate-500">
                  Your account is in good standing. Keep your profile updated for the best experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to calculate profile completion
function calculateProfileCompletion(user: any): number {
  const fields = ['fullName', 'bio', 'location', 'preferredDiscipline', 'website', 'phoneNumber'];
  const completed = fields.filter(field => user[field] && user[field].trim?.() !== '').length;
  return Math.round((completed / fields.length) * 100);
}

// Icons
function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
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
