import { useQuery, useMutation } from '@apollo/client/react';
import { Link, useParams, useNavigate } from 'react-router';
import { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { AppNav } from '../components/AppNav';
import { GET_LISTING, UPDATE_LISTING, DELETE_LISTING, START_CONVERSATION } from '../lib/graphql-operations';

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

export function meta({ params }: { params: { id?: string } }) {
  return [
    { title: 'Listing – Loadout Lab' },
    { name: 'description', content: 'View this listing on Loadout Lab Community Gear' },
  ];
}

export default function MarketplaceListing() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showInterest, setShowInterest] = useState(false);
  const [interestMsg, setInterestMsg] = useState('');
  const [interestError, setInterestError] = useState<string | null>(null);

  const [startConversation, { loading: starting }] = useMutation<{
    startConversation: { conversation: { id: string } | null; errors: string[] }
  }>(START_CONVERSATION, {
    onCompleted: (data) => {
      const conv = data?.startConversation?.conversation;
      if (conv) navigate(`/messages/${conv.id}`);
      else setInterestError(data?.startConversation?.errors?.[0] ?? 'Something went wrong');
    },
    onError: (e) => setInterestError(e.message),
  });

  const handleSendInterest = (e: React.FormEvent) => {
    e.preventDefault();
    setInterestError(null);
    startConversation({ variables: { listingId: listing?.id, message: interestMsg.trim() || undefined } });
  };

  const { data, loading, error } = useQuery<{ listing: Listing }>(GET_LISTING, {
    variables: { id },
    skip: !id,
  });

  const [updateListing] = useMutation(UPDATE_LISTING, {
    onCompleted: () => navigate('/marketplace'),
  });

  const [deleteListing] = useMutation(DELETE_LISTING, {
    onCompleted: () => navigate('/marketplace'),
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-sky-500 animate-pulse" />
          <span className="text-slate-500">Loading…</span>
        </div>
      </div>
    );
  }

  if (error || !data?.listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🔍</p>
          <h1 className="text-xl font-semibold text-slate-800 mb-2">Listing not found</h1>
          <p className="text-slate-500 mb-6">This post may have been removed or the link is incorrect.</p>
          <Link to="/marketplace" className="px-5 py-2.5 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 transition-all shadow-sm">
            Browse Community Gear
          </Link>
        </div>
      </div>
    );
  }

  const listing = data.listing;
  const isOwner = user?.id === listing.user.id;
  const isSold = listing.status === 'sold';
  const image = listing.imageUrl || listing.component.imageUrl;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <AppNav />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-sky-600 transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Community Gear
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Image */}
          <div className="h-72 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
            {image ? (
              <img src={image} alt={listing.title} className="w-full h-full object-contain p-6" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${listing.listingType === 'for_sale' ? 'bg-amber-500 text-white' : 'bg-sky-500 text-white'}`}>
                {listing.listingType === 'for_sale' ? '🏷️ For Sale' : '✨ Show Off'}
              </span>
              {isSold && <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-700 text-white">SOLD</span>}
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Title + Price */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 mb-1">
                  {listing.component.manufacturer.name}
                  {listing.component.type ? ` · ${listing.component.type}` : ''}
                </p>
                <h1 className="text-2xl font-bold text-slate-800 leading-tight">{listing.title}</h1>
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
                <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-full px-2.5 py-1">
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
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-4">{listing.description}</p>
            )}

            {/* Component details */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <p className="font-semibold text-slate-600 text-xs uppercase tracking-wider mb-3">Component Details</p>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-slate-500">Component</span>
                <span className="text-slate-700 font-medium">{listing.component.name}</span>
                {listing.component.type && (
                  <>
                    <span className="text-slate-500">Type</span>
                    <span className="text-slate-700">{listing.component.type}</span>
                  </>
                )}
                {listing.component.weightOz && (
                  <>
                    <span className="text-slate-500">Weight</span>
                    <span className="text-slate-700">{listing.component.weightOz} oz</span>
                  </>
                )}
                {listing.component.msrpCents && (
                  <>
                    <span className="text-slate-500">MSRP</span>
                    <span className="text-slate-700">${(listing.component.msrpCents / 100).toLocaleString()}</span>
                  </>
                )}
                {listing.buildComponent && (
                  <>
                    <span className="text-slate-500">From Build</span>
                    <span className="text-slate-700">{listing.buildComponent.build.name}</span>
                  </>
                )}
              </div>
            </div>

            {/* Seller info + actions */}
            <div className="space-y-3 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-indigo-400 flex items-center justify-center text-white text-sm font-bold">
                    {listing.user.username[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">@{listing.user.username}</p>
                    <p className="text-xs text-slate-400">Posted {timeAgo(listing.createdAt)}</p>
                  </div>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 text-sm font-medium rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  {copied ? '✓ Copied!' : '🔗 Share'}
                </button>
              </div>

              {/* CTA: Interested / not owner / not sold */}
              {!isOwner && !isSold && (
                <div className="space-y-2">
                  {!showInterest ? (
                    <div className="flex gap-2">
                      {isAuthenticated ? (
                        <button
                          onClick={() => { setShowInterest(true); setInterestMsg(`Hi, I'm interested in your ${listing.title}. Is it still available?`); }}
                          className="flex-1 py-2.5 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 shadow-sm transition-all"
                        >
                          💬 I'm Interested
                        </button>
                      ) : (
                        <Link
                          to="/login"
                          className="flex-1 py-2.5 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-sky-500 to-indigo-500 text-center shadow-sm"
                        >
                          Sign in to contact seller
                        </Link>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleSendInterest} className="space-y-2">
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
                          className="flex-1 py-2.5 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 disabled:opacity-60 shadow-sm transition-all"
                        >
                          {starting ? 'Sending…' : '💬 Send Message'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowInterest(false); setInterestError(null); }}
                          className="px-4 py-2.5 text-sm font-medium rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Owner actions */}
            {isOwner && !isSold && (
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => updateListing({ variables: { id: listing.id, status: 'sold' } })}
                  className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                >
                  ✓ Mark as Sold
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Remove this post?')) {
                      deleteListing({ variables: { id: listing.id } });
                    }
                  }}
                  className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
                >
                  Remove Post
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
