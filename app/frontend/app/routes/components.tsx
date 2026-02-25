import { useQuery } from '@apollo/client/react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useState, useMemo, useRef, useEffect } from 'react';
import { GET_COMPONENTS } from '../lib/graphql-operations';
import Pagination from '../components/Pagination';
import { AppNav } from '../components/AppNav';
import { useBuildCart } from '../lib/build-cart-context';

interface Component {
  id: string;
  name: string;
  type: string;
  weightOz: number | null;
  msrpCents: number | null;
  discontinued: boolean;
  imageUrl: string | null;
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

const TYPE_LABELS: Record<string, string> = {
  action: 'Action',
  barrel: 'Barrel',
  bipod: 'Bipod',
  buttpad: 'Buttpad',
  chassis: 'Chassis',
  cheek_riser: 'Cheek Riser',
  grip: 'Grip',
  magazine: 'Magazine',
  mount: 'Mount',
  muzzle_device: 'Muzzle Device',
  other: 'Other',
  rings: 'Rings',
  scope: 'Scope',
  stock: 'Stock',
  trigger: 'Trigger',
};

const TYPE_ICONS: Record<string, string> = {
  action: '⚙️', barrel: '🔫', bipod: '🦵', buttpad: '🛡️', chassis: '🔩',
  cheek_riser: '📐', grip: '✊', magazine: '📦', mount: '🔧', muzzle_device: '💨',
  other: '📋', rings: '⭕', scope: '🔭', stock: '🪵', trigger: '☝️',
};

export default function Components() {
  const { data, loading, error } = useQuery<ComponentsData>(GET_COMPONENTS);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [mfgSearch, setMfgSearch] = useState('');
  const [mfgDropdownOpen, setMfgDropdownOpen] = useState(false);
  const mfgRef = useRef<HTMLDivElement>(null);
  const { addToCart, removeFromCart, isInCart, openCart } = useBuildCart();

  // All state lives in URL params — filters survive navigation
  const searchTerm = searchParams.get('q') || '';

  // Local search input state — debounced to avoid re-rendering on every keystroke
  const [localSearch, setLocalSearch] = useState(searchTerm);
  useEffect(() => { setLocalSearch(searchTerm); }, [searchTerm]);
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        if (localSearch) { next.set('q', localSearch); } else { next.delete('q'); }
        next.delete('page');
        return next;
      }, { replace: true });
    }, 280);
    return () => clearTimeout(t);
  }, [localSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedType = searchParams.get('type') || null;
  const selectedManufacturer = searchParams.get('mfg') || null;
  const showAvailableOnly = searchParams.get('available') === '1';
  const sortBy = (searchParams.get('sort') as 'name' | 'price' | 'weight') || 'name';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const perPage = parseInt(searchParams.get('per') || '25', 10);

  const setParam = (key: string, value: string | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value === null || value === '') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      next.delete('page'); // reset page on any filter change
      return next;
    }, { replace: true });
  };

  const setPage = (page: number) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('page', String(page));
      return next;
    }, { replace: true });
  };

  const setPerPageParam = (per: number) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('per', String(per));
      next.delete('page');
      return next;
    }, { replace: true });
  };

  const clearAllFilters = () => {
    setSearchParams({}, { replace: true });
    setMfgSearch('');
    setLocalSearch('');
  };

  const activeFilterCount = [searchTerm, selectedType, selectedManufacturer, showAvailableOnly ? '1' : null]
    .filter(Boolean).length;

  const components = data?.components || [];

  // Unique types and manufacturers
  const componentTypes = useMemo(() =>
    Array.from(new Set(components.map(c => c.type))).sort(),
    [components]
  );

  const manufacturers = useMemo(() =>
    Array.from(new Set(components.map(c => c.manufacturer.name))).sort(),
    [components]
  );

  const filteredMfgs = useMemo(() =>
    manufacturers.filter(m => m.toLowerCase().includes(mfgSearch.toLowerCase())),
    [manufacturers, mfgSearch]
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
      case 'price': sorted.sort((a, b) => (a.msrpCents || 0) - (b.msrpCents || 0)); break;
      case 'weight': sorted.sort((a, b) => (a.weightOz || 0) - (b.weightOz || 0)); break;
      default: sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [filteredComponents, sortBy]);

  // Paginate
  const paginatedComponents = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return sortedComponents.slice(start, start + perPage);
  }, [sortedComponents, currentPage, perPage]);

  // Close manufacturer dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (mfgRef.current && !mfgRef.current.contains(e.target as Node)) {
        setMfgDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcut: / to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const formatPrice = (cents: number | null) => {
    if (cents === null) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  };

  const formatWeight = (oz: number | null) => {
    if (oz === null) return 'N/A';
    return `${oz.toFixed(2)} oz`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* AppNav is now rendered in root layout */}
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-slate-500 text-sm">Loading components...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* AppNav is now rendered in root layout */}
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-red-500 text-lg">Error: {error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      {/* AppNav is now rendered in root layout */}
      <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight">Components</h1>
            <p className="text-slate-500 mt-1.5 text-sm">
              {sortedComponents.length === components.length
                ? `${components.length} total components`
                : `${sortedComponents.length} of ${components.length} components`}
              {activeFilterCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 text-xs font-medium">
                  {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
                </span>
              )}
            </p>
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-slate-600 hover:text-slate-900 border border-slate-300 hover:border-slate-400 px-4 py-2 rounded-xl transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear all filters
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search components or manufacturers..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-12 pr-16 py-3 bg-white border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all text-sm shadow-sm"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {localSearch && (
              <button onClick={() => { setLocalSearch(''); setParam('q', null); }} className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <kbd className="hidden sm:flex items-center px-1.5 py-0.5 text-xs text-slate-400 border border-slate-200 rounded-md font-mono">/</kbd>
          </div>
        </div>

        {/* Type Filter Pills */}
        <div className="mb-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setParam('type', null)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                !selectedType
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400 hover:text-slate-800'
              }`}
            >
              All Types
            </button>
            {componentTypes.map(type => (
              <button
                key={type}
                onClick={() => setParam('type', selectedType === type ? null : type)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  selectedType === type
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400 hover:text-slate-800'
                }`}
              >
                <span>{TYPE_ICONS[type] || '📦'}</span>
                {TYPE_LABELS[type] || type.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Second Row: Manufacturer + Sort + Available */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Manufacturer searchable dropdown */}
          <div className="relative" ref={mfgRef}>
            <button
              onClick={() => setMfgDropdownOpen(o => !o)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                selectedManufacturer
                  ? 'bg-sky-50 border-sky-300 text-sky-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
              }`}
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {selectedManufacturer || 'All Manufacturers'}
              {selectedManufacturer && (
                <span
                  onClick={(e) => { e.stopPropagation(); setParam('mfg', null); setMfgSearch(''); }}
                  className="ml-1 text-sky-500 hover:text-sky-700"
                >×</span>
              )}
              <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${mfgDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {mfgDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b border-slate-100">
                  <input
                    type="text"
                    placeholder="Search manufacturers..."
                    value={mfgSearch}
                    onChange={e => setMfgSearch(e.target.value)}
                    autoFocus
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  <button
                    onClick={() => { setParam('mfg', null); setMfgSearch(''); setMfgDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${!selectedManufacturer ? 'text-sky-600 bg-sky-50 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    All Manufacturers
                    <span className="ml-2 text-xs text-slate-400">({components.length})</span>
                  </button>
                  {filteredMfgs.map(mfg => {
                    const count = components.filter(c => c.manufacturer.name === mfg).length;
                    return (
                      <button
                        key={mfg}
                        onClick={() => { setParam('mfg', mfg); setMfgSearch(''); setMfgDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${selectedManufacturer === mfg ? 'text-sky-600 bg-sky-50 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        <span>{mfg}</span>
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{count}</span>
                      </button>
                    );
                  })}
                  {filteredMfgs.length === 0 && (
                    <p className="text-center py-6 text-slate-400 text-sm">No manufacturers found</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sort button group */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-1 shadow-sm">
            {([
              { key: 'name', label: 'Name', icon: '🔤' },
              { key: 'price', label: 'Price', icon: '💰' },
              { key: 'weight', label: 'Weight', icon: '⚖️' },
            ] as const).map(opt => (
              <button
                key={opt.key}
                onClick={() => setParam('sort', opt.key === 'name' ? null : opt.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  sortBy === opt.key
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Available Only toggle */}
          <button
            onClick={() => setParam('available', showAvailableOnly ? null : '1')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              showAvailableOnly
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-800'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${showAvailableOnly ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            Available Only
          </button>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {searchTerm && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 border border-sky-200 text-sky-700 text-xs rounded-full font-medium">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                "{searchTerm}"
                <button onClick={() => { setLocalSearch(''); setParam('q', null); }} className="hover:text-sky-900 ml-0.5">×</button>
              </span>
            )}
            {selectedType && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-300 text-slate-700 text-xs rounded-full font-medium">
                {TYPE_ICONS[selectedType]} {TYPE_LABELS[selectedType] || selectedType}
                <button onClick={() => setParam('type', null)} className="hover:text-slate-900 ml-0.5">×</button>
              </span>
            )}
            {selectedManufacturer && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 border border-sky-200 text-sky-700 text-xs rounded-full font-medium">
                🏭 {selectedManufacturer}
                <button onClick={() => { setParam('mfg', null); setMfgSearch(''); }} className="hover:text-sky-900 ml-0.5">×</button>
              </span>
            )}
            {showAvailableOnly && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-full font-medium">
                ✓ Available only
                <button onClick={() => setParam('available', null)} className="hover:text-emerald-900 ml-0.5">×</button>
              </span>
            )}
          </div>
        )}

        {/* Results */}
        {sortedComponents.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-slate-700 text-lg font-medium">No components found</p>
            <p className="text-slate-400 text-sm mt-2 mb-6">Try adjusting your filters or search terms</p>
            <button
              onClick={clearAllFilters}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            {/* Desktop View - Table */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-16"></th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Manufacturer</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Weight</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">MSRP</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">Build</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedComponents.map((component) => (
                      <tr
                        key={component.id}
                        onClick={() => navigate(`/components/${component.id}`)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4 w-16">
                          {component.imageUrl ? (
                            <img
                              src={component.imageUrl}
                              alt={component.name}
                              className="w-12 h-12 object-cover rounded-xl border border-slate-200 group-hover:border-sky-300 transition-colors"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                              <span className="text-lg">{TYPE_ICONS[component.type] || '📦'}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-slate-800 group-hover:text-sky-600 transition-colors">{component.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            to={`/manufacturers/${component.manufacturer.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm text-slate-600 hover:text-sky-600 transition-colors font-medium"
                          >
                            {component.manufacturer.name}
                          </Link>
                          <div className="text-xs text-slate-400 mt-0.5">{component.manufacturer.country}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                            <span>{TYPE_ICONS[component.type] || '📦'}</span>
                            {TYPE_LABELS[component.type] || component.type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 tabular-nums">{formatWeight(component.weightOz)}</td>
                        <td className="px-6 py-4 text-sm text-slate-800 font-semibold tabular-nums">{formatPrice(component.msrpCents)}</td>
                        <td className="px-6 py-4">
                          {component.discontinued ? (
                            <span className="px-2.5 py-1 inline-flex text-xs font-medium rounded-full bg-red-50 text-red-600 border border-red-200">
                              Discontinued
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 inline-flex text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Available
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isInCart(component.id)) {
                                removeFromCart(component.id);
                              } else {
                                addToCart(component);
                                openCart();
                              }
                            }}
                            title={isInCart(component.id) ? 'Remove from build cart' : 'Add to build cart'}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all text-sm font-bold ${
                              isInCart(component.id)
                                ? 'bg-emerald-100 text-emerald-600 hover:bg-red-50 hover:text-red-500'
                                : 'bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-200'
                            }`}
                          >
                            {isInCart(component.id) ? '✓' : '+'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile View - Cards */}
            <div className="md:hidden grid grid-cols-1 gap-3">
              {paginatedComponents.map((component) => (
                <Link
                  key={component.id}
                  to={`/components/${component.id}`}
                  className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-sky-300 hover:shadow-sm transition-all block"
                >
                  <div className="flex items-start gap-3">
                    {component.imageUrl ? (
                      <img
                        src={component.imageUrl}
                        alt={component.name}
                        className="w-14 h-14 object-cover rounded-xl border border-slate-200 flex-shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-200">
                        <span className="text-2xl">{TYPE_ICONS[component.type] || '📦'}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-slate-800 text-sm leading-snug">{component.name}</h3>
                        {component.discontinued ? (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 text-red-600 border border-red-200 whitespace-nowrap flex-shrink-0">
                            Discontinued
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap flex-shrink-0">
                            Available
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{component.manufacturer.name}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-xs">
                          {TYPE_ICONS[component.type]} {TYPE_LABELS[component.type] || component.type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-slate-400">{formatWeight(component.weightOz)}</span>
                        <span className="text-xs font-semibold text-slate-700">{formatPrice(component.msrpCents)}</span>
                      </div>
                    </div>
                  </div>
                  {/* Add to build button row */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end" onClick={(e) => e.preventDefault()}>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isInCart(component.id)) {
                          removeFromCart(component.id);
                        } else {
                          addToCart(component);
                          openCart();
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isInCart(component.id)
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-red-50 hover:text-red-600'
                          : 'bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-200'
                      }`}
                    >
                      {isInCart(component.id) ? (
                        <><span>✓</span> In Cart</>
                      ) : (
                        <><span>+</span> Add to Build</>
                      )}
                    </button>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div>
              <Pagination
                currentPage={currentPage}
                totalItems={sortedComponents.length}
                perPage={perPage}
                onPageChange={setPage}
                onPerPageChange={setPerPageParam}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
