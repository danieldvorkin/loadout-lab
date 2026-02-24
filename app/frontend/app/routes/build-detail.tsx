import { useQuery, useMutation } from '@apollo/client/react';
import { Link, useParams, useNavigate } from 'react-router';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth-context';
import {
  GET_BUILD,
  GET_COMPONENTS,
  ADD_COMPONENT_TO_BUILD,
  REMOVE_COMPONENT_FROM_BUILD,
} from '../lib/graphql-operations';

// ════════════════════════════════════════════
// Types
// ════════════════════════════════════════════

interface Component {
  id: string;
  name: string;
  type: string;
  weightOz: number | null;
  msrpCents: number | null;
  imageUrl: string | null;
  manufacturer: { id: string; name: string };
}

interface BuildComponent {
  id: string;
  position: string | null;
  specs: Record<string, unknown>;
  component: Component;
}

interface Build {
  id: string;
  name: string;
  discipline: string | null;
  totalWeightOz: number | null;
  totalCostCents: number | null;
  createdAt: string;
  updatedAt: string;
  buildComponents: BuildComponent[];
}

// ════════════════════════════════════════════
// Slot Configuration
// ════════════════════════════════════════════

interface SlotDef {
  position: string;
  label: string;
  icon: string;
  description: string;
  excludes: string[];
  allowMultiple?: boolean;
}

interface SlotGroup {
  name: string;
  description: string;
  icon: string;
  slots: SlotDef[];
}

const SLOT_GROUPS: SlotGroup[] = [
  {
    name: 'Core',
    description: 'The heart of your rifle',
    icon: '⚙️',
    slots: [
      { position: 'action', label: 'Action', icon: '🔩', description: 'Bolt action or receiver', excludes: [] },
      { position: 'barrel', label: 'Barrel', icon: '🔫', description: 'Match-grade barrel', excludes: [] },
      { position: 'trigger', label: 'Trigger', icon: '🎯', description: 'Trigger mechanism', excludes: [] },
    ],
  },
  {
    name: 'Platform',
    description: 'Choose one: chassis or traditional stock',
    icon: '🏗️',
    slots: [
      { position: 'chassis', label: 'Chassis', icon: '📐', description: 'Modular chassis system', excludes: ['stock'] },
      { position: 'stock', label: 'Stock', icon: '🪵', description: 'Traditional rifle stock', excludes: ['chassis'] },
    ],
  },
  {
    name: 'Optics',
    description: 'Glass and mounting system',
    icon: '🔭',
    slots: [
      { position: 'scope', label: 'Scope', icon: '🔭', description: 'Riflescope', excludes: [] },
      { position: 'mount', label: 'Scope Mount', icon: '🔧', description: 'One-piece scope mount', excludes: [] },
      { position: 'rings', label: 'Rings', icon: '⭕', description: 'Scope rings', excludes: [] },
    ],
  },
  {
    name: 'Accessories',
    description: 'Finishing touches for your build',
    icon: '🧩',
    slots: [
      { position: 'muzzle_device', label: 'Muzzle Device', icon: '💨', description: 'Brake, suppressor, or flash hider', excludes: [] },
      { position: 'bipod', label: 'Bipod', icon: '📌', description: 'Support system', excludes: [] },
      { position: 'grip', label: 'Grip', icon: '✋', description: 'Pistol grip', excludes: [] },
      { position: 'magazine', label: 'Magazine', icon: '📦', description: 'Detachable magazine', excludes: [] },
      { position: 'buttpad', label: 'Buttpad', icon: '🛡️', description: 'Recoil pad', excludes: [] },
      { position: 'cheek_riser', label: 'Cheek Riser', icon: '📏', description: 'Cheek rest / riser', excludes: [] },
    ],
  },
];

const ALL_SLOTS = SLOT_GROUPS.flatMap((g) => g.slots);

const POSITION_LABELS: Record<string, string> = {};
ALL_SLOTS.forEach((s) => { POSITION_LABELS[s.position] = s.label; });

// ════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════

const formatPrice = (cents: number | null) => {
  if (!cents) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
};

const formatWeight = (oz: number | null) => {
  if (!oz) return '—';
  const lbs = Math.floor(oz / 16);
  const rem = (oz % 16).toFixed(1);
  if (lbs > 0) return `${lbs} lb ${rem} oz`;
  return `${oz.toFixed(1)} oz`;
};

