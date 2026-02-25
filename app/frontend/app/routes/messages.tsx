import { useQuery } from '@apollo/client/react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../lib/auth-context';
import { GET_MY_CONVERSATIONS } from '../lib/graphql-operations';

interface ConvUser {
  id: string;
  username: string;
  avatarUrl: string | null;
}

interface ConvListing {
  id: string;
  title: string;
  listingType: string;
  status: string;
  component: {
    id: string;
    name: string;
    imageUrl: string | null;
    manufacturer: { id: string; name: string };
  };
}

interface LatestMessage {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; username: string };
}

interface Conversation {
  id: string;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
  buyer: ConvUser;
  seller: ConvUser;
  listing: ConvListing;
  latestMessage: LatestMessage | null;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString();
}

function Avatar({ user, size = 9 }: { user: ConvUser; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-sky-400 to-indigo-400`;
  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.username} className={`${cls} object-cover`} />;
  }
  return <div className={cls}>{user.username[0]?.toUpperCase()}</div>;
}

export function meta() {
  return [{ title: 'Messages – Loadout Lab' }];
}

export default function Messages() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const { data, loading } = useQuery<{ myConversations: Conversation[] }>(GET_MY_CONVERSATIONS, {
    skip: !isAuthenticated,
    pollInterval: 15000,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">💬</p>
          <h1 className="text-xl font-semibold text-slate-800 mb-2">Sign in to view messages</h1>
          <Link to="/login" className="px-5 py-2.5 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-sky-500 to-indigo-500">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const conversations = data?.myConversations ?? [];
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Messages</h1>
            {totalUnread > 0 && (
              <p className="text-sm text-sky-600 mt-0.5">{totalUnread} unread</p>
            )}
          </div>
          <Link to="/marketplace" className="text-sm text-slate-500 hover:text-sky-600 transition-colors">
            ← Back to Community Gear
          </Link>
        </div>

        {loading && conversations.length === 0 ? (
          <div className="flex items-center gap-3 py-16 justify-center">
            <div className="w-5 h-5 rounded-full bg-sky-500 animate-pulse" />
            <span className="text-slate-500">Loading…</span>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">💬</p>
            <p className="text-slate-600 font-medium mb-1">No messages yet</p>
            <p className="text-slate-400 text-sm mb-6">When you show interest in a listing, your conversation will appear here.</p>
            <Link to="/marketplace" className="px-5 py-2.5 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 shadow-sm transition-all">
              Browse Community Gear
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
            {conversations.map((conv) => {
              const other = conv.buyer.id === user?.id ? conv.seller : conv.buyer;
              const isUnread = conv.unreadCount > 0;
              const img = conv.listing.component.imageUrl;
              const timestamp = conv.lastMessageAt || conv.createdAt;

              return (
                <button
                  key={conv.id}
                  onClick={() => navigate(`/messages/${conv.id}`)}
                  className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-sky-50/60 transition-colors text-left ${isUnread ? 'bg-sky-50/40' : ''}`}
                >
                  {/* Listing thumbnail */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex-shrink-0 overflow-hidden">
                    {img ? (
                      <img src={img} alt={conv.listing.component.name} className="w-full h-full object-contain p-1" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar user={other} size={10} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`text-sm font-semibold truncate ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>
                        @{other.username}
                      </p>
                      <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(timestamp)}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mb-0.5">{conv.listing.title}</p>
                    {conv.latestMessage ? (
                      <p className={`text-sm truncate ${isUnread ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                        {conv.latestMessage.user.id === user?.id ? 'You: ' : ''}{conv.latestMessage.body}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No messages yet</p>
                    )}
                  </div>

                  {/* Unread badge */}
                  {isUnread && (
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}

                  {/* Listing type badge */}
                  <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${conv.listing.listingType === 'for_sale' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                    {conv.listing.listingType === 'for_sale' ? '🏷️ Sale' : '✨ Show'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
