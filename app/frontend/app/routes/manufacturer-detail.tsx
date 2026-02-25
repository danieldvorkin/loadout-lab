import { useQuery } from '@apollo/client/react';
import { Link, useParams } from 'react-router';
import { useState, useMemo } from 'react';
import { AppNav } from '../components/AppNav';
import { GET_MANUFACTURER } from '../lib/graphql-operations';

interface ManufacturerComponent {
  id: string;
  name: string;
  type: string;
  weightOz: number | null;
  msrpCents: number | null;
  imageUrl: string | null;
  discontinued: boolean;
}

interface ManufacturerDetail {
  id: string;
  name: string;
  website: string;
  country: string;
  imageUrl: string | null;
  components: ManufacturerComponent[];
}

export function meta() {
  return [{ title: "Manufacturer Detail - Loadout Lab" }];
}

const formatPrice = (cents: number | null) => {
  if (cents === null) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
};

export default function ManufacturerDetail() {
  const { id } = useParams();
  const { data, loading, error } = useQuery<{ manufacturer: ManufacturerDetail }>(GET_MANUFACTURER, {
    variables: { id },
    skip: !id,
  });

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  const components = data?.manufacturer?.components ?? [];

  const componentTypes = useMemo(() =>
    Array.from(new Set(components.map((c) => c.type))).sort(),
    [components]
  );

  const filtered = useMemo(() =>
    components
      .filter((c) => {
        const q = search.toLowerCase();
        return (
          (c.name.toLowerCase().includes(q)) &&
          (!typeFilter || c.type === typeFilter) &&
          (!showAvailableOnly || !c.discontinued)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name)),
    [components, search, typeFilter, showAvailableOnly]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
        <AppNav />
        <div className="flex items-center justify-center py-32">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 rounded-full bg-sky-500 animate-pulse" />
            <div className="text-lg text-slate-600 font-medium">Loading manufacturer...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.manufacturer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
        <AppNav />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-xl text-slate-600">Manufacturer not found.</p>
          <Link to="/manufacturers" className="mt-4 inline-block text-sky-600 hover:text-sky-700 font-medium">
            ← Back to Manufacturers
          </Link>
        </div>
      </div>
    );
  }

  const m = data.manufacturer;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <AppNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <Link
          to="/manufacturers"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-sky-600 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Manufacturers
        </Link>

        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Logo */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 flex items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 p-2">
              {m.imageUrl ? (
                <img src={m.imageUrl} alt={m.name} className="w-full h-full object-contain" />
              ) : (
                <span className="text-2xl font-bold text-indigo-300">{m.name.substring(0, 2).toUpperCase()}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{m.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {m.country}
                </span>
                <span className="text-sm text-slate-500">
                  {components.length} component{components.length !== 1 ? 's' : ''} in database
                </span>
              </div>
            </div>

            {/* Website */}
            {m.website && (
              <a
                href={m.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-50 text-sky-700 font-medium text-sm hover:bg-sky-100 transition-colors border border-sky-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m-4-6l6-6m0 0L9 7" />
                </svg>
                Visit Website
              </a>
            )}
          </div>
        </div>

        {/* Components section */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-800">
            Components
            {filtered.length !== components.length && (
              <span className="ml-2 text-sm font-normal text-slate-500">({filtered.length} of {components.length})</span>
            )}
          </h2>
        </div>

        {/* Filters */}
        {components.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search components..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white"
            >
              <option value="">All Types</option>
              {componentTypes.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 font-medium whitespace-nowrap">
              <input
                type="checkbox"
                checked={showAvailableOnly}
                onChange={(e) => setShowAvailableOnly(e.target.checked)}
                className="w-4 h-4 rounded border-slate-200 text-sky-600 focus:ring-sky-500"
              />
              Available Only
            </label>
          </div>
        )}

        {/* Component grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60">
            <p className="text-slate-500 text-lg">No components found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((comp) => (
              <Link
                key={comp.id}
                to={`/components/${comp.id}`}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md hover:border-sky-200 transition-all group"
              >
                {/* Image */}
                <div className="w-full h-36 bg-gradient-to-br from-slate-50 to-sky-50 rounded-xl flex items-center justify-center mb-3 overflow-hidden">
                  {comp.imageUrl ? (
                    <img
                      src={comp.imageUrl}
                      alt={comp.name}
                      className="w-full h-full object-contain p-2"
                      loading="lazy"
                    />
                  ) : (
                    <svg className="w-10 h-10 text-sky-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div>
                  <p className="text-xs text-slate-400 capitalize mb-1">{comp.type.replace(/_/g, ' ')}</p>
                  <h3 className="font-semibold text-slate-800 text-sm group-hover:text-sky-700 transition-colors line-clamp-2 leading-snug">
                    {comp.name}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-slate-700">{formatPrice(comp.msrpCents)}</span>
                    {comp.discontinued ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">Discontinued</span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">Available</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
