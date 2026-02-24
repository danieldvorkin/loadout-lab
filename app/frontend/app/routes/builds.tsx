import { useQuery, useMutation } from '@apollo/client/react';
import { Link, useNavigate } from 'react-router';
import { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { GET_BUILDS, CREATE_BUILD, DELETE_BUILD } from '../lib/graphql-operations';

interface BuildComponent {
  id: string;
  position: string;
  component: {
    id: string;
    name: string;
    type: string;
  };
}

interface Build {
  id: string;
  name: string;
  discipline: string | null;
  totalWeightOz: number | null;
  totalCostCents: number | null;
  createdAt: string;
  buildComponents: BuildComponent[];
}

interface BuildsData {
  builds: Build[];
}

export default function Builds() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBuildName, setNewBuildName] = useState('');
  const [newBuildDiscipline, setNewBuildDiscipline] = useState('');

  const { data, loading, error, refetch } = useQuery<BuildsData>(GET_BUILDS, {
    skip: !isAuthenticated,
  });

  const [createBuild, { loading: creating }] = useMutation(CREATE_BUILD, {
    onCompleted: () => {
      setShowCreateForm(false);
      setNewBuildName('');
      setNewBuildDiscipline('');
      refetch();
    },
  });

  const [deleteBuild] = useMutation(DELETE_BUILD, {
    onCompleted: () => {
      refetch();
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Sign in to view your builds
          </h2>
          <Link
            to="/login"
            className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 shadow-lg shadow-sky-500/25 transition-all"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 rounded-full bg-sky-500 animate-pulse"></div>
          <div className="text-lg text-slate-600 font-medium">Loading builds...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-lg text-red-600">Error: {error.message}</div>
      </div>
    );
  }

  const builds = data?.builds || [];

  const formatPrice = (cents: number | null) => {
    if (cents === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatWeight = (oz: number | null) => {
    if (oz === null) return 'N/A';
    return `${oz.toFixed(2)} oz`;
  };

  const handleCreateBuild = (e: React.FormEvent) => {
    e.preventDefault();
    createBuild({
      variables: {
        name: newBuildName,
        discipline: newBuildDiscipline || null,
      },
    });
  };

  const handleDeleteBuild = (id: string) => {
    if (window.confirm('Are you sure you want to delete this build?')) {
      deleteBuild({ variables: { id } });
    }
  };

  const disciplines = ['prs', 'nrl', 'benchrest', 'f-class', 'tactical', 'hunting'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">My Builds</h1>
              <p className="text-slate-600">
                Welcome, <span className="font-medium">{user?.username}</span>!
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-sky-600 hover:text-sky-700 font-medium transition-colors"
              >
                ← Back to Home
              </Link>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 shadow-lg shadow-sky-500/25 transition-all"
              >
                + New Build
              </button>
            </div>
          </div>

          {showCreateForm && (
            <div className="mb-8 bg-white shadow-sm border border-slate-100 rounded-2xl p-8">
              <h3 className="text-lg font-semibold text-slate-800 mb-6">
                Create New Build
              </h3>
              <form onSubmit={handleCreateBuild} className="space-y-5">
                <div>
                  <label htmlFor="buildName" className="block text-sm font-medium text-slate-700 mb-1">
                    Build Name *
                  </label>
                  <input
                    type="text"
                    id="buildName"
                    value={newBuildName}
                    onChange={(e) => setNewBuildName(e.target.value)}
                    required
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-800 placeholder-slate-400 transition-all"
                    placeholder="e.g., Competition PRS Build"
                  />
                </div>
                <div>
                  <label htmlFor="discipline" className="block text-sm font-medium text-slate-700 mb-1">
                    Discipline
                  </label>
                  <select
                    id="discipline"
                    value={newBuildDiscipline}
                    onChange={(e) => setNewBuildDiscipline(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-800 transition-all"
                  >
                    <option value="">Select a discipline</option>
                    {disciplines.map((d) => (
                      <option key={d} value={d} className="capitalize">
                        {d.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-4 pt-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 disabled:opacity-50 shadow-lg shadow-sky-500/25 transition-all"
                  >
                    {creating ? 'Creating...' : 'Create Build'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {builds.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-100">
              <p className="text-slate-600 mb-6">
                You haven't created any builds yet.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 shadow-lg shadow-sky-500/25 transition-all"
              >
                Create Your First Build
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {builds.map((build) => (
                <div
                  key={build.id}
                  className="bg-white shadow-sm border border-slate-100 rounded-2xl overflow-hidden hover:shadow-md hover:border-slate-200 transition-all"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                          {build.name}
                        </h3>
                        {build.discipline && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-sky-50 to-indigo-50 text-sky-700 border border-sky-100 mt-2">
                            {build.discipline.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteBuild(build.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-5 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Total Weight:</span>
                        <span className="text-slate-800 font-medium">{formatWeight(build.totalWeightOz)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Total Cost:</span>
                        <span className="text-slate-800 font-medium">{formatPrice(build.totalCostCents)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Components:</span>
                        <span className="text-slate-800 font-medium">{build.buildComponents.length}</span>
                      </div>
                    </div>
                    <div className="mt-5 pt-5 border-t border-slate-100">
                      <Link
                        to={`/builds/${build.id}`}
                        className="text-sky-600 hover:text-sky-700 text-sm font-medium transition-colors"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
