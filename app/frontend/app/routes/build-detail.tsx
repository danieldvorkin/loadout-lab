import { useQuery, useMutation } from '@apollo/client/react';
import { Link, useParams, useNavigate } from 'react-router';
import { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { GET_BUILD, GET_COMPONENTS, ADD_COMPONENT_TO_BUILD, REMOVE_COMPONENT_FROM_BUILD } from '../lib/graphql-operations';

interface Component {
  id: string;
  name: string;
  type: string;
  weightOz: number | null;
  msrpCents: number | null;
  manufacturer: {
    id: string;
    name: string;
  };
}

interface BuildComponent {
  id: string;
  position: string | null;
  specs: Record<string, unknown>;
  component: Component;
}

interface Build {
  id: string;
  name: string;
  discipline: string | null;
  totalWeightOz: number | null;
  totalCostCents: number | null;
  createdAt: string;
  updatedAt: string;
  buildComponents: BuildComponent[];
}

interface BuildData {
  build: Build | null;
}

interface ComponentsData {
  components: Component[];
}

export default function BuildDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedComponentId, setSelectedComponentId] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');

  const { data, loading, error, refetch } = useQuery<BuildData>(GET_BUILD, {
    variables: { id },
    skip: !isAuthenticated || !id,
  });

  const { data: componentsData } = useQuery<ComponentsData>(GET_COMPONENTS, {
    skip: !showAddForm,
  });

  const [addComponent, { loading: adding }] = useMutation(ADD_COMPONENT_TO_BUILD, {
    onCompleted: () => {
      setShowAddForm(false);
      setSelectedComponentId('');
      setSelectedPosition('');
      refetch();
    },
  });

  const [removeComponent] = useMutation(REMOVE_COMPONENT_FROM_BUILD, {
    onCompleted: () => {
      refetch();
    },
  });

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50">
        <div className="text-lg text-slate-600">Loading build...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50">
        <div className="text-lg text-red-600">Error: {error.message}</div>
      </div>
    );
  }

  const build = data?.build;

  if (!build) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Build not found</h2>
          <Link to="/builds" className="text-sky-600 hover:text-sky-700">
            ← Back to builds
          </Link>
        </div>
      </div>
    );
  }

  const formatPrice = (cents: number | null) => {
    if (cents === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatWeight = (oz: number | null) => {
    if (oz === null) return 'N/A';
    const lbs = Math.floor(oz / 16);
    const remainingOz = oz % 16;
    return `${oz.toFixed(2)} oz (${lbs} lbs ${remainingOz.toFixed(1)} oz)`;
  };

  const handleAddComponent = (e: React.FormEvent) => {
    e.preventDefault();
    addComponent({
      variables: {
        buildId: build.id,
        componentId: selectedComponentId,
        position: selectedPosition || null,
      },
    });
  };

  const handleRemoveComponent = (buildComponentId: string) => {
    if (window.confirm('Remove this component from the build?')) {
      removeComponent({ variables: { buildComponentId } });
    }
  };

  const positions = [
    'action', 'barrel', 'stock', 'trigger', 'scope', 'mount', 'rings',
    'bipod', 'muzzle_device', 'chassis', 'grip', 'magazine', 'buttpad', 'cheek_riser', 'other'
  ];

  // Group build components by position
  const componentsByPosition = build.buildComponents.reduce((acc, bc) => {
    const pos = bc.position || 'other';
    if (!acc[pos]) acc[pos] = [];
    acc[pos].push(bc);
    return acc;
  }, {} as Record<string, BuildComponent[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <Link to="/builds" className="text-sky-600 hover:text-sky-700 text-sm mb-2 inline-block">
                ← Back to builds
              </Link>
              <h1 className="text-3xl font-bold text-slate-800">{build.name}</h1>
              {build.discipline && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-sky-50 to-indigo-50 text-indigo-700 border border-indigo-100 mt-2">
                  {build.discipline.toUpperCase()}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 shadow-lg shadow-sky-500/25 transition-all duration-200"
            >
              + Add Component
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-medium text-slate-500">Total Weight</h3>
              <p className="mt-2 text-2xl font-semibold text-slate-800">
                {formatWeight(build.totalWeightOz)}
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-medium text-slate-500">Total Cost</h3>
              <p className="mt-2 text-2xl font-semibold text-slate-800">
                {formatPrice(build.totalCostCents)}
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-medium text-slate-500">Components</h3>
              <p className="mt-2 text-2xl font-semibold text-slate-800">
                {build.buildComponents.length}
              </p>
            </div>
          </div>

          {/* Add Component Form */}
          {showAddForm && (
            <div className="mb-6 bg-white shadow-sm rounded-2xl border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Add Component
              </h3>
              <form onSubmit={handleAddComponent} className="space-y-4">
                <div>
                  <label htmlFor="component" className="block text-sm font-medium text-slate-700">
                    Component *
                  </label>
                  <select
                    id="component"
                    value={selectedComponentId}
                    onChange={(e) => setSelectedComponentId(e.target.value)}
                    required
                    className="mt-1 block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white text-slate-800 sm:text-sm transition-all duration-200"
                  >
                    <option value="">Select a component</option>
                    {componentsData?.components.map((component) => (
                      <option key={component.id} value={component.id}>
                        {component.name} ({component.manufacturer.name}) - {component.type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-slate-700">
                    Position
                  </label>
                  <select
                    id="position"
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    className="mt-1 block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white text-slate-800 sm:text-sm transition-all duration-200"
                  >
                    <option value="">Select a position</option>
                    {positions.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={adding}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 shadow-lg shadow-sky-500/25 disabled:opacity-50 transition-all duration-200"
                  >
                    {adding ? 'Adding...' : 'Add Component'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="inline-flex items-center px-4 py-2 border border-slate-200 text-sm font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Components List */}
          {build.buildComponents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100">
              <p className="text-slate-600 mb-4">
                No components added to this build yet.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 shadow-lg shadow-sky-500/25 transition-all duration-200"
              >
                Add Your First Component
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(componentsByPosition).map(([position, components]) => (
                <div key={position}>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3 capitalize">
                    {position.replace(/_/g, ' ')}
                  </h3>
                  <div className="bg-white shadow-sm rounded-2xl border border-slate-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Component
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Manufacturer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Weight
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {components.map((bc) => (
                          <tr key={bc.id} className="hover:bg-sky-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-slate-800">
                                {bc.component.name}
                              </div>
                              <div className="text-sm text-slate-500">
                                {bc.component.type}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                              {bc.component.manufacturer.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                              {bc.component.weightOz ? `${bc.component.weightOz} oz` : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                              {formatPrice(bc.component.msrpCents)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleRemoveComponent(bc.id)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
