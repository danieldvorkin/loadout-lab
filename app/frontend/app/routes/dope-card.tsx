import { useQuery, useMutation } from '@apollo/client/react';
import { Link, useParams } from 'react-router';
import { useState, useCallback } from 'react';
import { useAuth } from '../lib/auth-context';
import {
  GET_BALLISTIC_PROFILE,
  UPDATE_BALLISTIC_PROFILE,
  UPSERT_BALLISTIC_DROP,
  DELETE_BALLISTIC_DROP,
  BULK_UPSERT_BALLISTIC_DROPS,
  GENERATE_DOPE_TABLE,
} from '../lib/graphql-operations';

interface BallisticDrop {
  id: string;
  distanceYards: number;
  dropInches: number | null;
  dropMoa: number | null;
  dropMils: number | null;
  windageInches: number | null;
  windageMoa: number | null;
  windageMils: number | null;
  velocityFps: number | null;
  energyFtLbs: number | null;
  timeOfFlightSec: number | null;
  isVerified: boolean | null;
  notes: string | null;
}

interface BallisticProfile {
  id: string;
  name: string;
  caliber: string;
  bulletWeightGrains: number | null;
  bulletBc: number | null;
  bcType: string | null;
  muzzleVelocityFps: number | null;
  zeroDistanceYards: number | null;
  sightHeightInches: number | null;
  twistRate: string | null;
  barrelLengthInches: number | null;
  altitudeFeet: number | null;
  temperatureF: number | null;
  humidityPercent: number | null;
  pressureInhg: number | null;
  windSpeedMph: number | null;
  windAngleDegrees: number | null;
  notes: string | null;
  projectileId: string | null;
  projectile: {
    id: string;
    manufacturer: string;
    name: string;
    displayName: string;
    weightGrains: number;
    bcG1: number | null;
    bcG7: number | null;
    baseType: string | null;
    bulletType: string | null;
  } | null;
  availableCalibers: string[];
  createdAt: string;
  updatedAt: string;
  build: { id: string; name: string };
  ballisticDrops: BallisticDrop[];
}

interface ProfileData {
  ballisticProfile: BallisticProfile | null;
}

type DropUnit = 'moa' | 'mils';

