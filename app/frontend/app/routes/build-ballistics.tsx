import { useQuery, useMutation } from '@apollo/client/react';
import { Link, useParams, useNavigate } from 'react-router';
import { useState, useMemo } from 'react';
import { useAuth } from '../lib/auth-context';
import {
  GET_BALLISTIC_PROFILES,
  GET_CALIBERS,
  GET_PROJECTILES,
  CREATE_BALLISTIC_PROFILE,
  DELETE_BALLISTIC_PROFILE,
} from '../lib/graphql-operations';

interface Projectile {
  id: string;
  manufacturer: string;
  name: string;
  caliberInches: number;
  weightGrains: number;
  bcG1: number | null;
  bcG7: number | null;
  bulletType: string | null;
  baseType: string | null;
  recommendedTwist: string | null;
  displayName: string;
}

interface BallisticDrop {
  id: string;
  distanceYards: number;
  dropMoa: number | null;
  dropMils: number | null;
  dropInches: number | null;
  windageMoa: number | null;
  windageMils: number | null;
  isVerified: boolean | null;
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
  notes: string | null;
  projectileId: string | null;
  projectile: { id: string; manufacturer: string; name: string; displayName: string } | null;
  createdAt: string;
  ballisticDrops: BallisticDrop[];
}

interface BallisticProfilesData {
  ballisticProfiles: BallisticProfile[];
}

interface CalibersData {
  calibers: string[];
}

interface ProjectilesData {
  projectiles: Projectile[];
}

