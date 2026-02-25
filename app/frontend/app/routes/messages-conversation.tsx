import { useQuery, useMutation } from '@apollo/client/react';
import { Link, useParams, useNavigate } from 'react-router';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth-context';
import {
  GET_CONVERSATION,
  GET_MY_CONVERSATIONS,
  SEND_MESSAGE,
  MARK_CONVERSATION_READ,
} from '../lib/graphql-operations';

interface MsgUser {
  id: string;
  username: string;
  avatarUrl: string | null;
}

interface Message {
  id: string;
  body: string;
  read: boolean;
  createdAt: string;
  user: MsgUser;
}

interface ConvListing {
  id: string;
  title: string;
  listingType: string;
  status: string;
  priceCents: number | null;
  component: {
    id: string;
    name: string;
    imageUrl: string | null;
    manufacturer: { id: string; name: string };
  };
}

interface Conversation {
  id: string;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
  buyer: MsgUser;
  seller: MsgUser;
  listing: ConvListing;
  messages: Message[];
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff < 7) return d.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Avatar({ user, size = 8 }: { user: MsgUser; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-sky-400 to-indigo-400`;
  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.username} className={`${cls} object-cover`} />;
  }
  return <div className={cls}>{user.username[0]?.toUpperCase()}</div>;
}

export function meta() {
  return [{ title: 'Conversation – Loadout Lab' }];
}

export default function MessagesConversation() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [body, setBody] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const markedReadRef = useRef(false);

  const { data, loading } = useQuery<{ conversation: Conversation }>(GET_CONVERSATION, {
    variables: { id },
    skip: !isAuthenticated || !id,
    pollInterval: 5000,
  });

  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE, {
    refetchQueries: [
      { query: GET_CONVERSATION, variables: { id } },
      { query: GET_MY_CONVERSATIONS },
    ],
  });

  const [markRead] = useMutation(MARK_CONVERSATION_READ, {
    refetchQueries: [{ query: GET_MY_CONVERSATIONS }],
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.conversation?.messages?.length]);

  // Mark as read once on first load with unread messages
  useEffect(() => {
    if (data?.conversation && data.conversation.unreadCount > 0 && !markedReadRef.current) {
      markedReadRef.current = true;
      markRead({ variables: { conversationId: id } });
    }
  }, [data?.conversation?.id]);

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setBody('');
    await sendMessage({ variables: { conversationId: id!, body: trimmed } });
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-sky-500 animate-pulse" />
          <span className="text-slate-500">Loading conversation…</span>
        </div>
      </div>
    );
  }

  if (!data?.conversation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-slate-600 font-medium mb-4">Conversation not found</p>
          <Link to="/messages" className="text-sm text-sky-600 hover:underline">← Back to messages</Link>
        </div>
      </div>
    );
  }

  const conv = data.conversation;
  const other = conv.buyer.id === user?.id ? conv.seller : conv.buyer;
  const img = conv.listing.component.imageUrl;

  // Group consecutive messages by same sender
  const messages = conv.messages;

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Sticky nav */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200/60 flex-shrink-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-4">
          <button onClick={() => navigate('/messages')} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <Avatar user={other} size={8} />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">@{other.username}</p>
            <Link
              to={`/marketplace/${conv.listing.id}`}
              className="text-xs text-slate-400 hover:text-sky-600 transition-colors truncate block max-w-xs"
              onClick={(e) => e.stopPropagation()}
            >
              {conv.listing.title}
            </Link>
          </div>

          {/* Listing thumbnail */}
          <Link to={`/marketplace/${conv.listing.id}`} className="flex-shrink-0">
            <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
              {img ? (
                <img src={img} alt="" className="w-full h-full object-contain p-0.5" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-lg">{conv.listing.listingType === 'for_sale' ? '🏷️' : '✨'}</span>
                </div>
              )}
            </div>
          </Link>
        </div>
      </nav>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-1">
          {/* Listing context banner */}
          <div className="flex items-center justify-center mb-6">
            <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3 max-w-sm">
              {img && (
                <img src={img} alt="" className="w-10 h-10 object-contain rounded-lg bg-slate-50 flex-shrink-0 p-0.5" />
              )}
              <div className="min-w-0">
                <p className="text-xs text-slate-400">{conv.listing.listingType === 'for_sale' ? '🏷️ For Sale' : '✨ Show Off'}</p>
                <p className="text-sm font-medium text-slate-700 truncate">{conv.listing.title}</p>
                {conv.listing.priceCents ? (
                  <p className="text-xs text-slate-500">${(conv.listing.priceCents / 100).toLocaleString()}</p>
                ) : null}
              </div>
              <Link to={`/marketplace/${conv.listing.id}`} className="flex-shrink-0 text-xs text-sky-600 hover:underline">
                View
              </Link>
            </div>
          </div>

          {messages.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-8">No messages yet. Say hello!</p>
          )}

          {messages.map((msg, i) => {
            const isMe = msg.user.id === user?.id;
            const prevMsg = messages[i - 1];
            const isSameSender = prevMsg?.user.id === msg.user.id;
            const showAvatar = !isMe && !isSameSender;
            const showTimestamp = !isSameSender ||
              (prevMsg && new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 300000);

            return (
              <div key={msg.id}>
                {showTimestamp && (
                  <div className="flex justify-center my-3">
                    <span className="text-[11px] text-slate-400 bg-slate-100 px-3 py-0.5 rounded-full">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                )}
                <div className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {/* Their avatar placeholder for alignment */}
                  {!isMe && (
                    <div className="w-7 flex-shrink-0">
                      {showAvatar && <Avatar user={msg.user} size={7} />}
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      isMe
                        ? 'bg-sky-500 text-white rounded-br-md'
                        : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-bl-md'
                    } ${!isSameSender ? '' : (isMe ? 'rounded-tr-2xl' : 'rounded-tl-2xl')}`}
                  >
                    {msg.body}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-white border-t border-slate-200 px-4 py-3">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Message… (Enter to send, Shift+Enter for newline)"
            className="flex-1 resize-none px-4 py-2.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all max-h-32 overflow-y-auto"
            style={{ minHeight: '44px' }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
            }}
          />
          <button
            type="submit"
            disabled={!body.trim() || sending}
            className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 text-white flex items-center justify-center transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
