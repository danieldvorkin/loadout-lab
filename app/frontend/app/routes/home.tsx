import { Link } from "react-router";
import { useAuth } from "../lib/auth-context";
import { AppNav } from "../components/AppNav";

export function meta() {
  return [
    { title: "Loadout Lab - Build Your Precision Rifle" },
    { name: "description", content: "Build and plan your precision rifle setup with Loadout Lab" },
  ];
}

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

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
      <AppNav />

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
