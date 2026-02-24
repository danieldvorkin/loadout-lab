import { Link } from "react-router";
import { useAuth } from "../lib/auth-context";

export function meta() {
  return [
    { title: "Loadout Lab - Build Your Precision Rifle" },
    { name: "description", content: "Build and plan your precision rifle setup with Loadout Lab" },
  ];
}

export default function Home() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                  🎯 Loadout Lab
                </h1>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
                <Link
                  to="/components"
                  className="text-slate-600 hover:text-sky-600 inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors"
                >
                  Components
                </Link>
                <Link
                  to="/manufacturers"
                  className="text-slate-600 hover:text-sky-600 inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors"
                >
                  Manufacturers
                </Link>
                {isAuthenticated && (
                  <Link
                    to="/builds"
                    className="text-slate-600 hover:text-sky-600 inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors"
                  >
                    My Builds
                  </Link>
                )}
                {isAuthenticated && user?.isAdmin && (
                  <a
                    href={import.meta.env.DEV ? 'http://localhost:3000/admin' : 'https://loadoutlab-api-3a7851c775ad.herokuapp.com/admin/'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 hover:text-amber-700 inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    Admin
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/account"
                    className="text-sm text-slate-600 hover:text-sky-600 transition-colors"
                  >
                    <span className="font-medium text-slate-800">{user?.username}</span>
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

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl tracking-tight font-extrabold text-slate-800 sm:text-5xl md:text-6xl">
            <span className="block">Build Your</span>
            <span className="block bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">Precision Rifle</span>
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600 md:text-xl">
            Plan, compare, and optimize your PRS, NRL, or precision rifle build. 
            Track weights, costs, and find the perfect components for your setup.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/builds"
                className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-xl text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 shadow-lg shadow-sky-500/25 hover:shadow-xl transition-all"
              >
                View My Builds
              </Link>
            ) : (
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-xl text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 shadow-lg shadow-sky-500/25 hover:shadow-xl transition-all"
              >
                Get Started Free
              </Link>
            )}
            <Link
              to="/components"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-xl text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm transition-all"
            >
              Browse Components
            </Link>
            <Link
              to="/manufacturers"
              className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-xl text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm transition-all"
            >
              View Manufacturers
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all">
              <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center mb-5">
                <span className="text-2xl">🔧</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Component Database
              </h3>
              <p className="text-slate-600">
                Browse actions, barrels, stocks, triggers, scopes, and more from top manufacturers.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-5">
                <span className="text-2xl">⚖️</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Weight Tracking
              </h3>
              <p className="text-slate-600">
                Keep track of your total build weight to stay within competition limits.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-5">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Cost Calculator
              </h3>
              <p className="text-slate-600">
                Plan your budget and track total costs for your precision rifle build.
              </p>
            </div>
          </div>
        </div>

        {/* Disciplines */}
        <div className="mt-24">
          <h3 className="text-2xl font-bold text-slate-800 text-center mb-8">
            Supported Disciplines
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {['PRS', 'NRL', 'Benchrest', 'F-Class', 'Tactical', 'Hunting'].map((discipline) => (
              <span
                key={discipline}
                className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-medium bg-gradient-to-r from-sky-50 to-indigo-50 text-sky-700 border border-sky-100"
              >
                {discipline}
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 mt-24">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-500">
            © 2026 Loadout Lab. Built for precision rifle enthusiasts.
          </p>
        </div>
      </footer>
    </div>
  );
}
