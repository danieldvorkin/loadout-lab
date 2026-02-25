import { Link, useLocation } from 'react-router';
import { useQuery } from '@apollo/client/react';
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { GET_MY_UNREAD_COUNT } from '../lib/graphql-operations';

export function AppNav() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const path = location.pathname;
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const { data: unreadData } = useQuery(GET_MY_UNREAD_COUNT, {
    pollInterval: 30000,
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });

  const unreadCount: number = (unreadData as any)?.myUnreadCount ?? 0;

  const isActive = (to: string, prefix?: string) =>
    prefix ? path.startsWith(prefix) : path === to;

  const desktopLink = (to: string, label: string, prefix?: string, activeClass = 'text-sky-600') => (
    <Link
      to={to}
      className={isActive(to, prefix) ? `${activeClass} font-semibold` : 'hover:text-sky-600 transition-colors'}
    >
      {label}
    </Link>
  );

  const mobileLink = (to: string, label: string, prefix?: string, badge?: number) => (
    <Link
      to={to}
      onClick={() => setMobileOpen(false)}
      className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-base font-medium transition-colors ${
        isActive(to, prefix)
          ? 'bg-sky-50 text-sky-600'
          : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      <span>{label}</span>
      {badge && badge > 0 ? (
        <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs font-bold rounded-full bg-red-500 text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </Link>
  );

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16">

            {/* Left: logo + desktop links */}
            <div className="flex items-center gap-6 lg:gap-8">
              <Link
                to="/"
                className="text-lg sm:text-xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent whitespace-nowrap"
              >
                🎯 Loadout Lab
              </Link>

              {/* Desktop nav links */}
              <div className="hidden sm:flex gap-5 lg:gap-6 text-sm font-medium text-slate-600">
                {desktopLink('/components', 'Components', '/components')}
                {desktopLink('/manufacturers', 'Manufacturers', '/manufacturers')}
                {isAuthenticated && desktopLink('/builds', 'My Builds', '/builds')}
                <Link
                  to="/marketplace"
                  className={isActive('/marketplace', '/marketplace') ? 'text-amber-600 font-semibold' : 'hover:text-amber-600 transition-colors'}
                >
                  Community Gear
                </Link>
                {isAuthenticated && (
                  <Link
                    to="/messages"
                    className={`flex items-center gap-1 ${isActive('/messages', '/messages') ? 'text-sky-600 font-semibold' : 'hover:text-sky-600 transition-colors'}`}
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
                    href={import.meta.env.DEV ? 'http://localhost:3000/admin' : 'https://loadoutlab-api-3a7851c775ad.herokuapp.com/admin/'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    Admin
                  </a>
                )}
              </div>
            </div>

            {/* Right: desktop user actions + hamburger */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Desktop user actions */}
              <div className="hidden sm:flex items-center gap-3">
                {isAuthenticated ? (
                  <>
                    <Link to="/account" className="text-sm text-slate-600 hover:text-sky-600 transition-colors font-medium">
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
                    <Link to="/login" className="text-slate-600 hover:text-slate-800 text-sm font-medium transition-colors">
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

              {/* Mobile: unread badge + hamburger */}
              {isAuthenticated && unreadCount > 0 && (
                <Link to="/messages" className="sm:hidden relative p-2" onClick={() => setMobileOpen(false)}>
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </Link>
              )}

              {/* Hamburger button */}
              <button
                onClick={() => setMobileOpen(o => !o)}
                className="sm:hidden flex items-center justify-center w-9 h-9 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileOpen && (
          <div className="sm:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-lg">
            {mobileLink('/components', '🔩 Components', '/components')}
            {mobileLink('/manufacturers', '🏭 Manufacturers', '/manufacturers')}
            {isAuthenticated && mobileLink('/builds', '🎯 My Builds', '/builds')}
            {mobileLink('/marketplace', '🛒 Community Gear', '/marketplace')}
            {isAuthenticated && mobileLink('/messages', '💬 Messages', '/messages', unreadCount)}

            {isAuthenticated && user?.isAdmin && (
              <a
                href={import.meta.env.DEV ? 'http://localhost:3000/admin' : 'https://loadoutlab-api-3a7851c775ad.herokuapp.com/admin/'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-3.5 rounded-xl text-base font-medium text-amber-600 hover:bg-amber-50 transition-colors"
              >
                ⚙️ Admin
              </a>
            )}

            <div className="pt-2 mt-2 border-t border-slate-100">
              {isAuthenticated ? (
                <div className="flex items-center justify-between px-4 py-3">
                  <Link
                    to="/account"
                    onClick={() => setMobileOpen(false)}
                    className="text-sm font-semibold text-slate-700"
                  >
                    👤 {user?.username}
                  </Link>
                  <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex gap-3 px-2 py-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center py-2.5 text-sm font-medium rounded-xl text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center py-2.5 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-sky-500 to-indigo-500 transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Backdrop for mobile menu */}
      {mobileOpen && (
        <div
          className="sm:hidden fixed inset-0 bg-black/20 z-40"
          style={{ top: '56px' }}
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}


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
