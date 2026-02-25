import { useQuery } from '@apollo/client/react';
import { Link, useParams } from 'react-router';
import { AppNav } from '../components/AppNav';
import { GET_COMPONENT } from '../lib/graphql-operations';

interface ComponentDetail {
  id: string;
  name: string;
  type: string;
  weightOz: number | null;
  msrpCents: number | null;
  discontinued: boolean;
  imageUrl: string | null;
  specs: Record<string, unknown> | null;
  manufacturer: {
    id: string;
    name: string;
    website: string;
    country: string;
  };
}

export function meta() {
  return [{ title: "Component Detail - Loadout Lab" }];
}

const formatPrice = (cents: number | null) => {
  if (cents === null) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
};

const formatWeight = (oz: number | null) => {
  if (oz === null) return 'N/A';
  const lbs = oz / 16;
  return `${oz.toFixed(2)} oz (${lbs.toFixed(2)} lbs)`;
};

const formatSpecKey = (key: string) =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function ComponentDetail() {
  const { id } = useParams();
  const { data, loading, error } = useQuery<{ component: ComponentDetail }>(GET_COMPONENT, {
    variables: { id },
    skip: !id,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
        <AppNav />
        <div className="flex items-center justify-center py-32">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 rounded-full bg-sky-500 animate-pulse" />
            <div className="text-lg text-slate-600 font-medium">Loading component...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.component) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
        <AppNav />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-xl text-slate-600">Component not found.</p>
          <Link to="/components" className="mt-4 inline-block text-sky-600 hover:text-sky-700 font-medium">
            ← Back to Components
          </Link>
        </div>
      </div>
    );
  }

  const c = data.component;
  const specs = c.specs && typeof c.specs === 'object' ? Object.entries(c.specs).filter(([, v]) => v !== null && v !== '') : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <AppNav />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <Link
          to="/components"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-sky-600 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Components
        </Link>

        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-0">
            {/* Image panel */}
            <div className="sm:w-72 bg-gradient-to-br from-slate-50 to-sky-50 flex items-center justify-center p-8 sm:p-12 border-b sm:border-b-0 sm:border-r border-slate-100">
              {c.imageUrl ? (
                <img
                  src={c.imageUrl}
                  alt={c.name}
                  className="w-full max-w-[220px] h-auto object-contain rounded-xl"
                />
              ) : (
                <div className="w-40 h-40 bg-gradient-to-br from-sky-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                  <svg className="w-16 h-16 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Info panel */}
            <div className="flex-1 p-6 sm:p-8">
              <div className="flex flex-wrap items-start gap-3 mb-4">
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-sky-50 text-sky-700 border border-sky-100 capitalize">
                  {c.type.replace(/_/g, ' ')}
                </span>
                {c.discontinued ? (
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-100">
                    Discontinued
                  </span>
                ) : (
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Available
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">{c.name}</h1>
              <Link
                to={`/manufacturers/${c.manufacturer.id}`}
                className="text-sky-600 hover:text-sky-700 font-medium text-sm transition-colors"
              >
                {c.manufacturer.name}
              </Link>
              <p className="text-xs text-slate-400 mt-0.5">{c.manufacturer.country}</p>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">MSRP</p>
                  <p className="text-xl font-bold text-slate-800">{formatPrice(c.msrpCents)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Weight</p>
                  <p className="text-sm font-semibold text-slate-800">{formatWeight(c.weightOz)}</p>
                </div>
                {c.manufacturer.website && (
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Website</p>
                    <a
                      href={c.manufacturer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 transition-colors"
                    >
                      Visit
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m-4-6l6-6m0 0L9 7" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Specs */}
          {specs.length > 0 && (
            <div className="border-t border-slate-100 px-6 sm:px-8 py-6">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Specifications</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {specs.map(([key, value]) => (
                  <div key={key} className="flex items-start gap-2">
                    <span className="text-xs text-slate-500 min-w-[120px] font-medium pt-0.5">
                      {formatSpecKey(key)}
                    </span>
                    <span className="text-xs text-slate-800 font-semibold">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
