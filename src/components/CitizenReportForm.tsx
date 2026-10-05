import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  MapPin,
  Send,
  Navigation,
  CheckCircle2,
  AlertCircle,
  X,
  Upload,
  Search,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { IncidentReport, IncidentCategory, IncidentPriority } from '../types';
import { CATEGORY_DETAILS } from '../data/mockIncidents';
import { loadGoogleMaps, GOOGLE_MAPS_DARK_STYLE, reverseGeocode } from '../services/googleMaps';

interface CitizenReportFormProps {
  onReportSubmitted: (report: IncidentReport) => void;
  onSwitchToAdmin: () => void;
  onViewMyReports?: () => void;
  currentUser?: { id?: string; name: string; badgeOrPhone?: string } | null;
}

export const CitizenReportForm: React.FC<CitizenReportFormProps> = ({
  onReportSubmitted,
  onSwitchToAdmin,
  onViewMyReports,
  currentUser
}) => {
  const [category, setCategory] = useState<IncidentCategory>('Road Pothole');
  const [priority, setPriority] = useState<IncidentPriority>('High');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState(currentUser?.name || '');
  const [reporterContact, setReporterContact] = useState(currentUser?.badgeOrPhone || '');

  // Coordinates (default around active city zone: Coimbatore 11.0821, 76.9402)
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 11.0821,
    lng: 76.9402
  });
  const [resolvedAddress, setResolvedAddress] = useState<string>(
    'Near Avinashi Main Road, Ward 24'
  );
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Photo
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<IncidentReport | null>(null);

  // Address search query on map
  const [searchAddress, setSearchAddress] = useState('');

  // Google Maps references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapInstance = useRef<google.maps.Map | null>(null);
  const markerInstance = useRef<google.maps.Marker | null>(null);

  // Auto-update priority when category changes
  const handleCategoryChange = (cat: IncidentCategory) => {
    setCategory(cat);
    if (CATEGORY_DETAILS[cat]) {
      setPriority(CATEGORY_DETAILS[cat].defaultPriority);
    }
  };

  // Initialize Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;

      try {
        const g = await loadGoogleMaps();
        if (!isMounted || !mapContainerRef.current) return;

        const map = new g.maps.Map(mapContainerRef.current, {
          center: coords,
          zoom: 15,
          styles: GOOGLE_MAPS_DARK_STYLE,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true
        });

        const marker = new g.maps.Marker({
          position: coords,
          map,
          draggable: true,
          title: 'Drag to pinpoint exact issue location',
          animation: g.maps.Animation.DROP,
          icon: {
            path: g.maps.SymbolPath.CIRCLE,
            scale: 11,
            fillColor: '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
          }
        });

        // Click map to reposition marker
        map.addListener('click', async (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          const newLat = e.latLng.lat();
          const newLng = e.latLng.lng();
          setCoords({ lat: newLat, lng: newLng });
          marker.setPosition({ lat: newLat, lng: newLng });

          const addr = await reverseGeocode(newLat, newLng);
          if (isMounted) setResolvedAddress(addr);
        });

        // Drag marker end
        marker.addListener('dragend', async () => {
          const pos = marker.getPosition();
          if (!pos) return;
          const newLat = pos.lat();
          const newLng = pos.lng();
          setCoords({ lat: newLat, lng: newLng });

          const addr = await reverseGeocode(newLat, newLng);
          if (isMounted) setResolvedAddress(addr);
        });

        googleMapInstance.current = map;
        markerInstance.current = marker;

        // Perform initial reverse geocode
        reverseGeocode(coords.lat, coords.lng).then((addr) => {
          if (isMounted) setResolvedAddress(addr);
        });
      } catch (err) {
        console.warn('Google Maps load issue:', err);
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update map center when coords change externally (e.g. GPS)
  const updateMapPosition = (lat: number, lng: number) => {
    if (googleMapInstance.current) {
      googleMapInstance.current.panTo({ lat, lng });
      googleMapInstance.current.setZoom(16);
    }
    if (markerInstance.current) {
      markerInstance.current.setPosition({ lat, lng });
    }
  };

  // Browser GPS auto-detection
  const handleAutoGPS = () => {
    setIsDetectingGps(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      setIsDetectingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        updateMapPosition(latitude, longitude);
        setIsDetectingGps(false);

        const addr = await reverseGeocode(latitude, longitude);
        setResolvedAddress(addr);
      },
      (err) => {
        console.warn('GPS detection failed:', err);
        setGpsError('Could not detect GPS. Please pick a location manually on the map.');
        setIsDetectingGps(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Search Address Geocoding
  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchAddress.trim() || !window.google?.maps?.Geocoder) return;

    try {
      const geocoder = new google.maps.Geocoder();
      const res = await geocoder.geocode({ address: searchAddress });
      if (res.results && res.results[0]) {
        const loc = res.results[0].geometry.location;
        const lat = loc.lat();
        const lng = loc.lng();
        setCoords({ lat, lng });
        updateMapPosition(lat, lng);
        setResolvedAddress(res.results[0].formatted_address);
      }
    } catch (err) {
      console.warn('Address geocode error:', err);
    }
  };

  // Photo Upload Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);

    const ticketNumber = `TICK-${Math.floor(200 + Math.random() * 800)}`;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Fallback photo if none uploaded
    const fallbackPhoto =
      category === 'Road Pothole'
        ? 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80'
        : category === 'Garbage & Waste'
        ? 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=80'
        : category === 'Streetlight Malfunction'
        ? 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80';

    const newTicket: IncidentReport = {
      id: ticketNumber,
      category,
      description,
      lat: coords.lat,
      lng: coords.lng,
      address: resolvedAddress,
      status: 'Pending',
      priority,
      date: dateStr,
      time: timeStr,
      assignedTo: 'Unassigned',
      photoUrl: imagePreview || fallbackPhoto,
      reporterName: reporterName.trim() || currentUser?.name || 'Anonymous Citizen',
      reporterContact: reporterContact.trim() || currentUser?.badgeOrPhone || undefined,
      reporterId: currentUser?.id,
      updates: [
        {
          timestamp: `${dateStr} ${timeStr}`,
          action: 'Incident ticket registered on Municipal GIS',
          actor: 'Citizen Portal'
        }
      ]
    };

    setTimeout(() => {
      onReportSubmitted(newTicket);
      setSubmittedTicket(newTicket);
      setIsSubmitting(false);
    }, 600);
  };

  const handleReset = () => {
    setSubmittedTicket(null);
    setDescription('');
    setImagePreview(null);
    setReporterName('');
    setReporterContact('');
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* If already submitted, display confirmation view */}
      {submittedTicket ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 inline-block mb-2">
            Ticket Dispatched
          </span>
          <h2 className="text-2xl font-extrabold text-white">Incident Successfully Registered</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-2">
            Your civic report has been broadcast to the Ward Operations GIS grid and assigned a tracking reference.
          </p>

          <div className="my-6 bg-slate-950 border border-slate-800/80 rounded-2xl p-5 text-left space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <span className="text-xs text-slate-400 font-semibold uppercase">Tracking ID</span>
              <span className="text-sm font-black font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                {submittedTicket.id}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Category</span>
                <span className="font-bold text-slate-200">{submittedTicket.category}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Priority</span>
                <span className="font-bold text-rose-400">{submittedTicket.priority}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Location Coordinates</span>
                <span className="font-mono text-slate-300">
                  {submittedTicket.lat.toFixed(4)}, {submittedTicket.lng.toFixed(4)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Current Status</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  Queued for Ward Triage
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-500 block mb-0.5">Tagged Address</span>
              <span className="text-slate-300 font-medium">{submittedTicket.address}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onViewMyReports && (
              <button
                onClick={onViewMyReports}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
              >
                <span>Track in My Reports</span>
                <Sparkles className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleReset}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
            >
              Submit Another Report
            </button>
            <button
              onClick={onSwitchToAdmin}
              className="px-5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <span>Ward Admin Grid</span>
            </button>
          </div>
        </div>
      ) : (
        /* Report Form */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Header */}
          <div className="border-b border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                  <Camera className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-extrabold text-white">Report a Civic Incident</h2>
              </div>
              <p className="text-xs text-slate-400">
                Pinpoint public infrastructure issues on Google Maps with photo proof for rapid municipal dispatch.
              </p>
            </div>
            {onViewMyReports && (
              <button
                type="button"
                onClick={onViewMyReports}
                className="self-start sm:self-auto px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-blue-400 hover:text-blue-300 transition flex items-center gap-1.5 shrink-0"
              >
                <span>View My Reports</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Category Quick Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                1. Select Issue Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    'Road Pothole',
                    'Garbage & Waste',
                    'Streetlight Malfunction',
                    'Water Leakage',
                    'Traffic Signal',
                    'Damaged Sidewalk',
                    'Fallen Tree / Hazard'
                  ] as IncidentCategory[]
                ).map((cat) => {
                  const details = CATEGORY_DETAILS[cat];
                  const isSelected = category === cat;
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/10'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xl mb-2">{details?.icon || '⚠️'}</span>
                      <span className="text-xs font-semibold text-slate-200 line-clamp-1">{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Priority Level */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                2. Urgency & Severity
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['Low', 'Medium', 'High', 'Urgent'] as IncidentPriority[]).map((lvl) => {
                  const isSelected = priority === lvl;
                  return (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setPriority(lvl)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all ${
                        isSelected
                          ? lvl === 'Urgent'
                            ? 'bg-rose-600 text-white border-rose-500'
                            : lvl === 'High'
                            ? 'bg-orange-600 text-white border-orange-500'
                            : lvl === 'Medium'
                            ? 'bg-amber-600 text-white border-amber-500'
                            : 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Photo Proof Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                3. Photo Evidence
              </label>
              <div className="relative border-2 border-dashed border-slate-800 rounded-2xl p-4 bg-slate-950/40 text-center hover:border-slate-700 transition">
                <input
                  type="file"
                  id="incident-photo-input"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {imagePreview ? (
                  <div className="relative group">
                    <img
                      src={imagePreview}
                      alt="Uploaded proof"
                      className="w-full h-48 object-cover rounded-xl border border-slate-800"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImagePreview(null);
                      }}
                      className="absolute top-3 right-3 p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow-lg z-20 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Click or tap image to change photo
                    </p>
                  </div>
                ) : (
                  <div className="py-6 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-300">
                        Drop photo here or tap to browse
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Supports JPEG, PNG, or Camera capture
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sample Photo Quick Selectors */}
              <div className="mt-2 flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
                <span className="text-slate-500 font-medium">Or quick sample photo:</span>
                <button
                  type="button"
                  onClick={() => setImagePreview('https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80')}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 font-semibold transition"
                >
                  🚧 Pothole
                </button>
                <button
                  type="button"
                  onClick={() => setImagePreview('https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=80')}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 font-semibold transition"
                >
                  🗑️ Waste Spill
                </button>
                <button
                  type="button"
                  onClick={() => setImagePreview('https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80')}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 font-semibold transition"
                >
                  🚰 Water Leak
                </button>
              </div>
            </div>

            {/* 4. Google Maps Pinpoint */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  4. Exact Incident Location (Google Maps)
                </label>
                <button
                  type="button"
                  onClick={handleAutoGPS}
                  disabled={isDetectingGps}
                  className="flex items-center gap-1.5 px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold transition"
                >
                  <Navigation className={`w-3.5 h-3.5 ${isDetectingGps ? 'animate-spin' : ''}`} />
                  <span>{isDetectingGps ? 'Detecting GPS...' : 'Auto Detect GPS'}</span>
                </button>
              </div>

              {/* Address Search */}
              <div className="mb-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearchAddress(e);
                    }}
                    placeholder="Search address or street name..."
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-20 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={handleSearchAddress}
                    className="absolute right-1.5 top-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold"
                  >
                    Locate
                  </button>
                </div>
              </div>

              {gpsError && (
                <div className="mb-2 text-xs text-rose-400 flex items-center gap-1.5 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{gpsError}</span>
                </div>
              )}

              {/* Map Canvas */}
              <div className="h-64 sm:h-72 w-full rounded-2xl overflow-hidden border border-slate-800 relative shadow-inner">
                <div ref={mapContainerRef} className="w-full h-full" />
                <div className="absolute top-2 left-2 bg-slate-900/90 backdrop-blur border border-slate-800 text-[11px] font-semibold text-slate-300 px-2.5 py-1 rounded-lg pointer-events-none shadow">
                  📍 Drag the pin or click on map
                </div>
              </div>

              {/* Resolved Address Banner */}
              <div className="mt-2 bg-slate-950 border border-slate-800/80 rounded-xl p-2.5 flex items-start gap-2 text-xs text-slate-400">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-slate-500 font-semibold uppercase text-[10px] block">
                    Tagged Address
                  </span>
                  <span className="text-slate-200 font-medium">{resolvedAddress}</span>
                  <span className="text-slate-500 block text-[10px] mt-0.5 font-mono">
                    Lat: {coords.lat.toFixed(5)}, Lng: {coords.lng.toFixed(5)}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Description */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  5. Incident Description & Landmarks
                </label>
                <span className="text-[10px] text-slate-500">{description.length}/400</span>
              </div>
              <textarea
                rows={3}
                maxLength={400}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="E.g., Deep pothole in right lane opposite bus stop, hard to see at night..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-3.5 text-xs focus:outline-none focus:border-blue-500 transition"
                required
              />
            </div>

            {/* 6. Optional Reporter Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="E.g., Karthik Kumar"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Mobile / WhatsApp for Updates (Optional)
                </label>
                <input
                  type="tel"
                  value={reporterContact}
                  onChange={(e) => setReporterContact(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm transition-all shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className={`w-4 h-4 ${isSubmitting ? 'animate-bounce' : ''}`} />
              <span>{isSubmitting ? 'Transmitting to GIS...' : 'Dispatch Civic Incident Report'}</span>
            </button>

          </form>
        </div>
      )}
    </div>
  );
};
