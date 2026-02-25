import { useQuery, useMutation } from '@apollo/client/react';
import { Link, useNavigate } from 'react-router';
import { useState, useMemo } from 'react';
import { useAuth } from '../lib/auth-context';
import { AppNav } from '../components/AppNav';
import {
  GET_LISTINGS,
  GET_MY_LISTINGS,
  CREATE_LISTING,
  UPDATE_LISTING,
  DELETE_LISTING,
  GET_COMPONENTS,
  START_CONVERSATION,
} from '../lib/graphql-operations';

export function meta() {
  return [
    { title: 'Community Gear – Loadout Lab' },
    { name: 'description', content: 'Show off your PRS rifle loadout or find parts from the community' },
  ];
}

interface ListingUser {
  id: string;
  username: string;
  avatarUrl: string | null;
  location: string | null;
}

interface ListingComponent {
  id: string;
  name: string;
  type: string | null;
  weightOz: number | null;
  msrpCents: number | null;
  imageUrl: string | null;
  manufacturer: { id: string; name: string };
}

interface ListingBuildComponent {
  id: string;
  position: string | null;
  build: { id: string; name: string };
}

interface Listing {
  id: string;
  title: string;
  description: string | null;
  listingType: string;
  status: string;
  condition: string;
  priceCents: number | null;
  location: string | null;
  contactInfo: string | null;
  imageUrl: string | null;
  createdAt: string;
  user: ListingUser;
  component: ListingComponent;
  buildComponent: ListingBuildComponent | null;
}

interface Component {
  id: string;
  name: string;
  type: string | null;
  msrpCents: number | null;
  imageUrl: string | null;
  manufacturer: { id: string; name: string };
}

const CONDITION_LABELS: Record<string, string> = {
  new_condition: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
};

const CONDITION_COLORS: Record<string, string> = {
  new_condition: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  like_new: 'bg-sky-50 text-sky-700 border-sky-200',
  good: 'bg-amber-50 text-amber-700 border-amber-200',
  fair: 'bg-slate-50 text-slate-600 border-slate-200',
};

