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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading components...</div>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Components</h1>
            <Link
              to="/"
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              ← Back to Home
            </Link>
          </div>

          {components.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                No components found. Add some components to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(componentsByType).map(([type, typeComponents]) => (
                <div key={type}>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 capitalize">
                    {type.replace(/_/g, ' ')}
                  </h2>
                  <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Manufacturer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Weight
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            MSRP
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {typeComponents.map((component) => (
                          <tr key={component.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {component.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {component.manufacturer.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {component.manufacturer.country}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {formatWeight(component.weightOz)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {formatPrice(component.msrpCents)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {component.discontinued ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                  Discontinued
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
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
