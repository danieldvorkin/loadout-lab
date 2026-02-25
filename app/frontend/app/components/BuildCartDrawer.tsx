import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { Link } from 'react-router';
import { useBuildCart } from '../lib/build-cart-context';
import { useAuth } from '../lib/auth-context';
import { GET_BUILDS, CREATE_BUILD, ADD_COMPONENT_TO_BUILD } from '../lib/graphql-operations';

const TYPE_ICONS: Record<string, string> = {
  action: '⚙️', barrel: '🔫', bipod: '🦵', buttpad: '🛡️', chassis: '🔩',
  cheek_riser: '📐', grip: '✊', magazine: '📦', mount: '🔧', muzzle_device: '💨',
  other: '📋', rings: '⭕', scope: '🔭', stock: '🪵', trigger: '☝️',
};

interface Build {
  id: string;
  name: string;
  discipline: string | null;
  buildComponents: { id: string }[];
}

export default function BuildCartDrawer() {
  const { cartItems, removeFromCart, clearCart, isOpen, closeCart, toggleCart } = useBuildCart();
  const { isAuthenticated } = useAuth();

  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [selectedBuildId, setSelectedBuildId] = useState<string>('');
  const [newBuildName, setNewBuildName] = useState('');
  const [adding, setAdding] = useState(false);
  const [successBuild, setSuccessBuild] = useState<{ id: string; name: string } | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  const { data: buildsData } = useQuery<{ builds: Build[] }>(GET_BUILDS, {
    skip: !isAuthenticated || !isOpen,
  });

  const [createBuild] = useMutation(CREATE_BUILD);
  const [addComponentToBuild] = useMutation(ADD_COMPONENT_TO_BUILD);

  const builds = buildsData?.builds || [];

  // Don't render anything for unauthenticated users
  if (!isAuthenticated) return null;

  const handleAddToBuild = async () => {
    if (cartItems.length === 0) return;
    if (mode === 'existing' && !selectedBuildId) {
      setAddError('Please select a build');
      return;
    }
    if (mode === 'new' && !newBuildName.trim()) {
      setAddError('Please enter a build name');
      return;
    }

    setAdding(true);
    setAddError(null);

    try {
      let buildId = selectedBuildId;
      let buildName = '';

      if (mode === 'new') {
        const result = await createBuild({ variables: { name: newBuildName.trim() } });
        const newBuild = (result.data as { createBuild?: { id: string; name: string } })?.createBuild;
        buildId = newBuild?.id || '';
        buildName = newBuildName.trim();
      } else {
        buildName = builds.find(b => b.id === selectedBuildId)?.name || 'Build';
      }

      for (const item of cartItems) {
        try {
          await addComponentToBuild({
            variables: {
              buildId,
              componentId: item.id,
              position: item.type,
            },
          });
        } catch {
          // continue adding other items if one fails
        }
      }

      setSuccessBuild({ id: buildId, name: buildName });
      clearCart();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Failed to add to build');
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => {
    closeCart();
    setSuccessBuild(null);
    setAddError(null);
  };

  return (
    <>
      {/* Floating Cart Button */}
      <button
        onClick={toggleCart}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        title="Build Cart"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        {cartItems.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-sky-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-md">
            {cartItems.length > 9 ? '9+' : cartItems.length}
          </span>
        )}
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Build Cart
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {cartItems.length} component{cartItems.length !== 1 ? 's' : ''} selected
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {successBuild ? (
          /* Success State */
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-5">
              <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Added to Build!</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              Components successfully added to{' '}
              <span className="font-semibold text-slate-700">"{successBuild.name}"</span>
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Link
                to={`/builds/${successBuild.id}`}
                onClick={handleClose}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold text-sm transition-colors"
              >
                View Build →
              </Link>
              <button
                onClick={() => { setSuccessBuild(null); closeCart(); }}
                className="px-6 py-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
              >
                Keep Browsing
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto py-4 px-6">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center pb-12">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-9 h-9 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-slate-700 font-semibold">Cart is empty</p>
                  <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                    Browse components and tap the{' '}
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-sky-100 text-sky-600 rounded-full text-xs font-bold">+</span>
                    {' '}button to add them here
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 group"
                    >
                      <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">{TYPE_ICONS[item.type] || '📦'}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.manufacturer.name}
                          <span className="mx-1.5 text-slate-300">·</span>
                          <span className="capitalize">{item.type.replace(/_/g, ' ')}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                        title="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add to Build Section */}
            {cartItems.length > 0 && (
              <div className="border-t border-slate-200 p-6 bg-slate-50 space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Add to Build
                </h3>

                {/* Mode tabs */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode('existing')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
                      mode === 'existing'
                        ? 'bg-slate-800 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    Existing Build
                  </button>
                  <button
                    onClick={() => setMode('new')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
                      mode === 'new'
                        ? 'bg-slate-800 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    New Build
                  </button>
                </div>

                {mode === 'existing' ? (
                  <select
                    value={selectedBuildId}
                    onChange={(e) => { setSelectedBuildId(e.target.value); setAddError(null); }}
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                  >
                    <option value="">Select a build...</option>
                    {builds.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.buildComponents.length} component{b.buildComponents.length !== 1 ? 's' : ''})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={newBuildName}
                    onChange={(e) => { setNewBuildName(e.target.value); setAddError(null); }}
                    placeholder="e.g., Competition PRS Rifle"
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddToBuild()}
                  />
                )}

                {addError && (
                  <p className="text-red-500 text-xs -mt-1">{addError}</p>
                )}

                <button
                  onClick={handleAddToBuild}
                  disabled={adding}
                  className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-sky-500/20"
                >
                  {adding
                    ? 'Adding...'
                    : `Add ${cartItems.length} Component${cartItems.length !== 1 ? 's' : ''} to Build →`}
                </button>

                <button
                  onClick={clearCart}
                  className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Clear cart
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
