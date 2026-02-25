import { Link, useLocation } from 'react-router';
import { useQuery } from '@apollo/client/react';
import { useAuth } from '../lib/auth-context';
import { GET_MY_UNREAD_COUNT } from '../lib/graphql-operations';

export function AppNav() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  const { data: unreadData } = useQuery(GET_MY_UNREAD_COUNT, {
    pollInterval: 30000,
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });

  const unreadCount: number = (unreadData as any)?.myUnreadCount ?? 0;

  const navLink = (to: string, label: string, activePrefix?: string) => {
    const isActive = activePrefix
      ? path.startsWith(activePrefix)
      : path === to;
    return (
      <Link
        to={to}
        className={
          isActive
            ? 'text-sky-600 font-semibold'
            : 'hover:text-sky-600 transition-colors'
        }
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left: logo + links */}
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="text-xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent"
            >
              🎯 Loadout Lab
            </Link>

            <div className="hidden sm:flex gap-6 text-sm font-medium text-slate-600">
              {navLink('/components', 'Components', '/components')}
              {navLink('/manufacturers', 'Manufacturers', '/manufacturers')}

              {isAuthenticated && navLink('/builds', 'My Builds', '/builds')}

              <Link
                to="/marketplace"
                className={
                  path.startsWith('/marketplace')
                    ? 'text-amber-600 font-semibold'
                    : 'hover:text-amber-600 transition-colors'
                }
              >
                Community Gear
              </Link>

              {isAuthenticated && (
                <Link
                  to="/messages"
                  className={`flex items-center gap-1 ${
                    path.startsWith('/messages')
                      ? 'text-sky-600 font-semibold'
                      : 'hover:text-sky-600 transition-colors'
                  }`}
                >
                  Messages
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[1rem] h-4 px-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              )}

              {isAuthenticated && user?.isAdmin && (
                <a
                  href={
                    import.meta.env.DEV
                      ? 'http://localhost:3000/admin'
                      : 'https://loadoutlab-api-3a7851c775ad.herokuapp.com/admin/'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Admin
                </a>
              )}
            </div>
          </div>

          {/* Right: user actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/account"
                  className="text-sm text-slate-600 hover:text-sky-600 transition-colors font-medium"
                >
                  {user?.username}
                </Link>
                <button
                  onClick={logout}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-slate-600 hover:text-slate-800 text-sm font-medium transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 shadow-sm hover:shadow transition-all"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