function formatPrice(cents: number | null): string {
  if (cents === null || cents === 0) return 'Make offer';
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

const DEFAULT_FORM = {
  componentId: '',
  listingType: 'showcase' as 'for_sale' | 'showcase',
  condition: 'like_new',
  title: '',
  description: '',
  priceInput: '',
  location: '',
  contactInfo: '',
};

export default function Marketplace() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'all' | 'for_sale' | 'showcase' | 'mine'>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [compSearch, setCompSearch] = useState('');
  const [compTypeFilter, setCompTypeFilter] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  // Debounce search
  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout((window as any)._mktSearch);
    (window as any)._mktSearch = setTimeout(() => setDebouncedSearch(val), 300);
  };

  const listingType = tab === 'for_sale' || tab === 'showcase' ? tab : undefined;

  const { data, loading, refetch } = useQuery<{ listings: Listing[] }>(GET_LISTINGS, {
    variables: { listingType, search: debouncedSearch || undefined, limit: 60 },
    skip: tab === 'mine',
  });

  const { data: myData, loading: myLoading, refetch: refetchMine } = useQuery<{ myListings: Listing[] }>(
    GET_MY_LISTINGS,
    { skip: !isAuthenticated || tab !== 'mine' }
  );

  const { data: componentsData } = useQuery<{ components: Component[] }>(GET_COMPONENTS, {
    skip: !isAuthenticated || !showCreateForm,
  });

  const allComponents = componentsData?.components ?? [];
  const componentTypes = useMemo(
    () => [...new Set(allComponents.map(c => c.type).filter((t): t is string => Boolean(t)))].sort(),
    [allComponents]
  );
  const filteredComponents = useMemo(() => {
    const q = compSearch.toLowerCase();
    return allComponents
      .filter(c => {
        const matchesSearch = !q || c.name.toLowerCase().includes(q) || c.manufacturer.name.toLowerCase().includes(q);
        const matchesType = !compTypeFilter || c.type === compTypeFilter;
        return matchesSearch && matchesType;
      })
      .slice(0, 50);
  }, [allComponents, compSearch, compTypeFilter]);
  const selectedComponent = allComponents.find(c => c.id === form.componentId);

  const handleCopyLink = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/marketplace/${id}`);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const [createListing, { loading: creating }] = useMutation(CREATE_LISTING, {
    onCompleted: () => {
      setShowCreateForm(false);
      setForm(DEFAULT_FORM);
      setFormError(null);
      refetch();
      refetchMine();
    },
    onError: (e) => setFormError(e.message),
  });

  const [updateListing] = useMutation(UPDATE_LISTING, {
    onCompleted: () => { refetch(); refetchMine(); setSelectedListing(null); },
  });

  const [deleteListing] = useMutation(DELETE_LISTING, {
    onCompleted: () => { refetch(); refetchMine(); setSelectedListing(null); },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.componentId) { setFormError('Please select a component.'); return; }

    const priceCents = form.listingType === 'for_sale' && form.priceInput
      ? Math.round(parseFloat(form.priceInput) * 100)
      : null;

    createListing({
      variables: {
        componentId: form.componentId,
        listingType: form.listingType,
        condition: form.condition,
        title: form.title,
        description: form.description || null,
        priceCents,
        location: form.location || null,
        contactInfo: form.contactInfo || null,
      },
    });
  };

  const handleMarkSold = (listing: Listing) => {
    updateListing({ variables: { id: listing.id, status: 'sold' } });
  };

  const handleRemove = (listing: Listing) => {
    if (window.confirm('Remove this listing?')) {
      deleteListing({ variables: { id: listing.id } });
    }
  };

  const listings: Listing[] = tab === 'mine' ? (myData?.myListings ?? []) : (data?.listings ?? []);
  const isLoading = tab === 'mine' ? myLoading : loading;

  const inputClass = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500';
  const labelClass = 'block text-xs font-medium text-slate-600 mb-1';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <AppNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Community Gear</h1>
            <p className="text-slate-500 mt-1 text-sm">Show off your loadout, find parts, or post gear for sale — all from fellow competitors</p>
          </div>
          {isAuthenticated && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 shadow-md shadow-sky-500/20 transition-all"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Post Gear
            </button>
          )}
        </div>

        {/* Create Form */}
        {showCreateForm && isAuthenticated && (
          <div className="mb-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-1">Post Gear</h2>
            <p className="text-sm text-slate-400 mb-5">Share something with the community — show off your setup or list something for sale.</p>
            <form onSubmit={handleCreate} className="space-y-5">
              {/* Type toggle */}
              <div>
                <label className={labelClass}>What are you doing?</label>
                <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, listingType: 'showcase', priceInput: '' })}
                    className={`px-5 py-2 text-sm font-medium transition-colors ${form.listingType === 'showcase' ? 'bg-sky-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    ✨ Show Off My Gear
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, listingType: 'for_sale' })}
                    className={`px-5 py-2 text-sm font-medium transition-colors ${form.listingType === 'for_sale' ? 'bg-amber-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    🏷️ Selling Something
                  </button>
                </div>
                {form.listingType === 'showcase' && (
                  <p className="text-xs text-sky-600 mt-1.5">✨ No transaction — just sharing your loadout with the community</p>
                )}
              </div>

              {/* Component picker */}
              <div>
                <label className={labelClass}>Component *</label>
                {selectedComponent ? (
                  <div className="flex items-center gap-3 p-3 border border-sky-200 bg-sky-50 rounded-xl">
                    {selectedComponent.imageUrl ? (
                      <img src={selectedComponent.imageUrl} alt={selectedComponent.name} className="w-12 h-12 object-contain rounded-lg bg-white border border-slate-100 p-1 flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-300">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{selectedComponent.manufacturer.name} {selectedComponent.name}</p>
                      <p className="text-xs text-slate-500">{selectedComponent.type}{selectedComponent.msrpCents ? ` · $${(selectedComponent.msrpCents / 100).toLocaleString()}` : ''}</p>
                      {selectedComponent.imageUrl && (
                        <p className="text-xs text-sky-600 mt-0.5">📷 Photo from our database</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => { setForm({ ...form, componentId: '', title: '' }); setCompSearch(''); }}
                      className="text-slate-400 hover:text-slate-600 flex-shrink-0 p-1 rounded hover:bg-sky-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          value={compSearch}
                          onChange={(e) => setCompSearch(e.target.value)}
                          placeholder="Search by name or manufacturer…"
                          className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                        />
                      </div>
                      <select
                        value={compTypeFilter}
                        onChange={(e) => setCompTypeFilter(e.target.value)}
                        className="px-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-slate-600"
                      >
                        <option value="">All types</option>
                        {componentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                      {allComponents.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-6">Loading components…</p>
                      ) : filteredComponents.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-6">No components found — try a different search</p>
                      ) : (
                        filteredComponents.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setForm({ ...form, componentId: c.id, title: `${c.manufacturer.name} ${c.name}` })}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-sky-50 border-b border-slate-100 last:border-b-0 text-left transition-colors"
                          >
                            {c.imageUrl ? (
                              <img src={c.imageUrl} alt={c.name} className="w-9 h-9 object-contain rounded-md bg-white border border-slate-100 flex-shrink-0 p-0.5" />
                            ) : (
                              <div className="w-9 h-9 rounded-md bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-300">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{c.manufacturer.name} – {c.name}</p>
                              <p className="text-xs text-slate-400">{c.type || '—'}{c.msrpCents ? ` · $${(c.msrpCents / 100).toLocaleString()}` : ''}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                    {!compSearch && allComponents.length > 50 && (
                      <p className="text-xs text-slate-400 text-center">Showing first 50 — search to find from {allComponents.length.toLocaleString()} components</p>
                    )}
                  </div>
                )}
              </div>

              {/* Condition */}
              <div>
                <label className={labelClass}>Condition *</label>
                <select required value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className={inputClass}>
                  <option value="new_condition">New (never used)</option>
                  <option value="like_new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className={labelClass}>Title *</label>
                <input required type="text" maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Zermatt Arms Origin action – like new, 200 rounds" className={inputClass} />
              </div>

              {/* Description */}
              <div>
                <label className={labelClass}>Description</label>
                <textarea rows={3} maxLength={2000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Details about the item, what's included, reason for selling…" className={inputClass} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Price (for_sale only) */}
                {form.listingType === 'for_sale' && (
                  <div>
                    <label className={labelClass}>Asking Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.priceInput}
                      onChange={(e) => setForm({ ...form, priceInput: e.target.value })}
                      placeholder="Leave blank = make offer"
                      className={inputClass}
                    />
                  </div>
                )}
                {/* Location */}
                <div>
                  <label className={labelClass}>Location</label>
                  <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Colorado Springs, CO" className={inputClass} />
                </div>
                {/* Contact */}
                <div>
                  <label className={labelClass}>Contact Info</label>
                  <input type="text" value={form.contactInfo} onChange={(e) => setForm({ ...form, contactInfo: e.target.value })} placeholder="Email, phone, or @username" className={inputClass} />
                </div>
              </div>

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{formError}</p>
              )}

              <div className="flex gap-3">
                <button type="submit" disabled={creating} className="px-6 py-2.5 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 disabled:opacity-60 shadow-sm transition-all">
                  {creating ? 'Posting…' : form.listingType === 'showcase' ? '✨ Post to Community' : '🏷️ Post for Sale'}
                </button>
                <button type="button" onClick={() => { setShowCreateForm(false); setForm(DEFAULT_FORM); setFormError(null); }} className="px-5 py-2.5 text-sm font-medium rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            {[
              { key: 'all', label: 'All Posts' },
              { key: 'showcase', label: '✨ Show Off' },
              { key: 'for_sale', label: '🏷️ For Sale' },
              ...(isAuthenticated ? [{ key: 'mine', label: 'My Posts' }] : []),
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key as typeof tab)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${tab === key ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {tab !== 'mine' && (
            <div className="relative flex-1 max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search listings…"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
              />
            </div>
          )}
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-slate-500">Loading listings…</span>
            </div>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">{tab === 'for_sale' ? '🏷️' : tab === 'showcase' ? '✨' : '🎯'}</div>
            <p className="text-slate-600 font-medium mb-1">
              {tab === 'mine' ? "You haven't posted anything yet" : 'Nothing here yet'}
            </p>
            <p className="text-slate-400 text-sm">
              {tab === 'mine'
                ? 'Click "Post Gear" to show off your setup or list something for sale'
                : search ? 'Try a different search term' : 'Be the first to post something!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                currentUserId={user?.id}
                onMarkSold={() => handleMarkSold(listing)}
                onRemove={() => handleRemove(listing)}
                onClick={() => setSelectedListing(listing)}
                onCopyLink={() => handleCopyLink(listing.id)}
                copied={copied === listing.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedListing && (
        <ListingModal
          listing={selectedListing}
          currentUserId={user?.id}
          isAuthenticated={isAuthenticated}
          onClose={() => setSelectedListing(null)}
          onMarkSold={() => handleMarkSold(selectedListing)}
          onRemove={() => handleRemove(selectedListing)}
          onCopyLink={() => handleCopyLink(selectedListing.id)}
          copied={copied === selectedListing.id}
          navigate={navigate}
        />
      )}
    </div>
  );
}

function ListingCard({
  listing,
  currentUserId,
  onMarkSold,
  onRemove,
  onClick,
  onCopyLink,
  copied,
}: {
  listing: Listing;
  currentUserId?: string;
  onMarkSold: () => void;
  onRemove: () => void;
  onClick: () => void;
  onCopyLink: () => void;
  copied: boolean;
}) {
  const isOwner = currentUserId === listing.user.id;
  const isSold = listing.status === 'sold';
  const image = listing.imageUrl || listing.component.imageUrl;

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer group ${isSold ? 'opacity-70' : ''}`}
      onClick={onClick}
    >
      {/* Image */}
      <div className="h-44 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
        {image ? (
          <img src={image} alt={listing.title} className="w-full h-full object-contain p-3" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${listing.listingType === 'for_sale' ? 'bg-amber-500 text-white border-amber-500' : 'bg-sky-500 text-white border-sky-500'}`}>
            {listing.listingType === 'for_sale' ? '🏷️ For Sale' : '✨ Show Off'}
          </span>
          {isSold && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-white border-slate-700">SOLD</span>
          )}
        </div>
        <div className="absolute top-2 right-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CONDITION_COLORS[listing.condition] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
            {CONDITION_LABELS[listing.condition] || listing.condition}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="text-xs text-slate-400 mb-0.5">{listing.component.manufacturer.name}</p>
        <h3 className="font-semibold text-slate-800 text-sm leading-snug mb-1 line-clamp-2">{listing.title}</h3>

        {listing.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-3">{listing.description}</p>
        )}

        <div className="flex items-center justify-between">
          <div>
            {listing.listingType === 'for_sale' ? (
              <span className="text-lg font-bold text-slate-800">{formatPrice(listing.priceCents)}</span>
            ) : (
              <span className="text-sm text-sky-600 font-medium">Showcase</span>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">{timeAgo(listing.createdAt)}</p>
            {listing.location && <p className="text-xs text-slate-400 truncate max-w-24">{listing.location}</p>}
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-sky-400 to-indigo-400 flex items-center justify-center text-white text-[9px] font-bold">
              {listing.user.username[0]?.toUpperCase()}
            </div>
            <span className="text-xs text-slate-500">@{listing.user.username}</span>
          </div>
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onCopyLink}
              title="Copy shareable link"
              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              {copied ? '✓ Copied!' : '🔗 Share'}
            </button>
            {isOwner && !isSold && (
              <>
                <button onClick={onMarkSold} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200">
                  Mark Sold
                </button>
                <button onClick={onRemove} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-200">
                  Remove
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ListingModal({
  listing,
  currentUserId,
  isAuthenticated,
  onClose,
  onMarkSold,
  onRemove,
  onCopyLink,
  copied,
  navigate,
}: {
  listing: Listing;
  currentUserId?: string;
  isAuthenticated: boolean;
  onClose: () => void;
  onMarkSold: () => void;
  onRemove: () => void;
  onCopyLink: () => void;
  copied: boolean;
  navigate: (path: string) => void;
}) {
  const isOwner = currentUserId === listing.user.id;
  const isSold = listing.status === 'sold';
  const image = listing.imageUrl || listing.component.imageUrl;
  const [showInterest, setShowInterest] = useState(false);
  const [interestMsg, setInterestMsg] = useState('');
  const [interestError, setInterestError] = useState<string | null>(null);

  const [startConversation, { loading: starting }] = useMutation<{
    startConversation: { conversation: { id: string } | null; errors: string[] }
  }>(START_CONVERSATION, {
    onCompleted: (data) => {
      const conv = data?.startConversation?.conversation;
      if (conv) { onClose(); navigate(`/messages/${conv.id}`); }
      else setInterestError(data?.startConversation?.errors?.[0] ?? 'Something went wrong');
    },
    onError: (e) => setInterestError(e.message),
  });

  const handleSendInterest = (e: React.FormEvent) => {
    e.preventDefault();
    setInterestError(null);
    startConversation({ variables: { listingId: listing.id, message: interestMsg.trim() || undefined } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="h-56 bg-gradient-to-br from-slate-100 to-slate-200 rounded-t-2xl overflow-hidden relative">
          {image ? (
            <img src={image} alt={listing.title} className="w-full h-full object-contain p-4" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-600 hover:bg-white transition-colors shadow-sm">
            ✕
          </button>
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${listing.listingType === 'for_sale' ? 'bg-amber-500 text-white' : 'bg-sky-500 text-white'}`}>
              {listing.listingType === 'for_sale' ? '🏷️ For Sale' : '✨ Show Off'}
            </span>
            {isSold && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-700 text-white">SOLD</span>}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Title + Price */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">{listing.component.manufacturer.name} · {listing.component.type}</p>
              <h2 className="text-xl font-bold text-slate-800 leading-tight">{listing.title}</h2>
            </div>
            {listing.listingType === 'for_sale' && (
              <span className="text-2xl font-bold text-slate-800 whitespace-nowrap">{formatPrice(listing.priceCents)}</span>
            )}
          </div>

          {/* Condition + location */}
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${CONDITION_COLORS[listing.condition] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
              {CONDITION_LABELS[listing.condition] || listing.condition}
            </span>
            {listing.location && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {listing.location}
              </span>
            )}
          </div>

          {/* Description */}
          {listing.description && (
            <p className="text-sm text-slate-600 leading-relaxed">{listing.description}</p>
          )}

          {/* Component details */}
          <div className="bg-slate-50 rounded-xl p-3 text-sm space-y-1">
            <p className="font-semibold text-slate-700 text-xs uppercase tracking-wider mb-2">Component</p>
            <div className="flex justify-between">
              <span className="text-slate-500">Name</span>
              <span className="text-slate-700 font-medium">{listing.component.name}</span>
            </div>
            {listing.component.type && (
              <div className="flex justify-between">
                <span className="text-slate-500">Type</span>
                <span className="text-slate-700">{listing.component.type}</span>
              </div>
            )}
            {listing.component.weightOz && (
              <div className="flex justify-between">
                <span className="text-slate-500">Weight</span>
                <span className="text-slate-700">{listing.component.weightOz} oz</span>
              </div>
            )}
            {listing.component.msrpCents && (
              <div className="flex justify-between">
                <span className="text-slate-500">MSRP</span>
                <span className="text-slate-700">${(listing.component.msrpCents / 100).toLocaleString()}</span>
              </div>
            )}
            {listing.buildComponent && (
              <div className="flex justify-between">
                <span className="text-slate-500">From Build</span>
                <span className="text-slate-700">{listing.buildComponent.build.name}</span>
              </div>
            )}
          </div>

          {/* Seller + contact */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-indigo-400 flex items-center justify-center text-white text-sm font-bold">
                {listing.user.username[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">@{listing.user.username}</p>
                <p className="text-xs text-slate-400">{timeAgo(listing.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onCopyLink}
                className="px-3 py-2 text-sm font-medium rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                {copied ? '✓ Link Copied!' : '🔗 Share'}
              </button>
            </div>
          </div>

          {/* Interested CTA */}
          {!isOwner && !isSold && (
            <div className="space-y-2">
              {!showInterest ? (
                <div>
                  {isAuthenticated ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowInterest(true); setInterestMsg(`Hi, I’m interested in your ${listing.title}. Is it still available?`); }}
                      className="w-full py-2.5 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 shadow-sm transition-all"
                    >
                      💬 I’m Interested
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      className="block w-full py-2.5 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-sky-500 to-indigo-500 text-center shadow-sm"
                      onClick={onClose}
                    >
                      Sign in to contact seller
                    </Link>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSendInterest} className="space-y-2" onClick={(e) => e.stopPropagation()}>
                  <textarea
                    autoFocus
                    rows={3}
                    value={interestMsg}
                    onChange={(e) => setInterestMsg(e.target.value)}
                    placeholder="Say something to the seller…"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
                  />
                  {interestError && <p className="text-xs text-red-600">{interestError}</p>}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={starting}
                      className="flex-1 py-2.5 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-sky-500 to-indigo-500 disabled:opacity-60 shadow-sm transition-all"
                    >
                      {starting ? 'Sending…' : '💬 Send Message'}
                    </button>
                    <button type="button" onClick={() => { setShowInterest(false); setInterestError(null); }} className="px-4 py-2.5 text-sm font-medium rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Owner actions */}
          {isOwner && !isSold && (
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button onClick={onMarkSold} className="flex-1 py-2 text-sm font-medium rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
                ✓ Mark as Sold
              </button>
              <button onClick={onRemove} className="flex-1 py-2 text-sm font-medium rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors">
                Remove Listing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
