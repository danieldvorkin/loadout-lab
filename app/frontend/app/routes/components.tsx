import { useQuery } from '@apollo/client/react';
import { Link } from 'react-router';
import { useState, useMemo } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(null);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'weight'>('name');

  const components = data?.components || [];

  // Get unique types and manufacturers for filters
  const componentTypes = useMemo(() => 
    Array.from(new Set(components.map(c => c.type))).sort(),
    [components]
  );

  const manufacturers = useMemo(() =>
    Array.from(new Set(components.map(c => c.manufacturer.name))).sort(),
    [components]
  );

  // Filter and search
  const filteredComponents = useMemo(() => {
    return components.filter(component => {
      const matchesSearch = 
        component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        component.manufacturer.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = !selectedType || component.type === selectedType;
      const matchesManufacturer = !selectedManufacturer || component.manufacturer.name === selectedManufacturer;
      const matchesAvailability = !showAvailableOnly || !component.discontinued;

      return matchesSearch && matchesType && matchesManufacturer && matchesAvailability;
    });
  }, [components, searchTerm, selectedType, selectedManufacturer, showAvailableOnly]);

  // Sort
  const sortedComponents = useMemo(() => {
    const sorted = [...filteredComponents];
    switch (sortBy) {
      case 'price':
        sorted.sort((a, b) => (a.msrpCents || 0) - (b.msrpCents || 0));
        break;
      case 'weight':
        sorted.sort((a, b) => (a.weightOz || 0) - (b.weightOz || 0));
        break;
      case 'name':
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [filteredComponents, sortBy]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800">Components</h1>
            <p className="text-slate-600 mt-2">{sortedComponents.length} of {components.length} components</p>
          </div>
          <Link
            to="/"
            className="text-sky-600 hover:text-sky-700 font-medium transition-colors"
          >
            ← Back
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 sm:p-6 mb-6 space-y-4">
          {/* Search Bar */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-2">
              Search
            </label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                id="search"
                type="text"
                placeholder="Search by name or manufacturer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div>
              <label htmlFor="type-filter" className="block text-sm font-medium text-slate-700 mb-2">
                Type
              </label>
              <select
                id="type-filter"
                value={selectedType || ''}
                onChange={(e) => setSelectedType(e.target.value || null)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white"
              >
                <option value="">All Types</option>
                {componentTypes.map(type => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Manufacturer Filter */}
            <div>
              <label htmlFor="mfg-filter" className="block text-sm font-medium text-slate-700 mb-2">
                Manufacturer
              </label>
              <select
                id="mfg-filter"
                value={selectedManufacturer || ''}
                onChange={(e) => setSelectedManufacturer(e.target.value || null)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white"
              >
                <option value="">All Manufacturers</option>
                {manufacturers.map(mfg => (
                  <option key={mfg} value={mfg}>
                    {mfg}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <label htmlFor="sort-filter" className="block text-sm font-medium text-slate-700 mb-2">
                Sort By
              </label>
              <select
                id="sort-filter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'weight')}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white"
              >
                <option value="name">Name</option>
                <option value="price">Price (Low to High)</option>
                <option value="weight">Weight (Light to Heavy)</option>
              </select>
            </div>

            {/* Availability Toggle */}
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAvailableOnly}
                  onChange={(e) => setShowAvailableOnly(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-200 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-sm font-medium text-slate-700">Available Only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Results */}
        {sortedComponents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/60">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <p className="text-slate-600 mt-4 text-lg">No components found</p>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or search</p>
          </div>
        ) : (
          <>
            {/* Desktop View - Table */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Manufacturer
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Type
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
                  <tbody className="divide-y divide-slate-100">
                    {sortedComponents.map((component) => (
                      <tr
                        key={component.id}
                        className="hover:bg-sky-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-800">
                            {component.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-800">
                            {component.manufacturer.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {component.manufacturer.country}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600 capitalize">
                            {component.type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {formatWeight(component.weightOz)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                          {formatPrice(component.msrpCents)}
                        </td>
                        <td className="px-6 py-4">
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

            {/* Mobile View - Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4">
              {sortedComponents.map((component) => (
                <div
                  key={component.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800 text-sm sm:text-base">
                        {component.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600">
                        {component.manufacturer.name}
                      </p>
                    </div>
                    {component.discontinued ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-50 text-red-700 border border-red-100 ml-2 whitespace-nowrap">
                        Discontinued
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 ml-2 whitespace-nowrap">
                        Available
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-slate-500 font-medium">Type</p>
                      <p className="text-slate-700 font-semibold capitalize">
                        {component.type.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-slate-500 font-medium">Weight</p>
                      <p className="text-slate-700 font-semibold">
                        {formatWeight(component.weightOz)}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-slate-500 font-medium">MSRP</p>
                      <p className="text-slate-700 font-semibold">
                        {formatPrice(component.msrpCents)}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mt-3">
                    {component.manufacturer.country}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
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
    return `${oz.toFixed(2)} oz`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800">Components</h1>
            <p className="text-slate-600 mt-2">{sortedComponents.length} of {components.length} components</p>
          </div>
          <Link
            to="/"
            className="text-sky-600 hover:text-sky-700 font-medium transition-colors"
          >
            ← Back
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 sm:p-6 mb-6 space-y-4">
          {/* Search Bar */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-2">
              Search
            </label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                id="search"
                type="text"
                placeholder="Search by name or manufacturer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div>
              <label htmlFor="type-filter" className="block text-sm font-medium text-slate-700 mb-2">
                Type
              </label>
              <select
                id="type-filter"
                value={selectedType || ''}
                onChange={(e) => setSelectedType(e.target.value || null)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white"
              >
                <option value="">All Types</option>
                {componentTypes.map(type => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Manufacturer Filter */}
            <div>
              <label htmlFor="mfg-filter" className="block text-sm font-medium text-slate-700 mb-2">
                Manufacturer
              </label>
              <select
                id="mfg-filter"
                value={selectedManufacturer || ''}
                onChange={(e) => setSelectedManufacturer(e.target.value || null)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white"
              >
                <option value="">All Manufacturers</option>
                {manufacturers.map(mfg => (
                  <option key={mfg} value={mfg}>
                    {mfg}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <label htmlFor="sort-filter" className="block text-sm font-medium text-slate-700 mb-2">
                Sort By
              </label>
              <select
                id="sort-filter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'weight')}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white"
              >
                <option value="name">Name</option>
                <option value="price">Price (Low to High)</option>
                <option value="weight">Weight (Light to Heavy)</option>
              </select>
            </div>

            {/* Availability Toggle */}
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAvailableOnly}
                  onChange={(e) => setShowAvailableOnly(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-200 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-sm font-medium text-slate-700">Available Only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Results */}
        {sortedComponents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/60">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <p className="text-slate-600 mt-4 text-lg">No components found</p>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or search</p>
          </div>
        ) : (
          <>
            {/* Desktop View - Table */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Manufacturer
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Type
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
                  <tbody className="divide-y divide-slate-100">
                    {sortedComponents.map((component) => (
                      <tr
                        key={component.id}
                        className="hover:bg-sky-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-800">
                            {component.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-800">
                            {component.manufacturer.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {component.manufacturer.country}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600 capitalize">
                            {component.type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {formatWeight(component.weightOz)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                          {formatPrice(component.msrpCents)}
                        </td>
                        <td className="px-6 py-4">
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

            {/* Mobile View - Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4">
              {sortedComponents.map((component) => (
                <div
                  key={component.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800 text-sm sm:text-base">
                        {component.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600">
                        {component.manufacturer.name}
                      </p>
                    </div>
                    {component.discontinued ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-50 text-red-700 border border-red-100 ml-2 whitespace-nowrap">
                        Discontinued
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 ml-2 whitespace-nowrap">
                        Available
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-slate-500 font-medium">Type</p>
                      <p className="text-slate-700 font-semibold capitalize">
                        {component.type.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-slate-500 font-medium">Weight</p>
                      <p className="text-slate-700 font-semibold">
                        {formatWeight(component.weightOz)}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-slate-500 font-medium">MSRP</p>
                      <p className="text-slate-700 font-semibold">
                        {formatPrice(component.msrpCents)}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mt-3">
                    {component.manufacturer.country}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