export default function BuildBallistics() {
  const { id: buildId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    caliber: '',
    projectileId: '',
    bulletWeightGrains: '',
    bulletBc: '',
    bcType: 'G7',
    muzzleVelocityFps: '',
    zeroDistanceYards: '100',
    sightHeightInches: '1.5',
    twistRate: '',
    barrelLengthInches: '',
    altitudeFeet: '',
    temperatureF: '59',
    notes: '',
  });

  const { data, loading, error, refetch } = useQuery<BallisticProfilesData>(
    GET_BALLISTIC_PROFILES,
    { variables: { buildId }, skip: !isAuthenticated || !buildId }
  );

  const { data: calibersData } = useQuery<CalibersData>(GET_CALIBERS, {
    skip: !showCreateForm,
  });

  // Fetch projectiles filtered by selected caliber
  const { data: projectilesData } = useQuery<ProjectilesData>(GET_PROJECTILES, {
    variables: { caliber: formData.caliber },
    skip: !showCreateForm || !formData.caliber,
  });

  const [createProfile, { loading: creating }] = useMutation(CREATE_BALLISTIC_PROFILE, {
    onCompleted: () => {
      setShowCreateForm(false);
      resetForm();
      refetch();
    },
  });

  const [deleteProfile] = useMutation(DELETE_BALLISTIC_PROFILE, {
    onCompleted: () => refetch(),
  });

  const resetForm = () => {
    setFormData({
      name: '',
      caliber: '',
      projectileId: '',
      bulletWeightGrains: '',
      bulletBc: '',
      bcType: 'G7',
      muzzleVelocityFps: '',
      zeroDistanceYards: '100',
      sightHeightInches: '1.5',
      twistRate: '',
      barrelLengthInches: '',
      altitudeFeet: '',
      temperatureF: '59',
      notes: '',
    });
  };

  // Group projectiles by manufacturer for the dropdown
  const projectilesByMfr = useMemo(() => {
    const projectiles = projectilesData?.projectiles || [];
    const grouped: Record<string, Projectile[]> = {};
    projectiles.forEach((p) => {
      if (!grouped[p.manufacturer]) grouped[p.manufacturer] = [];
      grouped[p.manufacturer].push(p);
    });
    return grouped;
  }, [projectilesData]);

  // When a projectile is selected, auto-fill bullet data
  const handleProjectileSelect = (projectileId: string) => {
    const projectiles = projectilesData?.projectiles || [];
    const selected = projectiles.find((p) => p.id === projectileId);
    if (selected) {
      const useG7 = selected.baseType !== 'flat_base' && selected.bcG7;
      setFormData({
        ...formData,
        projectileId,
        bulletWeightGrains: String(selected.weightGrains),
        bulletBc: String(useG7 ? selected.bcG7 : selected.bcG1 || ''),
        bcType: useG7 ? 'G7' : 'G1',
        twistRate: selected.recommendedTwist || formData.twistRate,
      });
    } else {
      setFormData({ ...formData, projectileId: '', bulletWeightGrains: '', bulletBc: '', bcType: 'G7' });
    }
  };

  // When caliber changes, reset projectile selection
  const handleCaliberChange = (caliber: string) => {
    setFormData({
      ...formData,
      caliber,
      projectileId: '',
      bulletWeightGrains: '',
      bulletBc: '',
      bcType: 'G7',
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Sign in to view ballistics</h2>
          <Link to="/login" className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 shadow-lg shadow-sky-500/25 transition-all">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 rounded-full bg-sky-500 animate-pulse"></div>
          <div className="text-lg text-slate-600 font-medium">Loading ballistic profiles...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50">
        <div className="text-lg text-red-600">Error: {error.message}</div>
      </div>
    );
  }

  const profiles = data?.ballisticProfiles || [];
  const calibers = calibersData?.calibers || [];

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    createProfile({
      variables: {
        buildId,
        name: formData.name,
        caliber: formData.caliber,
        projectileId: formData.projectileId || null,
        bulletWeightGrains: formData.bulletWeightGrains ? parseFloat(formData.bulletWeightGrains) : null,
        bulletBc: formData.bulletBc ? parseFloat(formData.bulletBc) : null,
        bcType: formData.bcType || null,
        muzzleVelocityFps: formData.muzzleVelocityFps ? parseInt(formData.muzzleVelocityFps) : null,
        zeroDistanceYards: formData.zeroDistanceYards ? parseInt(formData.zeroDistanceYards) : null,
        sightHeightInches: formData.sightHeightInches ? parseFloat(formData.sightHeightInches) : null,
        twistRate: formData.twistRate || null,
        barrelLengthInches: formData.barrelLengthInches ? parseFloat(formData.barrelLengthInches) : null,
        altitudeFeet: formData.altitudeFeet ? parseInt(formData.altitudeFeet) : null,
        temperatureF: formData.temperatureF ? parseInt(formData.temperatureF) : null,
        notes: formData.notes || null,
      },
    });
  };

  const handleDeleteProfile = (profileId: string) => {
    if (window.confirm('Delete this ballistic profile and all its dope data?')) {
      deleteProfile({ variables: { id: profileId } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <Link to={`/builds/${buildId}`} className="text-sky-600 hover:text-sky-700 text-sm mb-2 inline-block">
                ← Back to build
              </Link>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Ballistics
              </h1>
              <p className="text-slate-500 mt-1">Manage ballistic profiles and dope cards for this build</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 transition-all"
            >
              + New Profile
            </button>
          </div>

          {/* Create Profile Form */}
          {showCreateForm && (
            <div className="mb-8 bg-white shadow-sm border border-slate-100 rounded-2xl p-8">
              <h3 className="text-lg font-semibold text-slate-800 mb-6">Create Ballistic Profile</h3>
              <form onSubmit={handleCreateProfile} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Profile Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-800 placeholder-slate-400 transition-all"
                      placeholder="e.g., Match Load - 140gr ELD-M"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Caliber *</label>
                    <select
                      value={formData.caliber}
                      onChange={(e) => handleCaliberChange(e.target.value)}
                      required
                      className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-800 transition-all"
                    >
                      <option value="">Select caliber</option>
                      {calibers.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Projectile Selection */}
                {formData.caliber && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Select Projectile
                    </h4>
                    <select
                      value={formData.projectileId}
                      onChange={(e) => handleProjectileSelect(e.target.value)}
                      className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-800 transition-all"
                    >
                      <option value="">— Select a projectile (or enter manually below) —</option>
                      {Object.entries(projectilesByMfr).map(([mfr, projectiles]) => (
                        <optgroup key={mfr} label={mfr}>
                          {projectiles.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.weightGrains}gr {p.name} — BC: {p.bcG7 ? `${p.bcG7} G7` : `${p.bcG1} G1`}
                              {p.recommendedTwist ? ` (${p.recommendedTwist})` : ''}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    {formData.projectileId && (
                      <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Bullet data auto-filled from projectile catalog
                      </p>
                    )}
                  </div>
                )}

                {/* Bullet Data */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">Bullet Data</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Weight (grains)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.bulletWeightGrains}
                        onChange={(e) => setFormData({ ...formData, bulletWeightGrains: e.target.value })}
                        className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-800 placeholder-slate-400 transition-all"
                        placeholder="140"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">BC</label>
                      <input
                        type="number"
                        step="0.001"
                        value={formData.bulletBc}
                        onChange={(e) => setFormData({ ...formData, bulletBc: e.target.value })}
                        className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-800 placeholder-slate-400 transition-all"
                        placeholder="0.310"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">BC Type</label>
                      <select
                        value={formData.bcType}
                        onChange={(e) => setFormData({ ...formData, bcType: e.target.value })}
                        className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-800 transition-all"
                      >
                        <option value="G1">G1</option>
                        <option value="G7">G7</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Rifle Data */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">Rifle Data</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Muzzle Velocity (fps)</label>
                      <input
                        type="number"
                        value={formData.muzzleVelocityFps}
                        onChange={(e) => setFormData({ ...formData, muzzleVelocityFps: e.target.value })}
                        className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-800 placeholder-slate-400 transition-all"
                        placeholder="2700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Zero Distance (yds)</label>
                      <input
                        type="number"
                        value={formData.zeroDistanceYards}
                        onChange={(e) => setFormData({ ...formData, zeroDistanceYards: e.target.value })}
                        className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-800 placeholder-slate-400 transition-all"
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Sight Height (in)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.sightHeightInches}
                        onChange={(e) => setFormData({ ...formData, sightHeightInches: e.target.value })}
                        className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-800 placeholder-slate-400 transition-all"
                        placeholder="1.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Barrel Length (in)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.barrelLengthInches}
                        onChange={(e) => setFormData({ ...formData, barrelLengthInches: e.target.value })}
                        className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-800 placeholder-slate-400 transition-all"
                        placeholder="26"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <a
                      href="https://hodgdonreloading.com/rldc/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Reference Hodgdon Reloading Data Center for load data &amp; velocity
                    </a>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-800 placeholder-slate-400 transition-all"
                    placeholder="Powder charge, lot #, load details, etc."
                  />
                </div>

                <div className="flex space-x-4 pt-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 shadow-lg shadow-amber-500/25 transition-all"
                  >
                    {creating ? 'Creating...' : 'Create Profile'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowCreateForm(false); resetForm(); }}
                    className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Profiles List */}
          {profiles.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-100">
              <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-slate-600 mb-2 text-lg font-medium">No ballistic profiles yet</p>
              <p className="text-slate-400 mb-6">Create a profile to start building your dope card</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-6 py-3 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 transition-all"
              >
                Create Your First Profile
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {profiles.map((profile) => (
                <div key={profile.id} className="bg-white shadow-sm border border-slate-100 rounded-2xl overflow-hidden hover:shadow-md transition-all">
                  <div className="p-6">
                    {/* Profile Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-800">{profile.name}</h3>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-100">
                            {profile.caliber}
                          </span>
                          {profile.projectile && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-100">
                              {profile.projectile.displayName}
                            </span>
                          )}
                          {!profile.projectile && profile.bulletWeightGrains && (
                            <span className="text-sm text-slate-500">{profile.bulletWeightGrains}gr</span>
                          )}
                          {profile.bulletBc && (
                            <span className="text-sm text-slate-500">BC: {profile.bulletBc} ({profile.bcType || 'G7'})</span>
                          )}
                          {profile.muzzleVelocityFps && (
                            <span className="text-sm text-slate-500">{profile.muzzleVelocityFps} fps</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/builds/${buildId}/ballistics/${profile.id}`}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-sm transition-all"
                        >
                          Open Dope Card
                        </Link>
                        <button
                          onClick={() => handleDeleteProfile(profile.id)}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div className="bg-slate-50 rounded-xl p-3">
                        <div className="text-xs text-slate-500">Zero</div>
                        <div className="text-sm font-semibold text-slate-800">{profile.zeroDistanceYards || '—'} yds</div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3">
                        <div className="text-xs text-slate-500">Sight Height</div>
                        <div className="text-sm font-semibold text-slate-800">{profile.sightHeightInches || '—'}"</div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3">
                        <div className="text-xs text-slate-500">Twist Rate</div>
                        <div className="text-sm font-semibold text-slate-800">{profile.twistRate || '—'}</div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3">
                        <div className="text-xs text-slate-500">Barrel</div>
                        <div className="text-sm font-semibold text-slate-800">{profile.barrelLengthInches ? `${profile.barrelLengthInches}"` : '—'}</div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3">
                        <div className="text-xs text-slate-500">Dope Entries</div>
                        <div className="text-sm font-semibold text-slate-800">{profile.ballisticDrops.length}</div>
                      </div>
                    </div>

                    {/* Quick Dope Preview */}
                    {profile.ballisticDrops.length > 0 && (
                      <div className="border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quick Dope</span>
                          <span className="text-xs text-slate-400">(MOA / Mils)</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {profile.ballisticDrops.slice(0, 10).map((drop) => (
                            <div key={drop.id} className={`px-3 py-2 rounded-lg text-center min-w-[70px] ${drop.isVerified ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'}`}>
                              <div className="text-xs text-slate-500">{drop.distanceYards}y</div>
                              <div className="text-sm font-semibold text-slate-800">
                                {drop.dropMoa !== null ? `${drop.dropMoa}` : drop.dropMils !== null ? `${drop.dropMils}` : '—'}
                              </div>
                            </div>
                          ))}
                          {profile.ballisticDrops.length > 10 && (
                            <div className="px-3 py-2 rounded-lg text-center min-w-[70px] bg-slate-50 border border-slate-200">
                              <div className="text-xs text-slate-500">+{profile.ballisticDrops.length - 10}</div>
                              <div className="text-sm text-slate-400">more</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
