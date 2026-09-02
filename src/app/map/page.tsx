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
  Calendar,
  Compass,
  Loader2,
  AlertCircle,
  Plus,
  Minus,
  RotateCcw,
  Navigation,
  Globe,
} from 'lucide-react';
import { MapPlaceNode } from '@/types';

// Mercator-like projection utility to convert lat/lng to SVG percentage coordinates (0 - 100)
function projectCoords(lat: number, lng: number): { x: number; y: number } {
  // Normalize longitude (-180 to 180) to (0 to 100)
  const x = ((lng + 180) / 360) * 100;
  // Normalize latitude (-85 to 85) with Mercator projection
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

      setPlaces(json.data.places || []);
      if (json.data.places && json.data.places.length > 0) {
        setSelectedPlace(json.data.places[0]);
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

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <p className="text-sm text-slate-500">Opening your personal memory map...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-semibold mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>Geographic Memory System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Personal Memory Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Visual representation of places, cities, and travel moments remembered in your private journal.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved places..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
          />
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="h-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-3 animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <p className="text-xs text-slate-500">Rendering geographic memory nodes...</p>
        </div>
      ) : places.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 mx-auto">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No places recorded yet</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Whenever you mention cities, cafes, or locations in your journal entries, MindVault will automatically extract and pin them here.
          </p>
          <Link
            href="/journal"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors"
          >
            <span>Write an Entry</span>
          </Link>
        </div>
      ) : (
        /* Populated Map + Sidebar Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Visual Map Canvas */}
          <div className="lg:col-span-2 relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm h-[480px] sm:h-[540px] flex flex-col justify-between p-4">
            
            {/* Map Canvas Background Grid */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none transition-transform duration-300"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #2dd4bf 1px, transparent 1px), radial-gradient(circle, #38bdf8 1px, transparent 1px)',
                backgroundSize: '32px 32px',
                backgroundPosition: '0 0, 16px 16px',
                transform: `scale(${zoomLevel})`,
              }}
            />

            {/* Stylized Geographic Map Outline (SVG World/Subcontinents) */}
            <svg
              className="absolute inset-0 w-full h-full text-slate-800 pointer-events-none opacity-40 transition-transform duration-300"
              viewBox="0 0 100 60"
              preserveAspectRatio="none"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <path
                d="M15,18 Q20,15 28,17 T40,25 T35,38 T20,40 Z M55,15 Q65,12 80,18 T85,32 T70,42 T58,35 Z M42,32 Q48,28 52,35 T47,48 Z"
                fill="currentColor"
              />
            </svg>

            {/* Top Overlay Controls */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800/80 backdrop-blur-md border border-slate-700 text-slate-300 text-xs">
                <Globe className="w-3.5 h-3.5 text-teal-400" />
                <span>{filteredPlaces.length} Memory Locations Pinned</span>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-800/80 backdrop-blur-md border border-slate-700 text-slate-300">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(2, z + 0.25))}
                  className="p-1.5 hover:text-teal-400 transition-colors"
                  title="Zoom in"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                  className="p-1.5 hover:text-teal-400 transition-colors"
                  title="Zoom out"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-1.5 hover:text-teal-400 transition-colors"
                  title="Reset view"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Interactive Place Markers */}
            <div
              className="absolute inset-0 transition-transform duration-300 pointer-events-none"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {filteredPlaces.map((place) => {
                const isSelected = selectedPlace?.id === place.id;
                const pos = projectCoords(place.latitude, place.longitude);

                return (
                  <button
                    key={place.id}
                    onClick={() => setSelectedPlace(place)}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto group focus:outline-none"
                  >
                    {/* Glowing pulse aura */}
                    <div
                      className={`absolute -inset-2 rounded-full opacity-60 animate-ping pointer-events-none ${
                        isSelected ? 'bg-teal-400' : 'bg-teal-500/40'
                      }`}
                    />

                    {/* Marker icon badge */}
                    <div
                      className={`relative flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-lg transition-transform ${
                        isSelected
                          ? 'bg-teal-500 text-white scale-110 ring-2 ring-teal-300 ring-offset-2 ring-offset-slate-900 z-30'
                          : 'bg-slate-800/90 text-teal-300 hover:bg-slate-700 border border-teal-500/40 hover:scale-105 z-20'
                      }`}
                    >
                      <MapPin className="w-3 h-3 text-teal-300 shrink-0" />
                      <span>{place.name}</span>
                      {place.mentionsCount > 1 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full bg-teal-900/80 text-[10px] text-teal-200">
                          {place.mentionsCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Status Bar */}
            <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 bg-slate-850/80 backdrop-blur-md p-2.5 rounded-xl border border-slate-800">
              <span className="flex items-center space-x-1.5">
                <Navigation className="w-3 h-3 text-teal-400" />
                <span>Click any marker to explore memories recorded at that location</span>
              </span>
              <span className="hidden sm:inline">Coordinates safely derived without exposing browser API keys</span>
            </div>

          </div>

          {/* Place Details Drawer / Sidebar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-[480px] sm:h-[540px] overflow-y-auto">
            {selectedPlace ? (
              <div className="space-y-5">
                
                {/* Place Title & Meta */}
                <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                      Location Details
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {selectedPlace.latitude.toFixed(2)}°N, {selectedPlace.longitude.toFixed(2)}°E
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {selectedPlace.name}
                  </h2>
                  <div className="flex items-center space-x-4 text-xs text-slate-500 mt-2">
                    <span>{selectedPlace.mentionsCount} mention{selectedPlace.mentionsCount > 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span>Last mentioned: {new Date(selectedPlace.lastMentioned).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Associated Memories List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                    <span>Associated Memories ({selectedPlace.memories.length})</span>
                  </h3>

                  {selectedPlace.memories.length > 0 ? (
                    <div className="space-y-2">
                      {selectedPlace.memories.map((m) => (
                        <div
                          key={m.id}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 space-y-1"
                        >
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{m.title}</h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                            {m.description}
                          </p>
                          <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                            <span>{new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <Link
                              href={`/journal?id=${m.sourceJournalId}`}
                              className="text-teal-600 dark:text-teal-400 hover:underline flex items-center space-x-1 font-medium"
                            >
                              <span>View journal</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No explicit memory cards attached yet.</p>
                  )}
                </div>

                {/* Associated Journals List */}
                {selectedPlace.journals.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-teal-500" />
                      <span>Tagged Journals ({selectedPlace.journals.length})</span>
                    </h3>
                    <div className="space-y-1.5">
                      {selectedPlace.journals.map((j) => (
                        <Link
                          key={j.id}
                          href={`/journal?id=${j.id}`}
                          className="block p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 hover:border-teal-400 border border-slate-200 dark:border-slate-750 transition-colors"
                        >
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{j.title}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{new Date(j.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-2 text-slate-400">
                <MapPin className="w-8 h-8 opacity-40" />
                <p className="text-xs">Select a place marker from the map to view memories.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