const formatWeightShort = (oz: number | null) => {
  if (!oz) return '';
  return `${oz.toFixed(1)} oz`;
};

// ════════════════════════════════════════════
// Component Picker Modal
// ════════════════════════════════════════════

interface ComponentPickerProps {
  position: string;
  label: string;
  components: Component[];
  onSelect: (id: string, position: string) => void;
  onClose: () => void;
  loading: boolean;
  showAllTypes?: boolean;
}

function ComponentPicker({ position, label, components, onSelect, onClose, loading, showAllTypes }: ComponentPickerProps) {
  const [search, setSearch] = useState('');
  const [mfr, setMfr] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // For "other" / extras mode, show all components with type filtering
  // For named slots, filter to matching type only
  const byType = useMemo(() => {
    if (showAllTypes) {
      if (typeFilter) return components.filter((c) => c.type === typeFilter);
      return components;
    }
    return components.filter((c) => c.type === position);
  }, [components, position, showAllTypes, typeFilter]);

  // Available types (for extras mode)
  const availableTypes = useMemo(() => {
    if (!showAllTypes) return [];
    const types = new Map<string, number>();
    components.forEach((c) => {
      if (c.type) types.set(c.type, (types.get(c.type) || 0) + 1);
    });
    return Array.from(types.entries())
      .map(([type, count]) => ({ type, count, label: POSITION_LABELS[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [components, showAllTypes]);

  const manufacturers = useMemo(() => {
    const m = new Map<string, string>();
    byType.forEach((c) => m.set(c.manufacturer.id, c.manufacturer.name));
    return Array.from(m.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [byType]);

  const filtered = useMemo(() => {
    // Always work on a shallow copy so we don't try to sort
    // Apollo's frozen cache arrays or shared references.
    let r = [...byType];
    if (mfr) r = r.filter((c) => c.manufacturer.id === mfr);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((c) => c.name.toLowerCase().includes(q) || c.manufacturer.name.toLowerCase().includes(q));
    }
    return r.sort((a, b) => a.name.localeCompare(b.name));
  }, [byType, mfr, search]);

  const handleSelect = (c: Component) => {
    // In extras mode, use the component's own type as position
    const pos = showAllTypes ? (c.type || 'other') : position;
    onSelect(c.id, pos);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[85vh] bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden m-0 sm:m-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {showAllTypes ? 'Add Extra Component' : `Select ${label}`}
            </h2>
            <p className="text-sm text-slate-500">
              {filtered.length} component{filtered.length !== 1 ? 's' : ''} available
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-slate-100 flex-shrink-0">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or manufacturer..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* Type filter chips (extras mode) */}
        {showAllTypes && availableTypes.length > 1 && (
          <div className="px-6 py-2.5 border-b border-slate-100 flex gap-2 overflow-x-auto flex-shrink-0">
            <button
              onClick={() => { setTypeFilter(null); setMfr(null); }}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !typeFilter ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Types
            </button>
            {availableTypes.map((t) => (
              <button
                key={t.type}
                onClick={() => { setTypeFilter(typeFilter === t.type ? null : t.type); setMfr(null); }}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  typeFilter === t.type ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {t.label} ({t.count})
              </button>
            ))}
          </div>
        )}

        {/* Manufacturer filter chips */}
        {manufacturers.length > 1 && (
          <div className="px-6 py-2.5 border-b border-slate-100 flex gap-2 overflow-x-auto flex-shrink-0">
            <button
              onClick={() => setMfr(null)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !mfr ? 'bg-sky-100 text-sky-700 border border-sky-200' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Brands
            </button>
            {manufacturers.map((m) => (
              <button
                key={m.id}
                onClick={() => setMfr(mfr === m.id ? null : m.id)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  mfr === m.id ? 'bg-sky-100 text-sky-700 border border-sky-200' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        )}

        {/* Component grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 rounded-full bg-sky-500 animate-pulse" />
              <span className="ml-3 text-slate-500">Loading components…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">{search ? `No results for "${search}"` : `No components available`}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 text-left transition-all group"
                >
                  <div className="w-14 h-14 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                        <span className="text-sm font-bold text-slate-400">{c.name.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 group-hover:text-sky-700 truncate">{c.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{c.manufacturer.name}</div>
                    <div className="flex items-center gap-3 mt-1.5">
                      {showAllTypes && c.type && (
                        <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {POSITION_LABELS[c.type] || c.type}
                        </span>
                      )}
                      {c.msrpCents ? <span className="text-xs font-medium text-emerald-600">{formatPrice(c.msrpCents)}</span> : null}
                      {c.weightOz ? <span className="text-xs text-slate-400">{formatWeightShort(c.weightOz)}</span> : null}
                    </div>
                  </div>
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                    <div className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
// Onboarding / Getting Started
// ════════════════════════════════════════════

interface OnboardingProps {
  onStartBuilding: (slot: SlotDef) => void;
  discipline: string | null;
}

function BuildOnboarding({ onStartBuilding, discipline }: OnboardingProps) {
  const coreSlots = SLOT_GROUPS[0].slots;
  const steps = [
    { num: 1, title: 'Start with the Core', desc: 'Pick your action, barrel, and trigger — the foundation of every build.', color: 'from-sky-500 to-indigo-500' },
    { num: 2, title: 'Choose Your Platform', desc: 'Go with a modern chassis system or a traditional stock — pick one.', color: 'from-violet-500 to-purple-500' },
    { num: 3, title: 'Mount Your Optics', desc: 'Select your scope, mount, and rings for your glass setup.', color: 'from-amber-500 to-orange-500' },
    { num: 4, title: 'Add Accessories', desc: 'Finish it off with a muzzle device, bipod, grip, and more.', color: 'from-emerald-500 to-green-500' },
  ];

  return (
    <div className="mb-8">
      {/* Welcome hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-2xl p-6 sm:p-8 mb-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-sky-500/20 to-transparent rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-tr-full" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎯</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">New Build</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Let's Build Your Rifle</h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-lg mb-6">
            {discipline
              ? `Build your ${discipline.toUpperCase()} competition rifle piece by piece. Start with the core components and work your way through each slot.`
              : 'Build your precision rifle piece by piece. Select components for each slot below — we\'ll guide you through it.'}
          </p>
          <button
            onClick={() => onStartBuilding(coreSlots[0])}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 font-semibold text-sm rounded-xl hover:bg-sky-50 transition-colors shadow-lg"
          >
            Start with an Action
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Steps overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {steps.map((step) => (
          <div key={step.num} className="bg-white rounded-xl border border-slate-100 p-4">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${step.color} text-white flex items-center justify-center text-sm font-bold mb-3`}>
              {step.num}
            </div>
            <h3 className="text-sm font-semibold text-slate-800 mb-1">{step.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════
// Main Build Detail
// ════════════════════════════════════════════

export default function BuildDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [pickerSlot, setPickerSlot] = useState<SlotDef | null>(null);
  const [pickerExtrasMode, setPickerExtrasMode] = useState(false);
  const [swappingBcId, setSwappingBcId] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const slotRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const { data, loading, error, refetch } = useQuery<{ build: Build | null }>(GET_BUILD, {
    variables: { id },
    skip: !isAuthenticated || !id,
  });

  const { data: componentsData, loading: componentsLoading } = useQuery<{ components: Component[] }>(GET_COMPONENTS);

  const [addComponent] = useMutation(ADD_COMPONENT_TO_BUILD);
  const [removeComponent] = useMutation(REMOVE_COMPONENT_FROM_BUILD);

  // ── Position → BuildComponent map ──
  const slotMap = useMemo(() => {
    const m: Record<string, BuildComponent[]> = {};
    data?.build?.buildComponents.forEach((bc) => {
      const pos = bc.position || 'other';
      (m[pos] ||= []).push(bc);
    });
    return m;
  }, [data?.build?.buildComponents]);

  const filledPositions = useMemo(() => new Set(Object.keys(slotMap)), [slotMap]);

  const isExcluded = useCallback(
    (slot: SlotDef) => slot.excludes.some((e) => filledPositions.has(e)),
    [filledPositions],
  );

  // Completion metrics
  const effectiveSlots = ALL_SLOTS.filter((s) => !(isExcluded(s) && !slotMap[s.position]?.length));
  const totalSlots = effectiveSlots.length;
  const filledSlots = effectiveSlots.filter((s) => slotMap[s.position]?.length).length;
  const isEmpty = !data?.build?.buildComponents.length;

  // Find the first empty slot (for auto-advance)
  const nextEmptySlot = useMemo(() => {
    for (const group of SLOT_GROUPS) {
      for (const slot of group.slots) {
        if (!slotMap[slot.position]?.length && !isExcluded(slot)) return slot;
      }
    }
    return null;
  }, [slotMap, isExcluded]);

  // Clear "just added" highlight after animation
  useEffect(() => {
    if (justAdded) {
      const timer = setTimeout(() => setJustAdded(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [justAdded]);

  // ── Handlers ──
  const handleSelectComponent = async (componentId: string, pos: string) => {
    if (!data?.build) return;
    const effectivePosition = pickerExtrasMode ? pos : (pickerSlot?.position || pos);

    // If this exact component is already in this position, do nothing to avoid
    // backend uniqueness validation errors that feel like a "failed edit".
    const alreadyPresent = data.build.buildComponents.some((bc) => {
      const bcPos = bc.position || 'other';
      return bc.component.id === componentId && bcPos === effectivePosition;
    });

    if (alreadyPresent) {
      setPickerSlot(null);
      setPickerExtrasMode(false);
      setSwappingBcId(null);
      setLastError(null);
      return;
    }

    try {
      if (swappingBcId) {
        await removeComponent({ variables: { buildComponentId: swappingBcId } });
      }
      await addComponent({
        variables: {
          buildId: data.build.id,
          componentId,
          position: effectivePosition,
        },
      });
      await refetch();
      setJustAdded(effectivePosition);
      setLastError(null);
    } catch (e) {
      console.error('Failed to update build:', e);
      const message = e instanceof Error ? e.message : 'Unknown error while updating build';
      setLastError(message);
    }
    setPickerSlot(null);
    setPickerExtrasMode(false);
    setSwappingBcId(null);
  };

  const handleRemove = async (bcId: string) => {
    if (!window.confirm('Remove this component?')) return;
    try {
      await removeComponent({ variables: { buildComponentId: bcId } });
      await refetch();
    } catch {
      // silently fail
    }
  };

  const handleSwap = (slot: SlotDef, bcId: string) => {
    setSwappingBcId(bcId);
    setPickerExtrasMode(false);
    setPickerSlot(slot);
  };

  const openPicker = (slot: SlotDef) => {
    setSwappingBcId(null);
    setPickerExtrasMode(false);
    setPickerSlot(slot);
  };

  const openExtrasPicker = () => {
    setSwappingBcId(null);
    setPickerExtrasMode(true);
    setPickerSlot({ position: 'other', label: 'Extra Component', icon: '📦', description: '', excludes: [] });
  };

  // Gather "extra" components: those in the 'other' position, or duplicates beyond the first in a given slot
  const extraComponents = useMemo(() => {
    const extras: BuildComponent[] = [];
    // All 'other' position items
    (slotMap['other'] || []).forEach((bc) => extras.push(bc));
    // Any items beyond the first in each named slot
    ALL_SLOTS.forEach((slot) => {
      const items = slotMap[slot.position] || [];
      if (items.length > 1) items.slice(1).forEach((bc) => extras.push(bc));
    });
    return extras;
  }, [slotMap]);

  // ── Guards ──
  if (!isAuthenticated) { navigate('/login'); return null; }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-sky-500 animate-pulse" />
          <span className="text-lg text-slate-600">Loading build…</span>
        </div>
      </div>
    );
  }

  if (error || !data?.build) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">{error ? `Error: ${error.message}` : 'Build not found'}</h2>
          <Link to="/builds" className="text-sky-600 hover:text-sky-700 font-medium">← Back to builds</Link>
        </div>
      </div>
    );
  }

  const build = data.build;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <Link to="/builds" className="text-sky-600 hover:text-sky-700 text-sm font-medium">← Back to builds</Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1">{build.name}</h1>
            {build.discipline && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-sky-50 to-indigo-50 text-indigo-700 border border-indigo-100 mt-2">
                {build.discipline.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 self-start">
            <button
              onClick={openExtrasPicker}
              className="inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-xl text-slate-700 bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 transition-all"
            >
              + Extra
            </button>
            <Link
              to={`/builds/${build.id}/ballistics`}
              className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 transition-all"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Ballistics
            </Link>
          </div>
        </div>

        {/* ─── Error banner for edit failures ─── */}
        {lastError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
            <span className="mt-0.5">⚠️</span>
            <div>
              <div className="font-semibold">Could not update this build</div>
              <div className="text-xs sm:text-[13px] text-red-600/90 break-words max-w-xl">{lastError}</div>
            </div>
          </div>
        )}

        {/* ─── Onboarding (empty build) ─── */}
        {isEmpty && <BuildOnboarding onStartBuilding={openPicker} discipline={build.discipline} />}

        {/* ─── Stats (show once build has at least 1 component) ─── */}
        {!isEmpty && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Weight</div>
              <div className="text-lg font-bold text-slate-800 mt-1">{formatWeight(build.totalWeightOz)}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cost</div>
              <div className="text-lg font-bold text-slate-800 mt-1">{formatPrice(build.totalCostCents)}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Parts</div>
              <div className="text-lg font-bold text-slate-800 mt-1">{build.buildComponents.length}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Completion</div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      filledSlots === totalSlots ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 'bg-gradient-to-r from-sky-500 to-indigo-500'
                    }`}
                    style={{ width: `${totalSlots > 0 ? (filledSlots / totalSlots) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-slate-700">{filledSlots}/{totalSlots}</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── Slot Groups ─── */}
        <div className="space-y-6">
          {SLOT_GROUPS.map((group) => {
            // Determine group completion
            const groupFilled = group.slots.filter((s) => slotMap[s.position]?.length).length;
            const groupEffective = group.slots.filter((s) => !(isExcluded(s) && !slotMap[s.position]?.length)).length;
            const groupDone = groupFilled === groupEffective;

            return (
              <div key={group.name}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="text-base">{group.icon}</span>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{group.name}</h2>
                  <span className="text-xs text-slate-400">— {group.description}</span>
                  {groupDone && groupFilled > 0 && (
                    <span className="ml-auto text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">✓ Complete</span>
                  )}
                  {!groupDone && groupFilled > 0 && (
                    <span className="ml-auto text-xs text-slate-400">{groupFilled}/{groupEffective}</span>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
                  {group.slots.map((slot) => {
                    const bc = slotMap[slot.position]?.[0];
                    const excluded = isExcluded(slot);
                    const isHighlighted = justAdded === slot.position;
                    const isNextEmpty = nextEmptySlot?.position === slot.position && !isEmpty;

                    {/* ── Excluded & empty ── */}
                    if (excluded && !bc) {
                      const excludedBy = slot.excludes
                        .filter((e) => filledPositions.has(e))
                        .map((e) => ALL_SLOTS.find((s) => s.position === e)?.label || e)
                        .join(', ');
                      return (
                        <div key={slot.position} className="flex items-center px-4 sm:px-6 py-4 bg-slate-50/50">
                          <div className="w-28 sm:w-36 flex-shrink-0">
                            <span className="text-sm font-medium text-slate-300 line-through">{slot.label}</span>
                          </div>
                          <span className="text-sm text-slate-400 italic">Not needed — {excludedBy} selected</span>
                        </div>
                      );
                    }

                    {/* ── Filled slot ── */}
                    if (bc) {
                      return (
                        <div
                          key={slot.position}
                          ref={(el) => { slotRefs.current[slot.position] = el; }}
                          className={`flex items-center px-4 sm:px-6 py-3 transition-all group/row ${
                            isHighlighted ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'hover:bg-sky-50/30'
                          }`}
                        >
                          <div className="w-28 sm:w-36 flex-shrink-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base">{slot.icon}</span>
                              <span className="text-sm font-medium text-slate-500">{slot.label}</span>
                            </div>
                          </div>

                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0 mr-3 overflow-hidden">
                            {bc.component.imageUrl ? (
                              <img src={bc.component.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-50 to-indigo-50">
                                <span className="text-xs font-bold text-sky-400">{bc.component.name.charAt(0)}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-800 truncate">{bc.component.name}</div>
                            <div className="text-xs text-slate-500">{bc.component.manufacturer.name}</div>
                          </div>

                          <div className="hidden sm:flex items-center gap-4 mx-4 flex-shrink-0">
                            <span className="text-xs text-slate-400 w-16 text-right">{formatWeightShort(bc.component.weightOz)}</span>
                            <span className="text-xs font-medium text-emerald-600 w-16 text-right">{formatPrice(bc.component.msrpCents)}</span>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0 ml-2 sm:opacity-0 sm:group-hover/row:opacity-100 transition-opacity">
                            <button onClick={() => handleSwap(slot, bc.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors" title="Swap">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                            </button>
                            <button onClick={() => handleRemove(bc.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Remove">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        </div>
                      );
                    }

                    {/* ── Empty slot ── */}
                    return (
                      <div
                        key={slot.position}
                        ref={(el) => { slotRefs.current[slot.position] = el; }}
                        className={`flex items-center px-4 sm:px-6 py-3 transition-all ${isNextEmpty ? 'bg-sky-50/40' : ''}`}
                      >
                        <div className="w-28 sm:w-36 flex-shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base opacity-40">{slot.icon}</span>
                            <span className="text-sm font-medium text-slate-400">{slot.label}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => openPicker(slot)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed text-sm transition-all group ${
                            isNextEmpty
                              ? 'border-sky-300 bg-sky-50/50 text-sky-600 hover:border-sky-400 hover:bg-sky-50'
                              : 'border-slate-200 text-slate-400 hover:border-sky-400 hover:bg-sky-50/50 hover:text-sky-600'
                          }`}
                        >
                          <svg className={`w-4 h-4 transition-colors ${isNextEmpty ? 'text-sky-500' : 'text-slate-300 group-hover:text-sky-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          {isNextEmpty ? (
                            <span>Select {slot.label} <span className="text-xs opacity-70">— next up</span></span>
                          ) : (
                            <span>Select {slot.label}</span>
                          )}
                        </button>
                        {isNextEmpty && (
                          <span className="hidden sm:inline-block ml-3 text-xs text-slate-400">{slot.description}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* ─── Extra Components ─── */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-base">📦</span>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Extras</h2>
                <span className="text-xs text-slate-400">
                  — Additional or duplicate components
                  {extraComponents.length > 0 && ` (${extraComponents.length})`}
                </span>
              </div>
              <button
                onClick={openExtrasPicker}
                className="text-xs font-medium text-sky-600 hover:text-sky-700 transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add Extra
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {extraComponents.length === 0 ? (
                <div className="px-6 py-6 text-center">
                  <p className="text-xs text-slate-400 mb-3">Need a spare magazine, extra grip, or any other accessory?</p>
                  <button
                    onClick={openExtrasPicker}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 text-sm text-slate-400 hover:text-sky-600 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Browse all components
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {extraComponents.map((bc) => (
                    <div key={bc.id} className="flex items-center px-4 sm:px-6 py-3 hover:bg-sky-50/30 transition-colors group/row">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0 mr-3 overflow-hidden">
                        {bc.component.imageUrl ? (
                          <img src={bc.component.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                            <span className="text-xs font-bold text-slate-400">{bc.component.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-800 truncate">{bc.component.name}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">{bc.component.manufacturer.name}</span>
                          {bc.position && bc.position !== 'other' && (
                            <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                              {POSITION_LABELS[bc.position] || bc.position}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-4 mx-4 flex-shrink-0">
                        <span className="text-xs text-slate-400 w-16 text-right">{formatWeightShort(bc.component.weightOz)}</span>
                        <span className="text-xs font-medium text-emerald-600 w-16 text-right">{formatPrice(bc.component.msrpCents)}</span>
                      </div>
                      <button onClick={() => handleRemove(bc.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-2 sm:opacity-0 sm:group-hover/row:opacity-100" title="Remove">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ─── All Done Banner ─── */}
          {filledSlots === totalSlots && !isEmpty && (
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-6 text-center">
              <span className="text-3xl mb-2 block">🎉</span>
              <h3 className="text-lg font-bold text-emerald-800 mb-1">Build Complete!</h3>
              <p className="text-sm text-emerald-600 mb-4">All slots are filled. Ready to set up your ballistics?</p>
              <Link
                to={`/builds/${build.id}/ballistics`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm rounded-xl hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Set Up Ballistics
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ─── Component Picker Modal ─── */}
      {pickerSlot && (
        <ComponentPicker
          position={pickerSlot.position}
          label={pickerSlot.label}
          components={componentsData?.components || []}
          onSelect={handleSelectComponent}
          onClose={() => { setPickerSlot(null); setPickerExtrasMode(false); setSwappingBcId(null); }}
          loading={componentsLoading}
          showAllTypes={pickerExtrasMode}
        />
      )}
    </div>
  );
}
