import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MapPin,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  ChevronRight,
  Maximize2,
  Send,
  UserCheck,
  Calendar,
  Eye,
  X,
  Sparkles,
  Flame,
  Trash2
} from 'lucide-react';
import {
  IncidentReport,
  IncidentStatus,
  IncidentCategory,
  IncidentPriority
} from '../types';
import { MUNICIPAL_DEPARTMENTS, CATEGORY_DETAILS } from '../data/mockIncidents';
import {
  loadGoogleMaps,
  GOOGLE_MAPS_DARK_STYLE,
  getStatusMarkerSymbol
} from '../services/googleMaps';

interface AdminDashboardProps {
  incidents: IncidentReport[];
  onUpdateStatus: (id: string, newStatus: IncidentStatus) => void;
  onUpdateAssignee: (id: string, newAssignee: string) => void;
  onClearAllReports?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  incidents,
  onUpdateStatus,
  onUpdateAssignee,
  onClearAllReports
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<IncidentReport | null>(null);
  const [isHeatmapActive, setIsHeatmapActive] = useState(false);

  // Google Maps references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersMapRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const activeInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const heatmapLayerRef = useRef<any>(null);

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((item) => {
      const matchStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchCat = categoryFilter === 'All' || item.category === categoryFilter;
      const matchPriority = priorityFilter === 'All' || item.priority === priorityFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.address && item.address.toLowerCase().includes(q));
      return matchStatus && matchCat && matchPriority && matchSearch;
    });
  }, [incidents, statusFilter, categoryFilter, priorityFilter, searchQuery]);

  // Initialize Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;

      try {
        const g = await loadGoogleMaps();
        if (!isMounted || !mapContainerRef.current) return;

        const defaultCenter = { lat: 11.0821, lng: 76.9402 };

        const map = new g.maps.Map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 14,
          styles: GOOGLE_MAPS_DARK_STYLE,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: g.maps.MapTypeControlStyle.DROPDOWN_MENU,
            position: g.maps.ControlPosition.TOP_LEFT
          },
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true
        });

        googleMapRef.current = map;
      } catch (err) {
        console.warn('Admin map load issue:', err);
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update Markers on Map whenever filteredIncidents changes
  useEffect(() => {
    const map = googleMapRef.current;
    if (!map || !window.google?.maps) return;

    // Clear existing markers
    markersMapRef.current.forEach((m) => m.setMap(null));
    markersMapRef.current.clear();

    const bounds = new google.maps.LatLngBounds();

    filteredIncidents.forEach((item) => {
      const pos = { lat: item.lat, lng: item.lng };
      bounds.extend(pos);

      const isSelected = selectedTicket?.id === item.id;
      const marker = new google.maps.Marker({
        position: pos,
        map,
        title: `${item.id}: ${item.category}`,
        icon: getStatusMarkerSymbol(item.status, isSelected)
      });

      // InfoWindow content with styled preview
      const statusColor =
        item.status === 'Pending'
          ? '#ef4444'
          : item.status === 'In Progress'
          ? '#f59e0b'
          : '#10b981';

      const infoContent = document.createElement('div');
      infoContent.className = 'civic-infowindow p-1 min-w-[200px] max-w-[240px] text-slate-100 font-sans';
      infoContent.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span style="font-family:monospace; font-size:11px; font-weight:700; color:#60a5fa;">${item.id}</span>
          <span style="font-size:10px; font-weight:700; padding:2px 6px; border-radius:9999px; color:white; background:${statusColor};">
            ${item.status}
          </span>
        </div>
        <div style="font-weight:700; font-size:13px; color:#f8fafc; margin-bottom:4px;">
          ${item.category}
        </div>
        <div style="font-size:11px; color:#94a3b8; margin-bottom:6px; line-height:1.3; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">
          ${item.description}
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:10px; color:#64748b; border-top:1px solid #334155; padding-top:4px;">
          <span>${item.date}</span>
          <span style="color:#38bdf8; font-weight:600;">${item.assignedTo}</span>
        </div>
      `;

      infoContent.addEventListener('click', () => {
        setSelectedTicket(item);
      });

      const infoWindow = new google.maps.InfoWindow({
        content: infoContent
      });

      marker.addListener('click', () => {
        if (activeInfoWindowRef.current) {
          activeInfoWindowRef.current.close();
        }
        infoWindow.open(map, marker);
        activeInfoWindowRef.current = infoWindow;
        setSelectedTicket(item);
      });

      markersMapRef.current.set(item.id, marker);
    });

    // If there are points and no specific ticket selected, fit bounds
    if (!selectedTicket && filteredIncidents.length > 0) {
      map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
    }
  }, [filteredIncidents, selectedTicket]);

  // Heatmap visualization toggle
  useEffect(() => {
    const map = googleMapRef.current;
    const g = (window as any).google;
    if (!map || !g?.maps?.visualization?.HeatmapLayer) return;

    if (isHeatmapActive) {
      const heatData = filteredIncidents.map((i) => ({
        location: new g.maps.LatLng(i.lat, i.lng),
        weight: i.priority === 'Urgent' ? 3 : i.priority === 'High' ? 2 : 1
      }));

      if (!heatmapLayerRef.current) {
        heatmapLayerRef.current = new g.maps.visualization.HeatmapLayer({
          data: heatData,
          map,
          radius: 35,
          opacity: 0.8
        });
      } else {
        heatmapLayerRef.current.setData(heatData);
        heatmapLayerRef.current.setMap(map);
      }
    } else {
      if (heatmapLayerRef.current) {
        heatmapLayerRef.current.setMap(null);
      }
    }
  }, [isHeatmapActive, filteredIncidents]);

  // Pan to ticket when clicked in list
  const handleSelectTicket = (ticket: IncidentReport) => {
    setSelectedTicket(ticket);
    const map = googleMapRef.current;
    if (map) {
      map.panTo({ lat: ticket.lat, lng: ticket.lng });
      map.setZoom(16);

      const marker = markersMapRef.current.get(ticket.id);
      if (marker && window.google?.maps) {
        if (activeInfoWindowRef.current) {
          activeInfoWindowRef.current.close();
        }
        const statusColor =
          ticket.status === 'Pending'
            ? '#ef4444'
            : ticket.status === 'In Progress'
            ? '#f59e0b'
            : '#10b981';

        const infoContent = document.createElement('div');
        infoContent.className = 'p-1 min-w-[200px] text-slate-100 font-sans';
        infoContent.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-family:monospace; font-size:11px; font-weight:700; color:#60a5fa;">${ticket.id}</span>
            <span style="font-size:10px; font-weight:700; padding:2px 6px; border-radius:9999px; color:white; background:${statusColor};">
              ${ticket.status}
            </span>
          </div>
          <div style="font-weight:700; font-size:13px; color:#f8fafc; margin-bottom:4px;">
            ${ticket.category}
          </div>
          <div style="font-size:11px; color:#94a3b8; margin-bottom:6px;">
            ${ticket.description}
          </div>
        `;
        const iw = new google.maps.InfoWindow({ content: infoContent });
        iw.open(map, marker);
        activeInfoWindowRef.current = iw;
      }
    }
  };

  // Reset map view to fit all markers or reset to city center
  const handleFitAll = () => {
    const map = googleMapRef.current;
    if (!map || !window.google?.maps) return;
    if (filteredIncidents.length === 0) {
      map.setCenter({ lat: 11.0821, lng: 76.9402 });
      map.setZoom(14);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    filteredIncidents.forEach((i) => bounds.extend({ lat: i.lat, lng: i.lng }));
    map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Control / Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by ticket ID, category, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">🔴 Pending ({incidents.filter((i) => i.status === 'Pending').length})</option>
            <option value="In Progress">🟡 In Progress ({incidents.filter((i) => i.status === 'In Progress').length})</option>
            <option value="Resolved">🟢 Resolved ({incidents.filter((i) => i.status === 'Resolved').length})</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Categories</option>
            <option value="Road Pothole">🚧 Road Pothole</option>
            <option value="Garbage & Waste">🗑️ Garbage & Waste</option>
            <option value="Streetlight Malfunction">💡 Streetlight</option>
            <option value="Water Leakage">🚰 Water Leakage</option>
            <option value="Traffic Signal">🚦 Traffic Signal</option>
            <option value="Fallen Tree / Hazard">🌳 Fallen Tree</option>
          </select>

          {/* Urgency Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Heatmap Layer Toggle */}
          <button
            onClick={() => setIsHeatmapActive(!isHeatmapActive)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold transition ${
              isHeatmapActive
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle incident density heatmap layer"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Heatmap</span>
          </button>

          {/* Fit All button */}
          <button
            onClick={handleFitAll}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
            title="Fit all markers in view"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Clear All Reports button */}
          {onClearAllReports && incidents.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to remove all existing reports and clear the list? This will remove all incident tickets.')) {
                  onClearAllReports();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
              title="Remove all reports from the list"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          )}
        </div>

      </div>

      {/* Main Grid: GIS Map on left (2 cols), Ticket Queue on right (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Map Container */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
            
            {/* Map Top Overlay Banner */}
            <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span className="font-bold text-white">Live Ward GIS Grid</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">{filteredIncidents.length} pinned incidents</span>
            </div>

            {/* Map Canvas */}
            <div
              ref={mapContainerRef}
              className="h-[540px] w-full bg-slate-950"
            />

            {/* Map Bottom Legend */}
            <div className="absolute bottom-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-3 shadow-lg">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-300">Pending</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-300">In Progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-300">Resolved</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tickets Queue List */}
        <div className="space-y-3">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl h-[580px] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-extrabold text-white">
                  Incident Tickets ({filteredIncidents.length})
                </h3>
              </div>
              <span className="text-[10px] text-slate-500">Click to locate</span>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pt-3 pr-1">
              {filteredIncidents.length === 0 ? (
                <div className="text-center py-16 text-slate-500 space-y-2 px-3">
                  <AlertTriangle className="w-8 h-8 mx-auto text-slate-600" />
                  {incidents.length === 0 ? (
                    <>
                      <p className="text-xs font-bold text-slate-300">All reports have been cleared</p>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                        There are no active incident tickets on the grid. Switch to the Citizen Portal to file a new report with GPS coordinates and photos.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-semibold">No tickets match current filters</p>
                      <button
                        onClick={() => {
                          setStatusFilter('All');
                          setCategoryFilter('All');
                          setPriorityFilter('All');
                          setSearchQuery('');
                        }}
                        className="text-xs text-blue-400 underline font-bold"
                      >
                        Reset filters
                      </button>
                    </>
                  )}
                </div>
              ) : (
                filteredIncidents.map((ticket) => {
                  const isSelected = selectedTicket?.id === ticket.id;
                  const catDetails = CATEGORY_DETAILS[ticket.category];

                  return (
                    <div
                      key={ticket.id}
                      onClick={() => handleSelectTicket(ticket)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/10 ring-1 ring-blue-500'
                          : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-extrabold text-blue-400">
                            {ticket.id}
                          </span>
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              ticket.priority === 'Urgent'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : ticket.priority === 'High'
                                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {ticket.priority}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                            ticket.status === 'Pending'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : ticket.status === 'In Progress'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              ticket.status === 'Pending'
                                ? 'bg-rose-400'
                                : ticket.status === 'In Progress'
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            }`}
                          />
                          {ticket.status}
                        </span>
                      </div>

                      <div className="flex gap-2.5 items-start my-1.5">
                        <img
                          src={ticket.photoUrl}
                          alt={ticket.category}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-200 truncate">
                            {catDetails?.icon || '⚠️'} {ticket.category}
                          </h4>
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-tight">
                            {ticket.description}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="truncate max-w-[140px]">{ticket.address}</span>
                        <span className="font-semibold text-blue-400/90 truncate max-w-[110px]">
                          {ticket.assignedTo}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Ticket Inspector Panel (Appears when ticket is selected) */}
      {selectedTicket && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-fade-in space-y-5">
          
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="font-mono text-base font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-xl border border-blue-500/20">
                {selectedTicket.id}
              </span>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  {CATEGORY_DETAILS[selectedTicket.category]?.icon || '⚠️'}{' '}
                  {selectedTicket.category}
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  Reported on {selectedTicket.date} at {selectedTicket.time} by{' '}
                  <strong className="text-slate-300">
                    {selectedTicket.reporterName || 'Citizen'}
                  </strong>
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedTicket(null)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Photo & GPS */}
            <div className="space-y-3">
              <div className="relative group rounded-2xl overflow-hidden border border-slate-800">
                <img
                  src={selectedTicket.photoUrl}
                  alt="Incident evidence"
                  className="w-full h-44 object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-300 border border-slate-800">
                  {selectedTicket.lat.toFixed(5)}, {selectedTicket.lng.toFixed(5)}
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3 text-xs space-y-1">
                <span className="text-slate-500 uppercase font-semibold text-[10px] block">
                  Tagged Street Location
                </span>
                <p className="text-slate-300 font-medium">{selectedTicket.address}</p>
                {selectedTicket.reporterContact && (
                  <p className="text-slate-400 text-[11px] pt-1">
                    Contact: <span className="text-blue-400 font-mono">{selectedTicket.reporterContact}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Description & Action Log */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Citizen Report Details
                </label>
                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 text-xs text-slate-300 leading-relaxed min-h-[90px]">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Timeline / Action Updates */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Resolution Log ({selectedTicket.updates?.length || 1})
                </label>
                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3 text-xs space-y-2 max-h-36 overflow-y-auto">
                  {selectedTicket.updates?.map((up, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 shrink-0" />
                      <div className="flex-1">
                        <span className="text-slate-200 font-medium block">{up.action}</span>
                        <span className="text-slate-500 text-[10px]">
                          {up.timestamp} • {up.actor}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Operations & Unit Dispatch */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4 flex flex-col justify-between">
              
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Assign Municipal Unit
                </label>
                <select
                  value={selectedTicket.assignedTo}
                  onChange={(e) => onUpdateAssignee(selectedTicket.id, e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-3 font-semibold focus:outline-none focus:border-blue-500"
                >
                  {MUNICIPAL_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>

                <div className="pt-2">
                  <span className="text-[11px] text-slate-400 block mb-1">Current Ticket Status:</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-xl ${
                        selectedTicket.status === 'Pending'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : selectedTicket.status === 'In Progress'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {selectedTicket.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Update Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                {selectedTicket.status !== 'In Progress' && (
                  <button
                    onClick={() => onUpdateStatus(selectedTicket.id, 'In Progress')}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Dispatch & Mark In-Progress</span>
                  </button>
                )}

                {selectedTicket.status !== 'Resolved' && (
                  <button
                    onClick={() => onUpdateStatus(selectedTicket.id, 'Resolved')}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Resolved & Close Ticket</span>
                  </button>
                )}

                {selectedTicket.status === 'Resolved' && (
                  <button
                    onClick={() => onUpdateStatus(selectedTicket.id, 'Pending')}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Reopen Incident Ticket</span>
                  </button>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};
