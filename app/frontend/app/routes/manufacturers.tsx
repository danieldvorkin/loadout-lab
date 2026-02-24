import { useQuery } from '@apollo/client/react';
import { Link } from 'react-router';
import { useState, useMemo } from 'react';
import { GET_MANUFACTURERS } from '../lib/graphql-operations';

interface Manufacturer {
  id: string;
  name: string;
  website: string;
  country: string;
}

interface ManufacturersData {
  manufacturers: Manufacturer[];
}

export default function Manufacturers() {
  const { data, loading, error } = useQuery<ManufacturersData>(GET_MANUFACTURERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'country'>('name');

  const manufacturers = data?.manufacturers || [];

  // Get unique countries for filter
  const countries = useMemo(() =>
    Array.from(new Set(manufacturers.map(m => m.country))).sort(),
    [manufacturers]
  );

  // Filter
  const filteredManufacturers = useMemo(() => {
    return manufacturers.filter(manufacturer => {
      const matchesSearch = 
        manufacturer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        manufacturer.country.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCountry = !selectedCountry || manufacturer.country === selectedCountry;

      return matchesSearch && matchesCountry;
    });
  }, [manufacturers, searchTerm, selectedCountry]);

  // Sort
  const sortedManufacturers = useMemo(() => {
    const sorted = [...filteredManufacturers];
    switch (sortBy) {
      case 'country':
        sorted.sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name));
        break;
      case 'name':
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [filteredManufacturers, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 rounded-full bg-sky-500 animate-pulse"></div>
          <div className="text-lg text-slate-600 font-medium">Loading manufacturers...</div>
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
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800">Manufacturers</h1>
            <p className="text-slate-600 mt-2">{sortedManufacturers.length} of {manufacturers.length} manufacturers</p>
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
                placeholder="Search by name or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Country Filter */}
            <div>
              <label htmlFor="country-filter" className="block text-sm font-medium text-slate-700 mb-2">
                Country
              </label>
              <select
                id="country-filter"
                value={selectedCountry || ''}
                onChange={(e) => setSelectedCountry(e.target.value || null)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white"
              >
                <option value="">All Countries</option>
                {countries.map(country => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div className="sm:col-span-2">
              <label htmlFor="sort-filter" className="block text-sm font-medium text-slate-700 mb-2">
                Sort By
              </label>
              <select
                id="sort-filter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'country')}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white"
              >
                <option value="name">Name (A-Z)</option>
                <option value="country">Country</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {sortedManufacturers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/60">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <p className="text-slate-600 mt-4 text-lg">No manufacturers found</p>
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
                        Country
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Website
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedManufacturers.map((manufacturer) => (
                      <tr
                        key={manufacturer.id}
                        className="hover:bg-sky-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-slate-800">
                            {manufacturer.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 inline-flex text-sm font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {manufacturer.country}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {manufacturer.website ? (
                            <a
                              href={manufacturer.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-600 hover:text-sky-700 text-sm font-medium flex items-center gap-1 transition-colors"
                            >
                              Visit
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m-4-6l6-6m0 0L9 7" />
                              </svg>
                            </a>
                          ) : (
                            <span className="text-slate-400 text-sm">Not available</span>
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
              {sortedManufacturers.map((manufacturer) => (
                <div
                  key={manufacturer.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 text-sm sm:text-base truncate">
                        {manufacturer.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1">
                        {manufacturer.country}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap">
                      {manufacturer.country}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    {manufacturer.website ? (
                      <a
                        href={manufacturer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-600 hover:text-sky-700 text-sm font-medium flex items-center gap-2 transition-colors w-fit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m-4-6l6-6m0 0L9 7" />
                        </svg>
                        Visit Website
                      </a>
                    ) : (
                      <span className="text-slate-400 text-sm">Website not available</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

