import { useQuery } from '@apollo/client/react';
import { Link } from 'react-router';
import { GET_COMPONENTS } from '../lib/graphql-operations';

interface Component {
  id: string;
  name: string;
  type: string;
  weightOz: number | null;
  msrpCents: number | null;
  discontinued: boolean;
  specs: Record<string, unknown>;
  manufacturer: {
    id: string;
    name: string;
    country: string;
  };
}

interface ComponentsData {
  components: Component[];
}

export default function Components() {
  const { data, loading, error } = useQuery<ComponentsData>(GET_COMPONENTS);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 rounded-full bg-sky-500 animate-pulse"></div>
          <div className="text-lg text-slate-600 font-medium">Loading components...</div>
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

  const components = data?.components || [];

  // Group components by type
  const componentsByType = components.reduce((acc, component) => {
    const type = component.type || 'Other';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(component);
    return acc;
  }, {} as Record<string, Component[]>);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800">Components</h1>
            <Link
              to="/"
              className="text-sky-600 hover:text-sky-700 font-medium transition-colors"
            >
              ← Back to Home
            </Link>
          </div>

          {components.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600">
                No components found. Add some components to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(componentsByType).map(([type, typeComponents]) => (
                <div key={type}>
                  <h2 className="text-xl font-semibold text-slate-800 mb-4 capitalize">
                    {type.replace(/_/g, ' ')}
                  </h2>
                  <div className="bg-white shadow-sm border border-slate-100 overflow-hidden rounded-xl">
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Manufacturer
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Weight
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            MSRP
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-50">
                        {typeComponents.map((component) => (
                          <tr key={component.id} className="hover:bg-sky-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-slate-800">
                                {component.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-800">
                                {component.manufacturer.name}
                              </div>
                              <div className="text-sm text-slate-500">
                                {component.manufacturer.country}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                              {formatWeight(component.weightOz)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                              {formatPrice(component.msrpCents)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {component.discontinued ? (
                                <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-red-50 text-red-700 border border-red-100">
                                  Discontinued
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  Available
                                </span>
                              )}
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