export default function DopeCard() {
  const { id: buildId, profileId } = useParams();
  const { isAuthenticated } = useAuth();
  const [unit, setUnit] = useState<DropUnit>('moa');
  const [showAddDrop, setShowAddDrop] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [showGeneratePanel, setShowGeneratePanel] = useState(false);
  const [editingDropId, setEditingDropId] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // New drop form
  const [newDrop, setNewDrop] = useState({
    distanceYards: '',
    dropMoa: '',
    dropMils: '',
    dropInches: '',
    windageMoa: '',
    windageMils: '',
    windageInches: '',
    velocityFps: '',
    energyFtLbs: '',
    timeOfFlightSec: '',
    isVerified: false,
    notes: '',
  });

  // Bulk add
  const [bulkStart, setBulkStart] = useState('100');
  const [bulkEnd, setBulkEnd] = useState('1200');
  const [bulkStep, setBulkStep] = useState('100');

  // Generate dope settings
  const [genMaxDistance, setGenMaxDistance] = useState('1200');
  const [genStep, setGenStep] = useState('25');

  // Editing drop
  const [editDrop, setEditDrop] = useState<Record<string, string | boolean>>({});

  const { data, loading, error, refetch } = useQuery<ProfileData>(
    GET_BALLISTIC_PROFILE,
    { variables: { id: profileId }, skip: !isAuthenticated || !profileId }
  );

  const [updateProfile, { loading: updatingProfile }] = useMutation(UPDATE_BALLISTIC_PROFILE, {
    onCompleted: () => { setShowProfileEdit(false); refetch(); },
  });

  const [upsertDrop, { loading: savingDrop }] = useMutation(UPSERT_BALLISTIC_DROP, {
    onCompleted: () => {
      setShowAddDrop(false);
      setEditingDropId(null);
      resetNewDrop();
      refetch();
    },
  });

  const [deleteDrop] = useMutation(DELETE_BALLISTIC_DROP, {
    onCompleted: () => refetch(),
  });

  const [bulkUpsert, { loading: bulkSaving }] = useMutation(BULK_UPSERT_BALLISTIC_DROPS, {
    onCompleted: () => { setShowBulkAdd(false); refetch(); },
  });

  const [generateDope, { loading: generating }] = useMutation(GENERATE_DOPE_TABLE, {
    onCompleted: (data) => {
      const errors = data?.generateDopeTable?.errors || [];
      if (errors.length > 0) {
        setGenerateError(errors.join(', '));
      } else {
        setGenerateError(null);
        setShowGeneratePanel(false);
      }
      refetch();
    },
    onError: (err) => {
      setGenerateError(err.message);
    },
  });

  const resetNewDrop = () => {
    setNewDrop({
      distanceYards: '', dropMoa: '', dropMils: '', dropInches: '',
      windageMoa: '', windageMils: '', windageInches: '',
      velocityFps: '', energyFtLbs: '', timeOfFlightSec: '',
      isVerified: false, notes: '',
    });
  };

  const profile = data?.ballisticProfile;

  const startEditDrop = useCallback((drop: BallisticDrop) => {
    setEditingDropId(drop.id);
    setEditDrop({
      distanceYards: String(drop.distanceYards),
      dropMoa: drop.dropMoa !== null ? String(drop.dropMoa) : '',
      dropMils: drop.dropMils !== null ? String(drop.dropMils) : '',
      dropInches: drop.dropInches !== null ? String(drop.dropInches) : '',
      windageMoa: drop.windageMoa !== null ? String(drop.windageMoa) : '',
      windageMils: drop.windageMils !== null ? String(drop.windageMils) : '',
      windageInches: drop.windageInches !== null ? String(drop.windageInches) : '',
      velocityFps: drop.velocityFps !== null ? String(drop.velocityFps) : '',
      energyFtLbs: drop.energyFtLbs !== null ? String(drop.energyFtLbs) : '',
      timeOfFlightSec: drop.timeOfFlightSec !== null ? String(drop.timeOfFlightSec) : '',
      isVerified: drop.isVerified || false,
      notes: drop.notes || '',
    });
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Sign in to view ballistics</h2>
          <Link to="/login" className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-sky-500 to-indigo-500">Sign in</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 rounded-full bg-amber-500 animate-pulse"></div>
          <div className="text-lg text-slate-600 font-medium">Loading dope card...</div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Profile not found</h2>
          <Link to={`/builds/${buildId}/ballistics`} className="text-sky-600 hover:text-sky-700">← Back to ballistics</Link>
        </div>
      </div>
    );
  }

  const drops = profile.ballisticDrops || [];

  const handleSaveNewDrop = (e: React.FormEvent) => {
    e.preventDefault();
    upsertDrop({
      variables: {
        ballisticProfileId: profile.id,
        distanceYards: parseInt(newDrop.distanceYards),
        dropMoa: newDrop.dropMoa ? parseFloat(newDrop.dropMoa) : null,
        dropMils: newDrop.dropMils ? parseFloat(newDrop.dropMils) : null,
        dropInches: newDrop.dropInches ? parseFloat(newDrop.dropInches) : null,
        windageMoa: newDrop.windageMoa ? parseFloat(newDrop.windageMoa) : null,
        windageMils: newDrop.windageMils ? parseFloat(newDrop.windageMils) : null,
        windageInches: newDrop.windageInches ? parseFloat(newDrop.windageInches) : null,
        velocityFps: newDrop.velocityFps ? parseInt(newDrop.velocityFps) : null,
        energyFtLbs: newDrop.energyFtLbs ? parseInt(newDrop.energyFtLbs) : null,
        timeOfFlightSec: newDrop.timeOfFlightSec ? parseFloat(newDrop.timeOfFlightSec) : null,
        isVerified: newDrop.isVerified,
        notes: newDrop.notes || null,
      },
    });
  };

  const handleSaveEditDrop = (drop: BallisticDrop) => {
    upsertDrop({
      variables: {
        ballisticProfileId: profile.id,
        distanceYards: parseInt(editDrop.distanceYards as string),
        dropMoa: editDrop.dropMoa ? parseFloat(editDrop.dropMoa as string) : null,
        dropMils: editDrop.dropMils ? parseFloat(editDrop.dropMils as string) : null,
        dropInches: editDrop.dropInches ? parseFloat(editDrop.dropInches as string) : null,
        windageMoa: editDrop.windageMoa ? parseFloat(editDrop.windageMoa as string) : null,
        windageMils: editDrop.windageMils ? parseFloat(editDrop.windageMils as string) : null,
        windageInches: editDrop.windageInches ? parseFloat(editDrop.windageInches as string) : null,
        velocityFps: editDrop.velocityFps ? parseInt(editDrop.velocityFps as string) : null,
        energyFtLbs: editDrop.energyFtLbs ? parseInt(editDrop.energyFtLbs as string) : null,
        timeOfFlightSec: editDrop.timeOfFlightSec ? parseFloat(editDrop.timeOfFlightSec as string) : null,
        isVerified: editDrop.isVerified as boolean,
        notes: (editDrop.notes as string) || null,
      },
    });
  };

  const handleDeleteDrop = (dropId: string) => {
    if (window.confirm('Delete this drop entry?')) {
      deleteDrop({ variables: { id: dropId } });
    }
  };

  const handleBulkAdd = () => {
    const start = parseInt(bulkStart);
    const end = parseInt(bulkEnd);
    const step = parseInt(bulkStep);
    if (!start || !end || !step || start >= end || step <= 0) return;

    const drops = [];
    for (let d = start; d <= end; d += step) {
      drops.push({ distanceYards: d });
    }
    bulkUpsert({
      variables: { ballisticProfileId: profile.id, drops },
    });
  };

  const handleToggleVerified = (drop: BallisticDrop) => {
    upsertDrop({
      variables: {
        ballisticProfileId: profile.id,
        distanceYards: drop.distanceYards,
        isVerified: !drop.isVerified,
      },
    });
  };

  const handleGenerateDope = () => {
    setGenerateError(null);
    generateDope({
      variables: {
        ballisticProfileId: profile.id,
        maxDistance: parseInt(genMaxDistance) || 1200,
        step: parseInt(genStep) || 25,
      },
    });
  };

  const canGenerate = profile.muzzleVelocityFps && profile.bulletBc && profile.bulletWeightGrains;

  const getDropValue = (drop: BallisticDrop) => {
    if (unit === 'moa') return drop.dropMoa;
    return drop.dropMils;
  };

  const getWindageValue = (drop: BallisticDrop) => {
    if (unit === 'moa') return drop.windageMoa;
    return drop.windageMils;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <Link to={`/builds/${buildId}/ballistics`} className="text-sky-600 hover:text-sky-700 text-sm mb-2 inline-block">
                ← Back to ballistics
              </Link>
              <h1 className="text-3xl font-bold text-slate-800">{profile.name}</h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-100">
                  {profile.caliber}
                </span>
                {profile.projectile && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-100">
                    {profile.projectile.displayName}
                  </span>
                )}
                {!profile.projectile && profile.bulletWeightGrains && <span className="text-sm text-slate-500">{profile.bulletWeightGrains}gr</span>}
                {profile.muzzleVelocityFps && <span className="text-sm text-slate-500">{profile.muzzleVelocityFps} fps</span>}
                {profile.zeroDistanceYards && <span className="text-sm text-slate-500">Zero: {profile.zeroDistanceYards}y</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowProfileEdit(!showProfileEdit)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
              >
                Edit Profile
              </button>
            </div>
          </div>

          {/* Profile Edit Panel */}
          {showProfileEdit && (
            <ProfileEditForm
              profile={profile}
              onSave={(data) => updateProfile({ variables: { id: profile.id, ...data } })}
              onCancel={() => setShowProfileEdit(false)}
              saving={updatingProfile}
            />
          )}

          {/* Dope Card Header */}
          <div className="bg-white shadow-sm border border-slate-100 rounded-2xl overflow-hidden">
            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-slate-800">Dope Card</h2>
                <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setUnit('moa')}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${unit === 'moa' ? 'bg-amber-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    MOA
                  </button>
                  <button
                    onClick={() => setUnit('mils')}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${unit === 'mils' ? 'bg-amber-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    Mils
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setShowGeneratePanel(!showGeneratePanel); setGenerateError(null); }}
                  className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-sm transition-all"
                >
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Calculate Dope
                </button>
                <button
                  onClick={() => setShowBulkAdd(!showBulkAdd)}
                  className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Bulk Add Distances
                </button>
                <button
                  onClick={() => setShowAddDrop(true)}
                  className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-lg text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-sm transition-all"
                >
                  + Add Entry
                </button>
              </div>
            </div>

            {/* Bulk Add Panel */}
            {showBulkAdd && (
              <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
                <div className="flex items-end gap-4 flex-wrap">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Start (yds)</label>
                    <input type="number" value={bulkStart} onChange={(e) => setBulkStart(e.target.value)} className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">End (yds)</label>
                    <input type="number" value={bulkEnd} onChange={(e) => setBulkEnd(e.target.value)} className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Step</label>
                    <input type="number" value={bulkStep} onChange={(e) => setBulkStep(e.target.value)} className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <button
                    onClick={handleBulkAdd}
                    disabled={bulkSaving}
                    className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-colors"
                  >
                    {bulkSaving ? 'Adding...' : 'Generate Rows'}
                  </button>
                  <button onClick={() => setShowBulkAdd(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Generate Dope Panel */}
            {showGeneratePanel && (
              <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100">
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Auto-Calculate Dope Table
                  </h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    Uses a point-mass ballistic model with {profile.bcType || 'G7'} drag coefficients, atmospheric corrections, and windage calculations.
                    {drops.length > 0 && ' Existing entries will be updated with calculated values. Verified entries will retain their verified status.'}
                  </p>
                </div>
                {!canGenerate && (
                  <div className="mb-3 p-3 bg-amber-100 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800 font-medium">⚠️ Missing required data for calculation:</p>
                    <ul className="text-xs text-amber-700 mt-1 list-disc list-inside">
                      {!profile.muzzleVelocityFps && <li>Muzzle velocity</li>}
                      {!profile.bulletBc && <li>Ballistic coefficient</li>}
                      {!profile.bulletWeightGrains && <li>Bullet weight</li>}
                    </ul>
                    <p className="text-xs text-amber-700 mt-1">Please edit the profile to add this data first.</p>
                  </div>
                )}
                {generateError && (
                  <div className="mb-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-800">{generateError}</p>
                  </div>
                )}
                <div className="flex items-end gap-4 flex-wrap">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Max Distance (yds)</label>
                    <input type="number" value={genMaxDistance} onChange={(e) => setGenMaxDistance(e.target.value)} className="w-28 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Step (yds)</label>
                    <input type="number" value={genStep} onChange={(e) => setGenStep(e.target.value)} className="w-20 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <button
                    onClick={handleGenerateDope}
                    disabled={generating || !canGenerate}
                    className="px-5 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 shadow-sm transition-all"
                  >
                    {generating ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Calculating...
                      </span>
                    ) : (
                      '⚡ Generate Dope Table'
                    )}
                  </button>
                  <button onClick={() => setShowGeneratePanel(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Add Drop Form */}
            {showAddDrop && (
              <div className="px-6 py-4 bg-sky-50 border-b border-sky-100">
                <form onSubmit={handleSaveNewDrop} className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Distance (yds) *</label>
                      <input type="number" required value={newDrop.distanceYards} onChange={(e) => setNewDrop({ ...newDrop, distanceYards: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Drop (MOA)</label>
                      <input type="number" step="0.1" value={newDrop.dropMoa} onChange={(e) => setNewDrop({ ...newDrop, dropMoa: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Drop (Mils)</label>
                      <input type="number" step="0.1" value={newDrop.dropMils} onChange={(e) => setNewDrop({ ...newDrop, dropMils: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Windage ({unit.toUpperCase()})</label>
                      <input type="number" step="0.1" value={unit === 'moa' ? newDrop.windageMoa : newDrop.windageMils} onChange={(e) => setNewDrop({ ...newDrop, [unit === 'moa' ? 'windageMoa' : 'windageMils']: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Velocity (fps)</label>
                      <input type="number" value={newDrop.velocityFps} onChange={(e) => setNewDrop({ ...newDrop, velocityFps: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Energy (ft·lbs)</label>
                      <input type="number" value={newDrop.energyFtLbs} onChange={(e) => setNewDrop({ ...newDrop, energyFtLbs: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox" checked={newDrop.isVerified as boolean} onChange={(e) => setNewDrop({ ...newDrop, isVerified: e.target.checked })} className="rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                      Verified
                    </label>
                    <input type="text" placeholder="Notes..." value={newDrop.notes} onChange={(e) => setNewDrop({ ...newDrop, notes: e.target.value })} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                    <button type="submit" disabled={savingDrop} className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-colors">
                      {savingDrop ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" onClick={() => { setShowAddDrop(false); resetNewDrop(); }} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Dope Table */}
            {drops.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-slate-600 mb-2">No dope data yet</p>
                <p className="text-slate-400 text-sm mb-4">
                  {canGenerate
                    ? 'Auto-generate your dope table from ballistic data, or add entries manually'
                    : 'Add entries manually or use bulk add to generate distance rows'}
                </p>
                <div className="flex items-center justify-center gap-3">
                  {canGenerate && (
                    <button
                      onClick={() => setShowGeneratePanel(true)}
                      className="px-5 py-2 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-sm transition-all"
                    >
                      ⚡ Calculate Dope Table
                    </button>
                  )}
                  <button onClick={() => setShowAddDrop(true)} className="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
                    Add Entry
                  </button>
                  <button onClick={() => setShowBulkAdd(true)} className="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
                    Bulk Add
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Dist (yds)</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Drop ({unit.toUpperCase()})
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Drop (in)</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Wind ({unit.toUpperCase()})
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Vel (fps)</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Energy</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">TOF (s)</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">✓</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {drops.map((drop) => (
                        editingDropId === drop.id ? (
                          <tr key={drop.id} className="bg-amber-50">
                            <td className="px-4 py-2">
                              <input type="number" value={editDrop.distanceYards as string} onChange={(e) => setEditDrop({ ...editDrop, distanceYards: e.target.value })} className="w-20 px-2 py-1 border border-slate-200 rounded text-sm text-center" />
                            </td>
                            <td className="px-4 py-2">
                              <input type="number" step="0.1" value={(unit === 'moa' ? editDrop.dropMoa : editDrop.dropMils) as string} onChange={(e) => setEditDrop({ ...editDrop, [unit === 'moa' ? 'dropMoa' : 'dropMils']: e.target.value })} className="w-20 px-2 py-1 border border-slate-200 rounded text-sm text-center mx-auto block" />
                            </td>
                            <td className="px-4 py-2">
                              <input type="number" step="0.1" value={editDrop.dropInches as string} onChange={(e) => setEditDrop({ ...editDrop, dropInches: e.target.value })} className="w-20 px-2 py-1 border border-slate-200 rounded text-sm text-center mx-auto block" />
                            </td>
                            <td className="px-4 py-2">
                              <input type="number" step="0.1" value={(unit === 'moa' ? editDrop.windageMoa : editDrop.windageMils) as string} onChange={(e) => setEditDrop({ ...editDrop, [unit === 'moa' ? 'windageMoa' : 'windageMils']: e.target.value })} className="w-20 px-2 py-1 border border-slate-200 rounded text-sm text-center mx-auto block" />
                            </td>
                            <td className="px-4 py-2">
                              <input type="number" value={editDrop.velocityFps as string} onChange={(e) => setEditDrop({ ...editDrop, velocityFps: e.target.value })} className="w-20 px-2 py-1 border border-slate-200 rounded text-sm text-center mx-auto block" />
                            </td>
                            <td className="px-4 py-2">
                              <input type="number" value={editDrop.energyFtLbs as string} onChange={(e) => setEditDrop({ ...editDrop, energyFtLbs: e.target.value })} className="w-20 px-2 py-1 border border-slate-200 rounded text-sm text-center mx-auto block" />
                            </td>
                            <td className="px-4 py-2">
                              <input type="number" step="0.001" value={editDrop.timeOfFlightSec as string} onChange={(e) => setEditDrop({ ...editDrop, timeOfFlightSec: e.target.value })} className="w-20 px-2 py-1 border border-slate-200 rounded text-sm text-center mx-auto block" />
                            </td>
                            <td className="px-4 py-2 text-center">
                              <input type="checkbox" checked={editDrop.isVerified as boolean} onChange={(e) => setEditDrop({ ...editDrop, isVerified: e.target.checked })} className="rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                            </td>
                            <td className="px-4 py-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => handleSaveEditDrop(drop)} disabled={savingDrop} className="px-2 py-1 text-xs font-medium rounded bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50">
                                  {savingDrop ? '...' : 'Save'}
                                </button>
                                <button onClick={() => setEditingDropId(null)} className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700">
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          <tr key={drop.id} className="hover:bg-sky-50/50 transition-colors group">
                            <td className="px-4 py-3 text-sm font-semibold text-slate-800">{drop.distanceYards}</td>
                            <td className="px-4 py-3 text-sm text-center font-mono text-slate-700">
                              {getDropValue(drop) !== null ? getDropValue(drop)?.toFixed(1) : '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-center font-mono text-slate-500">
                              {drop.dropInches !== null ? drop.dropInches.toFixed(1) : '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-center font-mono text-slate-500">
                              {getWindageValue(drop) !== null ? getWindageValue(drop)?.toFixed(1) : '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-center font-mono text-slate-500">
                              {drop.velocityFps ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-center font-mono text-slate-500">
                              {drop.energyFtLbs ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-center font-mono text-slate-500">
                              {drop.timeOfFlightSec !== null ? drop.timeOfFlightSec.toFixed(3) : '—'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button onClick={() => handleToggleVerified(drop)} className="transition-colors">
                                {drop.isVerified ? (
                                  <span className="text-emerald-500">✓</span>
                                ) : (
                                  <span className="text-slate-300 hover:text-slate-400">○</span>
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEditDrop(drop)} className="px-2 py-1 text-xs text-sky-600 hover:text-sky-700 font-medium">
                                  Edit
                                </button>
                                <button onClick={() => handleDeleteDrop(drop.id)} className="px-2 py-1 text-xs text-red-500 hover:text-red-600 font-medium">
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-slate-100">
                  {drops.map((drop) => (
                    <div key={drop.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-slate-800">{drop.distanceYards}y</span>
                          {drop.isVerified && <span className="text-emerald-500 text-sm">✓ Verified</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEditDrop(drop)} className="text-xs text-sky-600 font-medium">Edit</button>
                          <button onClick={() => handleDeleteDrop(drop.id)} className="text-xs text-red-500 font-medium">Delete</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-slate-400 text-xs">Drop</span>
                          <div className="font-mono font-semibold text-slate-700">
                            {getDropValue(drop) !== null ? `${getDropValue(drop)?.toFixed(1)} ${unit}` : '—'}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-xs">Windage</span>
                          <div className="font-mono text-slate-600">
                            {getWindageValue(drop) !== null ? `${getWindageValue(drop)?.toFixed(1)} ${unit}` : '—'}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-xs">Velocity</span>
                          <div className="font-mono text-slate-600">{drop.velocityFps ?? '—'} fps</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile Edit Form Component
function ProfileEditForm({
  profile,
  onSave,
  onCancel,
  saving,
}: {
  profile: BallisticProfile;
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    name: profile.name,
    caliber: profile.caliber,
    bulletWeightGrains: profile.bulletWeightGrains !== null ? String(profile.bulletWeightGrains) : '',
    bulletBc: profile.bulletBc !== null ? String(profile.bulletBc) : '',
    bcType: profile.bcType || 'G7',
    muzzleVelocityFps: profile.muzzleVelocityFps !== null ? String(profile.muzzleVelocityFps) : '',
    zeroDistanceYards: profile.zeroDistanceYards !== null ? String(profile.zeroDistanceYards) : '',
    sightHeightInches: profile.sightHeightInches !== null ? String(profile.sightHeightInches) : '',
    twistRate: profile.twistRate || '',
    barrelLengthInches: profile.barrelLengthInches !== null ? String(profile.barrelLengthInches) : '',
    altitudeFeet: profile.altitudeFeet !== null ? String(profile.altitudeFeet) : '',
    temperatureF: profile.temperatureF !== null ? String(profile.temperatureF) : '',
    humidityPercent: profile.humidityPercent !== null ? String(profile.humidityPercent) : '',
    pressureInhg: profile.pressureInhg !== null ? String(profile.pressureInhg) : '',
    windSpeedMph: profile.windSpeedMph !== null ? String(profile.windSpeedMph) : '',
    windAngleDegrees: profile.windAngleDegrees !== null ? String(profile.windAngleDegrees) : '',
    notes: profile.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: form.name,
      caliber: form.caliber,
      bulletWeightGrains: form.bulletWeightGrains ? parseFloat(form.bulletWeightGrains) : null,
      bulletBc: form.bulletBc ? parseFloat(form.bulletBc) : null,
      bcType: form.bcType || null,
      muzzleVelocityFps: form.muzzleVelocityFps ? parseInt(form.muzzleVelocityFps) : null,
      zeroDistanceYards: form.zeroDistanceYards ? parseInt(form.zeroDistanceYards) : null,
      sightHeightInches: form.sightHeightInches ? parseFloat(form.sightHeightInches) : null,
      twistRate: form.twistRate || null,
      barrelLengthInches: form.barrelLengthInches ? parseFloat(form.barrelLengthInches) : null,
      altitudeFeet: form.altitudeFeet ? parseInt(form.altitudeFeet) : null,
      temperatureF: form.temperatureF ? parseInt(form.temperatureF) : null,
      humidityPercent: form.humidityPercent ? parseInt(form.humidityPercent) : null,
      pressureInhg: form.pressureInhg ? parseFloat(form.pressureInhg) : null,
      windSpeedMph: form.windSpeedMph ? parseInt(form.windSpeedMph) : null,
      windAngleDegrees: form.windAngleDegrees ? parseInt(form.windAngleDegrees) : null,
      notes: form.notes || null,
    });
  };

  const inputClass = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-800";
  const labelClass = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <div className="mb-6 bg-white shadow-sm border border-slate-100 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Edit Profile Settings</h3>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className={labelClass}>Name</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Caliber</label>
            <select value={form.caliber} onChange={(e) => setForm({ ...form, caliber: e.target.value })} className={inputClass}>
              {profile.availableCalibers.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div><label className={labelClass}>BC Type</label>
            <select value={form.bcType} onChange={(e) => setForm({ ...form, bcType: e.target.value })} className={inputClass}>
              <option value="G1">G1</option><option value="G7">G7</option>
            </select>
          </div>
        </div>

        {/* Bullet */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><label className={labelClass}>Bullet Weight (gr)</label><input type="number" step="0.1" value={form.bulletWeightGrains} onChange={(e) => setForm({ ...form, bulletWeightGrains: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Bullet BC</label><input type="number" step="0.001" value={form.bulletBc} onChange={(e) => setForm({ ...form, bulletBc: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Muzzle Velocity (fps)</label><input type="number" value={form.muzzleVelocityFps} onChange={(e) => setForm({ ...form, muzzleVelocityFps: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Zero Distance (yds)</label><input type="number" value={form.zeroDistanceYards} onChange={(e) => setForm({ ...form, zeroDistanceYards: e.target.value })} className={inputClass} /></div>
        </div>

        {/* Rifle */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><label className={labelClass}>Sight Height (in)</label><input type="number" step="0.01" value={form.sightHeightInches} onChange={(e) => setForm({ ...form, sightHeightInches: e.target.value })} className={inputClass} /></div>
          <div><label className={labelClass}>Twist Rate</label><input type="text" value={form.twistRate} onChange={(e) => setForm({ ...form, twistRate: e.target.value })} className={inputClass} placeholder="1:8" /></div>
          <div><label className={labelClass}>Barrel Length (in)</label><input type="number" step="0.1" value={form.barrelLengthInches} onChange={(e) => setForm({ ...form, barrelLengthInches: e.target.value })} className={inputClass} /></div>
        </div>

        {/* Environment */}
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Environment</h4>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div><label className={labelClass}>Altitude (ft)</label><input type="number" value={form.altitudeFeet} onChange={(e) => setForm({ ...form, altitudeFeet: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>Temp (°F)</label><input type="number" value={form.temperatureF} onChange={(e) => setForm({ ...form, temperatureF: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>Humidity (%)</label><input type="number" value={form.humidityPercent} onChange={(e) => setForm({ ...form, humidityPercent: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>Pressure (inHg)</label><input type="number" step="0.01" value={form.pressureInhg} onChange={(e) => setForm({ ...form, pressureInhg: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>Wind (mph)</label><input type="number" value={form.windSpeedMph} onChange={(e) => setForm({ ...form, windSpeedMph: e.target.value })} className={inputClass} /></div>
            <div><label className={labelClass}>Wind Angle (°)</label><input type="number" value={form.windAngleDegrees} onChange={(e) => setForm({ ...form, windAngleDegrees: e.target.value })} className={inputClass} /></div>
          </div>
        </div>

        {/* Notes */}
        <div><label className={labelClass}>Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className={inputClass} /></div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="px-5 py-2.5 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 shadow-lg shadow-amber-500/25 transition-all">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={onCancel} className="px-5 py-2.5 text-sm font-medium rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
