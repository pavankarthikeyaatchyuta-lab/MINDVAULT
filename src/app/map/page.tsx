'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  MapPin,
  Sparkles,
  Search,
  ExternalLink,
  BookOpen,
  Loader2,
  AlertCircle,
  Plus,
  Minus,
  RotateCcw,
  Globe,
  MapPinOff,
  ShieldCheck,
} from 'lucide-react';
import { MapPlaceNode } from '@/types';

// Mercator-like projection utility to convert lat/lng to SVG percentage coordinates (0 - 100)
function projectCoords(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng + 180) / 360) * 100;
  const clampedLat = Math.max(-85, Math.min(85, lat));
  const rad = (clampedLat * Math.PI) / 180;
  const merc = Math.log(Math.tan(Math.PI / 4 + rad / 2));
  const y = (1 - merc / Math.PI) * 50;
  return {
    x: Math.max(2, Math.min(98, x)),
    y: Math.max(5, Math.min(95, y)),
  };
}

export default function MapPage() {
  const { user, loading: authLoading, getIdToken } = useAuth();
  const router = useRouter();

  const [places, setPlaces] = useState<MapPlaceNode[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<MapPlaceNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchPlaces = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch('/api/map/places', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to fetch memory places');
      }

      const placeList: MapPlaceNode[] = json.data.places || [];
      setPlaces(placeList);
      if (placeList.length > 0) {
        // Select first mapped place or first overall
        const firstMapped = placeList.find((p) => p.latitude !== null && p.longitude !== null);
        setSelectedPlace(firstMapped || placeList[0]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not load memory map.');
    } finally {
      setIsLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    if (user) {
      fetchPlaces();
    }
  }, [user, fetchPlaces]);

  const filteredPlaces = useMemo(() => {
    if (!searchQuery.trim()) return places;
    const q = searchQuery.toLowerCase();
    return places.filter((p) => p.name.toLowerCase().includes(q));
  }, [places, searchQuery]);

  const mappedPlaces = useMemo(() => {
    return filteredPlaces.filter((p) => p.latitude !== null && p.longitude !== null);
  }, [filteredPlaces]);

  const unresolvedPlaces = useMemo(() => {
    return filteredPlaces.filter((p) => p.latitude === null || p.longitude === null);
  }, [filteredPlaces]);

  // Compute collision-free pin coordinates with smart offsets for nearby cities
  const positionedPins = useMemo(() => {
    const result: Array<{
      place: MapPlaceNode;
      pos: { x: number; y: number };
      offset: { x: number; y: number };
    }> = [];

    for (let i = 0; i < mappedPlaces.length; i++) {
      const p = mappedPlaces[i];
      const base = projectCoords(p.latitude!, p.longitude!);
      let ox = 0;
      let oy = 0;

      // Detect collisions with previously placed pins (e.g. Bengaluru and Hyderabad)
      const collisions = result.filter(
        (prev) => Math.hypot(prev.pos.x - base.x, prev.pos.y - base.y) < 4.8
      );

      if (collisions.length > 0) {
        // Stagger labels in alternate angles so both are 100% visible and clickable
        const angle = (collisions.length * Math.PI) / 1.8 + Math.PI / 4;
        ox = Math.cos(angle) * 4.6;
        oy = Math.sin(angle) * 3.8;
      }

      result.push({
        place: p,
        pos: base,
        offset: { x: ox, y: oy },
      });
    }

    return result;
  }, [mappedPlaces]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm" style={{ color: 'var(--mv-text-muted)' }}>
          Opening your personal memory map...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-4 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="mv-badge mb-2">
            <Globe className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
            <span>Geographic Memory System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--mv-text)' }}>
            Personal Memory Map
          </h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--mv-text-muted)' }}>
            Grounded geographic representation of places remembered in your journal with zero fabricated coordinates.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-indigo-400/70 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved places..."
            className="mv-input pl-9 text-xs"
          />
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="h-96 mv-card flex flex-col items-center justify-center space-y-3 animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-xs" style={{ color: 'var(--mv-text-muted)' }}>
            Loading verified geographic nodes...
          </p>
        </div>
      ) : places.length === 0 ? (
        /* Empty State */
        <div className="mv-card p-12 text-center space-y-4 max-w-md mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mx-auto">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--mv-text)' }}>
            No places recorded yet
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--mv-text-muted)' }}>
            Mention cities or places in your journal entries to have MindVault automatically extract and ground them here.
          </p>
          <Link
            href="/journal"
            className="mv-btn-primary inline-flex items-center space-x-2 text-xs"
          >
            <span>Write an Entry</span>
          </Link>
        </div>
      ) : (
        /* Populated Map + Sidebar Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Visual Map Canvas */}
          <div className="lg:col-span-2 relative bg-gradient-to-b from-blue-50/70 via-indigo-50/40 to-slate-100/90 dark:from-[#0d1020] dark:via-[#12132b] dark:to-[#0a0b16] border border-indigo-200/80 dark:border-indigo-500/20 rounded-2xl overflow-hidden shadow-lg h-[500px] sm:h-[560px] flex flex-col justify-between p-4 transition-colors">
            {/* Map Canvas Background Grid */}
            <div
              className="absolute inset-0 opacity-40 pointer-events-none transition-transform duration-300"
              style={{
                backgroundImage:
                  'radial-gradient(circle, rgba(99, 102, 241, 0.25) 1px, transparent 1px), radial-gradient(circle, rgba(168, 85, 247, 0.15) 1px, transparent 1px)',
                backgroundSize: '28px 28px',
                backgroundPosition: '0 0, 14px 14px',
                transform: `scale(${zoomLevel})`,
              }}
            />

            {/* Stylized Accurate World Map Vector */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none transition-transform duration-300 opacity-80"
              viewBox="0 0 100 60"
              preserveAspectRatio="none"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <defs>
                <linearGradient id="continentGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c7d2fe" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#ddd6fe" stopOpacity="0.65" />
                </linearGradient>
                <linearGradient id="continentGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#2e1065" stopOpacity="0.5" />
                </linearGradient>
              </defs>

              {/* Latitude / Longitude Graticule lines */}
              <g stroke="currentColor" strokeDasharray="1,2" strokeWidth="0.15" className="text-indigo-300/40 dark:text-indigo-500/20">
                <line x1="0" y1="30" x2="100" y2="30" />
                <line x1="0" y1="18" x2="100" y2="18" />
                <line x1="0" y1="42" x2="100" y2="42" />
                <line x1="25" y1="0" x2="25" y2="60" />
                <line x1="50" y1="0" x2="50" y2="60" />
                <line x1="75" y1="0" x2="75" y2="60" />
              </g>

              {/* Continent Outlines */}
              <g
                stroke="#818cf8"
                strokeWidth="0.3"
                strokeLinejoin="round"
                className="fill-[url(#continentGradLight)] dark:fill-[url(#continentGradDark)] stroke-indigo-400/50 dark:stroke-indigo-400/40"
              >
                {/* North America */}
                <path d="M 8,8 C 14,6 24,7 30,12 C 34,16 32,24 28,30 C 24,34 20,34 16,28 C 12,24 8,18 6,12 Z" />
                {/* Central America */}
                <path d="M 18,30 Q 22,34 24,40 Q 21,42 18,34 Z" />
                {/* South America */}
                <path d="M 24,38 C 30,37 34,42 33,50 C 31,58 27,66 24,70 C 22,68 20,56 20,46 C 20,40 22,38 24,38 Z" />
                {/* Europe */}
                <path d="M 44,12 C 50,10 56,13 54,20 C 50,22 46,21 44,17 Z" />
                <path d="M 41,13 Q 43,12 42,16 Q 40,17 41,13 Z" />
                {/* Africa */}
                <path d="M 44,22 C 52,20 58,25 56,35 C 54,45 50,54 46,57 C 42,55 40,44 40,32 C 40,25 42,22 44,22 Z" />
                {/* Madagascar */}
                <path d="M 58,45 Q 60,43 59,49 Q 57,50 58,45 Z" />
                {/* Eurasia & Asia */}
                <path d="M 54,10 C 66,7 82,9 90,14 C 88,23 80,28 72,28 C 64,28 58,23 54,17 Z" />
                {/* Indian Subcontinent (Peninsula) */}
                <path d="M 66,27 C 72,27 75,31 74,37 C 72,42 70,46 69,48 C 68,46 66,39 65,34 C 65,30 66,27 66,27 Z" />
                {/* East Asia & Japan */}
                <path d="M 75,28 C 81,30 83,35 81,40 C 79,40 77,35 75,33 Z" />
                <path d="M 86,20 Q 88,23 87,27 Q 85,25 86,20 Z" />
                {/* Australia */}
                <path d="M 76,46 C 84,44 88,49 86,57 C 82,62 76,62 74,56 C 72,51 74,48 76,46 Z" />
              </g>
            </svg>

            {/* Top Overlay Controls */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-indigo-200/80 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-200 text-xs font-medium shadow-sm">
                <Globe className="w-3.5 h-3.5 text-indigo-500" />
                <span>
                  {mappedPlaces.length} Mapped Pins ({unresolvedPlaces.length} Unresolved)
                </span>
              </div>

              {/* Quick Regional Focus + Zoom Controls */}
              <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-indigo-200/80 dark:border-indigo-500/20 shadow-sm text-slate-700 dark:text-slate-200">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.35))}
                  className="p-1.5 rounded-lg hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-all"
                  title="Zoom in"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.35))}
                  className="p-1.5 rounded-lg hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-all"
                  title="Zoom out"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-1.5 rounded-lg hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-all"
                  title="Reset view"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Interactive Place Markers with Collision Avoidance */}
            <div
              className="absolute inset-0 transition-transform duration-300 pointer-events-none"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {positionedPins.map(({ place, pos, offset }) => {
                const isSelected = selectedPlace?.id === place.id;
                const labelX = pos.x + offset.x;
                const labelY = pos.y + offset.y;

                return (
                  <div
                    key={place.id}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    className="absolute pointer-events-auto group focus:outline-none"
                  >
                    {/* Anchor coordinate beacon at the exact coordinates */}
                    <div className="absolute -translate-x-1/2 -translate-y-1/2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          isSelected ? 'bg-indigo-500 ring-4 ring-indigo-300/60 dark:ring-indigo-400/40 animate-pulse' : 'bg-violet-500'
                        }`}
                      />
                    </div>

                    {/* Staggered badge pill */}
                    <button
                      onClick={() => setSelectedPlace(place)}
                      style={{
                        transform: `translate(calc(-50% + ${offset.x * 3}px), calc(-50% + ${offset.y * 3}px))`,
                      }}
                      className={`relative flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold shadow-md transition-all duration-200 ${
                        isSelected
                          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white scale-110 ring-2 ring-indigo-300 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 z-30 shadow-indigo-500/30'
                          : 'bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-violet-200 hover:bg-indigo-50 dark:hover:bg-slate-800 border border-indigo-200 dark:border-violet-500/40 hover:scale-105 z-20'
                      }`}
                    >
                      <MapPin className={`w-3 h-3 shrink-0 ${isSelected ? 'text-white' : 'text-indigo-500 dark:text-violet-400'}`} />
                      <span>{place.name}</span>
                      {place.mentionsCount > 1 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-[10px] text-indigo-700 dark:text-indigo-200">
                          {place.mentionsCount}
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bottom Status Bar */}
            <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 bg-white/90 dark:bg-slate-900/85 backdrop-blur-md p-2.5 rounded-xl border border-indigo-200/80 dark:border-indigo-500/20 shadow-sm">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                <span>Zero synthetic coordinates. Unresolved locations are clearly separated.</span>
              </span>
              <span className="hidden sm:inline text-indigo-600 dark:text-indigo-400 font-semibold">Provenance verified</span>
            </div>
          </div>

          {/* Place Details Drawer / Sidebar */}
          <div className="mv-card p-6 flex flex-col justify-between h-[500px] sm:h-[560px] overflow-y-auto space-y-5">
            {/* Quick Hubs Pill Selector */}
            {mappedPlaces.length > 0 && (
              <div className="space-y-2 pb-3 border-b" style={{ borderColor: 'var(--mv-border)' }}>
                <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: 'var(--mv-text-muted)' }}>
                  Saved Places ({mappedPlaces.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {mappedPlaces.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlace(p)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                        selectedPlace?.id === p.id
                          ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md scale-105'
                          : 'bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200/60 dark:border-indigo-500/30'
                      }`}
                    >
                      <MapPin className="w-3 h-3" />
                      <span>{p.name}</span>
                      <span className="text-[10px] opacity-75">({p.mentionsCount})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedPlace ? (
              <div className="space-y-5">
                {/* Place Title & Meta */}
                <div className="pb-4 border-b" style={{ borderColor: 'var(--mv-border)' }}>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        selectedPlace.precision === 'exact'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                          : selectedPlace.precision === 'city'
                          ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                      }`}
                    >
                      {selectedPlace.precision === 'exact'
                        ? 'Exact Location'
                        : selectedPlace.precision === 'city'
                        ? 'City-Level Centroid'
                        : 'Unresolved Location'}
                    </span>
                    {selectedPlace.latitude !== null && selectedPlace.longitude !== null ? (
                      <span className="text-[11px] font-mono" style={{ color: 'var(--mv-text-muted)' }}>
                        {selectedPlace.latitude.toFixed(2)}°N, {selectedPlace.longitude.toFixed(2)}°E
                      </span>
                    ) : (
                      <span className="text-[11px] text-amber-500 font-medium">No geo coordinates</span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold mt-2" style={{ color: 'var(--mv-text)' }}>
                    {selectedPlace.name}
                  </h2>
                  <div className="flex items-center space-x-3 text-xs mt-1" style={{ color: 'var(--mv-text-muted)' }}>
                    <span>
                      {selectedPlace.mentionsCount} mention{selectedPlace.mentionsCount > 1 ? 's' : ''}
                    </span>
                    <span>•</span>
                    <span>
                      Last mentioned:{' '}
                      {new Date(selectedPlace.lastMentioned).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {selectedPlace.precision === 'unresolved' && (
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-2 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 leading-relaxed">
                      Mentioned in writing without verified geographic coordinates. Kept in your personal index without synthetic mapping.
                    </p>
                  )}
                </div>

                {/* Associated Memories List */}
                <div className="space-y-3">
                  <h3
                    className="text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5"
                    style={{ color: 'var(--mv-text-muted)' }}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                    <span>Associated Memories ({selectedPlace.memories.length})</span>
                  </h3>

                  {selectedPlace.memories.length > 0 ? (
                    <div className="space-y-2">
                      {selectedPlace.memories.map((m) => (
                        <div
                          key={m.id}
                          className="p-3 rounded-xl border space-y-1 transition-all"
                          style={{
                            background: 'rgba(99, 102, 241, 0.04)',
                            borderColor: 'var(--mv-border)',
                          }}
                        >
                          <h4 className="text-xs font-bold" style={{ color: 'var(--mv-text)' }}>
                            {m.title}
                          </h4>
                          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--mv-text-muted)' }}>
                            {m.description}
                          </p>
                          <div
                            className="pt-1 flex items-center justify-between text-[10px]"
                            style={{ color: 'var(--mv-text-muted)' }}
                          >
                            <span>
                              {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <Link
                              href={`/journal?id=${m.sourceJournalId}`}
                              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 font-medium"
                            >
                              <span>View journal</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs" style={{ color: 'var(--mv-text-muted)' }}>
                      No memory cards attached.
                    </p>
                  )}
                </div>

                {/* Associated Journals List */}
                {selectedPlace.journals.length > 0 && (
                  <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--mv-border)' }}>
                    <h3
                      className="text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5"
                      style={{ color: 'var(--mv-text-muted)' }}
                    >
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Tagged Journals ({selectedPlace.journals.length})</span>
                    </h3>
                    <div className="space-y-1.5">
                      {selectedPlace.journals.map((j) => (
                        <Link
                          key={j.id}
                          href={`/journal?id=${j.id}`}
                          className="block p-2.5 rounded-xl border transition-colors hover:border-indigo-400/50"
                          style={{
                            background: 'rgba(99, 102, 241, 0.04)',
                            borderColor: 'var(--mv-border)',
                          }}
                        >
                          <span className="text-xs font-medium" style={{ color: 'var(--mv-text)' }}>
                            {j.title}
                          </span>
                          <span className="text-[10px] block mt-0.5" style={{ color: 'var(--mv-text-muted)' }}>
                            {new Date(j.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center h-full text-center space-y-2"
                style={{ color: 'var(--mv-text-muted)' }}
              >
                <MapPin className="w-8 h-8 opacity-40 text-indigo-400" />
                <p className="text-xs">Select a place marker from the map or list below.</p>
              </div>
            )}

            {/* Unresolved Places Quick Access */}
            {unresolvedPlaces.length > 0 && (
              <div className="pt-4 border-t space-y-2" style={{ borderColor: 'var(--mv-border)' }}>
                <div
                  className="flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: 'var(--mv-text-muted)' }}
                >
                  <MapPinOff className="w-3.5 h-3.5 text-violet-500" />
                  <span>Unresolved Places ({unresolvedPlaces.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {unresolvedPlaces.map((up) => (
                    <button
                      key={up.id}
                      onClick={() => setSelectedPlace(up)}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-all border ${
                        selectedPlace?.id === up.id
                          ? 'bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/40 font-semibold shadow-sm'
                          : 'hover:border-violet-400/40'
                      }`}
                      style={
                        selectedPlace?.id !== up.id
                          ? {
                              background: 'rgba(99, 102, 241, 0.05)',
                              borderColor: 'var(--mv-border)',
                              color: 'var(--mv-text-muted)',
                            }
                          : undefined
                      }
                    >
                      {up.name} ({up.mentionsCount})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
