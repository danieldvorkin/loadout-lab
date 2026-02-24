import { useQuery, useMutation } from '@apollo/client';
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Sign in to view your builds
          </h2>
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading builds...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-red-600 dark:text-red-400">Error: {error.message}</div>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Builds</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome, {user?.username}!
              </p>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/"
                className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                ← Back to Home
              </Link>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                + New Build
              </button>
            </div>
          </div>

          {showCreateForm && (
            <div className="mb-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Create New Build
              </h3>
              <form onSubmit={handleCreateBuild} className="space-y-4">
                <div>
                  <label htmlFor="buildName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Build Name *
                  </label>
                  <input
                    type="text"
                    id="buildName"
                    value={newBuildName}
                    onChange={(e) => setNewBuildName(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="e.g., Competition PRS Build"
                  />
                </div>
                <div>
                  <label htmlFor="discipline" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Discipline
                  </label>
                  <select
                    id="discipline"
                    value={newBuildDiscipline}
                    onChange={(e) => setNewBuildDiscipline(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                  >
                    <option value="">Select a discipline</option>
                    {disciplines.map((d) => (
                      <option key={d} value={d} className="capitalize">
                        {d.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={creating}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create Build'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {builds.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You haven't created any builds yet.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Your First Build
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {builds.map((build) => (
                <div
                  key={build.id}
                  className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {build.name}
                        </h3>
                        {build.discipline && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mt-1">
                            {build.discipline.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteBuild(build.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Total Weight:</span>
                        <span className="text-gray-900 dark:text-white">{formatWeight(build.totalWeightOz)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Total Cost:</span>
                        <span className="text-gray-900 dark:text-white">{formatPrice(build.totalCostCents)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Components:</span>
                        <span className="text-gray-900 dark:text-white">{build.buildComponents.length}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Link
                        to={`/builds/${build.id}`}
                        className="text-blue-600 hover:text-blue-500 dark:text-blue-400 text-sm font-medium"
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
