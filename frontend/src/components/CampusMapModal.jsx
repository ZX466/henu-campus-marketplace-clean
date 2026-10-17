import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CAMPUS_MAP_CONFIG, CAMPUS_ZONES, HENU_CAMPUSES, CAMPUS_STREAMS, DELIVERY_MODES } from '../data/henuCampuses';

// 100% Free Public Map Tile Providers (ZERO API KEY REQUIRED, NO WATERMARKS)
const TILE_LAYERS = {
  dark: {
    name: 'Dark Radar',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16
  },
  street: {
    name: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }
};

export default function CampusMapModal({ isOpen, onClose, onSelectCampus }) {
  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedStream, setSelectedStream] = useState('all'); // 'all' | 'book' | 'goods'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCollegeId, setActiveCollegeId] = useState('jinming');
  const [selectedDeliveryMode, setSelectedDeliveryMode] = useState('in-campus'); // 'in-campus' | 'out-of-campus'
  const [mapStyle, setMapStyle] = useState('dark'); // 'dark' | 'street'

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersRef = useRef({});
  const polygonsRef = useRef({});

  // Filter campuses based on zone, stream, and search query
  const filteredColleges = useMemo(() => {
    return HENU_CAMPUSES.filter((col) => {
      const matchesZone = selectedZone === 'all' || col.zoneId === selectedZone;
      const matchesStream = selectedStream === 'all' || col.stream === selectedStream;
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        col.name.toLowerCase().includes(query) ||
        col.shortName.toLowerCase().includes(query) ||
        col.city.toLowerCase().includes(query) ||
        col.district.toLowerCase().includes(query);
      return matchesZone && matchesStream && matchesQuery;
    });
  }, [selectedZone, selectedStream, searchQuery]);

  // Keep active college valid in filtered list
  const activeCollege = useMemo(() => {
    const found = HENU_CAMPUSES.find((c) => c.id === activeCollegeId);
    if (found && (selectedZone === 'all' || found.zoneId === selectedZone)) {
      return found;
    }
    return filteredColleges[0] || HENU_CAMPUSES[0];
  }, [activeCollegeId, filteredColleges, selectedZone]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // =========================================================================
  // LEAFLET MAP INITIALIZATION (FREE TILES, NO API KEY)
  // =========================================================================
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: CAMPUS_MAP_CONFIG.center,
      zoom: CAMPUS_MAP_CONFIG.defaultZoom,
      minZoom: CAMPUS_MAP_CONFIG.minZoom,
      maxZoom: CAMPUS_MAP_CONFIG.maxZoom,
      zoomControl: false,
      attributionControl: false
    });

    const tileConfig = TILE_LAYERS[mapStyle];
    tileLayerRef.current = L.tileLayer(tileConfig.url, {
      maxZoom: tileConfig.maxZoom,
      attribution: tileConfig.attribution
    }).addTo(map);

    mapInstanceRef.current = map;

    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Switch Tile Style (Dark vs OpenStreetMap Street)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const tileConfig = TILE_LAYERS[mapStyle];
    tileLayerRef.current.setUrl(tileConfig.url);
  }, [mapStyle]);

  // =========================================================================
  // RENDER CAMPUS ZONE POLYGONS
  // =========================================================================
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.values(polygonsRef.current).forEach((layer) => {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    });
    polygonsRef.current = {};

    CAMPUS_ZONES.forEach((zone) => {
      if (!zone.polygon) return;

      const isSelected = selectedZone === zone.id;
      const poly = L.polygon(zone.polygon, {
        color: zone.color,
        weight: isSelected ? 3 : 1.5,
        dashArray: isSelected ? 'none' : '4, 6',
        fillColor: zone.color,
        fillOpacity: isSelected ? 0.25 : 0.07,
        smoothFactor: 1
      }).addTo(map);

      poly.bindTooltip(
        `<div style="font-weight:700; font-size:11px; color:${zone.color};">📍 ${zone.name}</div>`,
        { sticky: true, className: 'zone-boundary-tooltip' }
      );

      poly.on('click', () => {
        handleZoneSelect(zone.id);
      });

      polygonsRef.current[zone.id] = poly;
    });
  }, [isOpen, selectedZone]);

  // =========================================================================
  // RENDER HIGH-VISIBILITY CAMPUS PINS
  // =========================================================================
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.values(markersRef.current).forEach((marker) => {
      if (map.hasLayer(marker)) map.removeLayer(marker);
    });
    markersRef.current = {};

    filteredColleges.forEach((college) => {
      const isSelected = college.id === activeCollege?.id;
      const isBook = college.stream === 'book';

      const primaryColor = isBook ? '#e5472a' : '#bc8611';
      const badgeBg = isBook ? 'bg-[var(--accent)]' : 'bg-amber-500';
      const borderGlow = isSelected
        ? `border-white ring-4 ${isBook ? 'ring-[var(--accent)]/70' : 'ring-amber-500/70'} scale-110`
        : `border-white/90 ${isBook ? 'hover:ring-[var(--accent)]/50' : 'hover:ring-amber-400/50'} hover:scale-105`;

      const pinHtml = `
        <div class="relative flex flex-col items-center group cursor-pointer transition-all duration-200 ${isSelected ? 'z-50' : 'z-20'}">
          ${
            isSelected
              ? `<span class="absolute -top-1 -left-1 w-8 h-8 rounded-full ${badgeBg} animate-ping opacity-75"></span>`
              : ''
          }
          
          <div class="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full ${badgeBg} text-white shadow-xl flex items-center justify-center border-2 ${borderGlow} transition-transform">
            ${
              isBook
                ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`
                : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`
            }
          </div>

          <div class="w-1.5 h-1.5 bg-white rotate-45 -mt-0.5 shadow-sm"></div>

          <div class="mt-0.5 px-1.5 py-0.5 rounded-md text-[9.5px] font-bold tracking-tight whitespace-nowrap shadow-md border transition-all ${
            isSelected
              ? `${isBook ? 'bg-ink-950/95 border-[var(--accent)] text-white' : 'bg-amber-950/95 border-amber-500 text-amber-200'} scale-105`
              : 'bg-ink-900/90 border-[var(--plate-line-strong)] text-[var(--on-ink)] group-hover:bg-ink-800'
          }">
            <span class="mr-0.5">${isBook ? '📚' : '🛍️'}</span>${college.shortName}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'campus-pin-wrapper',
        html: pinHtml,
        iconSize: [110, 48],
        iconAnchor: [55, 24]
      });

      const marker = L.marker([college.lat, college.lng], {
        icon: customIcon,
        riseOnHover: true,
        zIndexOffset: isSelected ? 1000 : 100
      }).addTo(map);

      const popupHtml = `
        <div style="font-family: sans-serif; color: #fff; background: #191510; padding: 12px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.15); min-width: 220px;">
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
            <span style="font-size:10px; font-weight:700; text-transform:uppercase; padding:2px 6px; border-radius:6px; background:${primaryColor}22; color:${primaryColor}; border:1px solid ${primaryColor}55;">
              ${isBook ? '📚 书籍专区校区' : '🛍️ 二手物品校区'}
            </span>
          </div>
          <div style="font-weight:700; font-size:13px; color:#fff; margin-bottom:3px; line-height:1.2;">
            ${college.name}
          </div>
          <div style="font-size:11px; color:#86868b; margin-bottom:8px;">
            📍 ${college.city} · ${college.district}
          </div>
          <div style="font-size:11px; color:#1f4fa0; background:rgba(31,79,160,0.1); padding:4px 8px; border-radius:6px; margin-bottom:8px; border:1px solid rgba(31,79,160,0.2);">
            ⚡ 交接时间：<b>${college.avgMeetupTime}</b>
          </div>
          <button id="popup-select-${college.id}" style="width:100%; cursor:pointer; background:${primaryColor}; color:#fff; font-weight:700; font-size:11px; padding:6px 10px; border-radius:8px; border:none;">
            🎯 设为当前校区
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'campus-map-popup',
        closeButton: true,
        offset: [0, -16]
      });

      marker.on('click', () => {
        setActiveCollegeId(college.id);
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-select-${college.id}`);
        if (btn) {
          btn.onclick = () => {
            if (onSelectCampus) onSelectCampus(college);
            onClose();
          };
        }
      });

      markersRef.current[college.id] = marker;
    });
  }, [isOpen, filteredColleges, activeCollege, onSelectCampus, onClose]);

  // Center on Active College when selected
  const focusOnCollege = (college) => {
    setActiveCollegeId(college.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([college.lat, college.lng], 14, { duration: 0.9 });
      const marker = markersRef.current[college.id];
      if (marker) {
        setTimeout(() => marker.openPopup(), 350);
      }
    }
  };

  // Sleek, compact zoom handlers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleResetCampusView = () => {
    setSelectedZone('all');
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(CAMPUS_MAP_CONFIG.center, CAMPUS_MAP_CONFIG.defaultZoom, {
        animate: true,
        duration: 0.8
      });
    }
  };

  // Zone selection with automatic campus focusing & flyTo
  const handleZoneSelect = (zoneId) => {
    setSelectedZone(zoneId);

    const collegesInZone = HENU_CAMPUSES.filter((c) => {
      const matchesStream = selectedStream === 'all' || c.stream === selectedStream;
      return (zoneId === 'all' || c.zoneId === zoneId) && matchesStream;
    });

    if (collegesInZone.length > 0) {
      setActiveCollegeId(collegesInZone[0].id);
    }

    const zoneObj = CAMPUS_ZONES.find((z) => z.id === zoneId);
    if (zoneObj && mapInstanceRef.current) {
      if (zoneId === 'all') {
        mapInstanceRef.current.setView(CAMPUS_MAP_CONFIG.center, CAMPUS_MAP_CONFIG.defaultZoom, {
          animate: true,
          duration: 0.8
        });
      } else {
        mapInstanceRef.current.flyTo(zoneObj.center, zoneObj.zoom, { duration: 1.0 });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="on-ink fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-ink-950/85 backdrop-blur-md animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-label="河南大学校区地图">
      <div className="hero-light animate-scale-in relative w-full max-w-6xl h-[94vh] max-h-[900px] bg-ink-950 border border-[var(--plate-line)] rounded-panel shadow-float flex flex-col min-h-0 overflow-hidden text-white font-sans">
        
        {/* =========================================================================
            HEADER BAR
           ========================================================================= */}
        <div className="px-5 py-3 border-b border-[var(--plate-line)] flex items-center justify-between bg-[var(--plate-fill-faint)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[rgba(229,71,42,0.12)] border border-[rgba(229,71,42,0.3)] flex items-center justify-center text-[var(--accent)] flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                <line x1="8" y1="2" x2="8" y2="18"></line>
                <line x1="16" y1="6" x2="16" y2="22"></line>
              </svg>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="display-3 text-white">
                  河南大学校区地图
                </h2>
                <span className="eyebrow hidden sm:inline-block px-2 py-0.5 rounded-full text-[11px] bg-[rgba(229,71,42,0.15)] text-[var(--accent)] border border-[rgba(229,71,42,0.3)]">
                  金明校区 • 明伦校区
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[var(--on-ink)]">
                查看校区位置和建议交接点，具体时间地点请通过站内沟通确认。
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--plate-fill-strong)] hover:bg-[var(--plate-fill-stronger)] text-[var(--on-ink)] hover:text-white active:scale-90 focus-visible:ring-2 focus-visible:ring-[var(--accent)] flex items-center justify-center transition border border-[var(--plate-line)] cursor-pointer flex-shrink-0"
            title="关闭地图 (Esc)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* =========================================================================
            DUAL DELIVERY BANNER
           ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 px-5 py-2 bg-[var(--plate-fill-faint)] border-b border-[var(--plate-line)] text-xs flex-shrink-0">
          <div 
            onClick={() => setSelectedDeliveryMode('in-campus')}
            className={`p-2 rounded-xl border transition-all cursor-pointer active:scale-[0.99] flex items-center gap-2.5 ${
              selectedDeliveryMode === 'in-campus'
                ? 'bg-[rgba(229,71,42,0.12)] border-[var(--accent)] shadow-sm'
                : 'bg-[var(--plate-fill-faint)] border-[var(--plate-line)] hover:border-[var(--plate-line-strong)]'
            }`}
          >
            <div className="w-6 h-6 rounded-lg bg-[rgba(229,71,42,0.16)] text-[var(--accent)] flex items-center justify-center flex-shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-white text-[11px]">校内当面交接</span>
                <span className="bg-[rgba(229,71,42,0.15)] text-[var(--accent)] border border-[rgba(229,71,42,0.3)] font-mono text-[9px] px-1 rounded font-bold uppercase">
                  双方协商
                </span>
                <span className="text-[var(--meta)] text-[11px]">按约定时间</span>
              </div>
            </div>
          </div>

          <div 
            onClick={() => setSelectedDeliveryMode('out-of-campus')}
            className={`p-2 rounded-xl border transition-all cursor-pointer active:scale-[0.99] flex items-center gap-2.5 ${
              selectedDeliveryMode === 'out-of-campus'
                ? 'bg-amber-950/30 border-amber-500/50 shadow-sm shadow-amber-950/30'
                : 'bg-[var(--plate-fill-faint)] border-[var(--plate-line)] hover:border-[var(--plate-line-strong)]'
            }`}
          >
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-white text-[11px]">跑腿互助</span>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[9px] px-1 rounded font-bold uppercase">
                  校内同学接单
                </span>
                <span className="text-[var(--meta)] text-[11px]">按双方约定</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            STREAM TABS & SEARCH BAR
           ========================================================================= */}
        <div className="px-5 py-2.5 bg-ink-950/40 border-b border-[var(--plate-line)] flex flex-wrap items-center justify-between gap-2.5 text-xs flex-shrink-0">
          <div className="flex items-center gap-1.5 bg-ink-900/80 p-1 rounded-xl border border-[var(--plate-line)]">
            {CAMPUS_STREAMS.map((s) => {
              const active = selectedStream === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedStream(s.id)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all text-[11px] cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                    active
                      ? s.id === 'book'
                        ? 'bg-[var(--accent)] text-white shadow-sm'
                        : s.id === 'goods'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-[var(--plate-fill-stronger)] text-white'
                      : 'text-[var(--meta)] hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--meta)] pointer-events-none"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索校区、城市或交接点..."
              className="w-full bg-ink-900/90 border border-[var(--plate-line)] hover:border-[var(--plate-line-stronger)] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-[var(--meta)] focus:outline-none focus:border-[var(--accent)] focus-visible:ring-4 focus-visible:ring-[rgba(229,71,42,0.35)] transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--meta)] hover:text-white active:scale-90 focus-visible:ring-2 focus-visible:ring-[var(--accent)] text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* =========================================================================
            PROMINENT ZONE SELECTOR (CHIPS + DROPDOWN SELECTOR)
           ========================================================================= */}
        <div className="px-5 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--plate-line)] bg-ink-950 flex-shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <span className="eyebrow text-[11px] text-[var(--meta)] mr-1 flex-shrink-0">
              校区筛选：
            </span>
            {CAMPUS_ZONES.map((zone) => {
              const isSelected = selectedZone === zone.id;
              return (
                <button
                  key={zone.id}
                  onClick={() => handleZoneSelect(zone.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--accent)] flex items-center gap-1.5 cursor-pointer border ${
                    isSelected
                      ? 'bg-[var(--accent)] text-white font-bold border-[var(--accent-hover)] shadow-md shadow-black/30'
                      : 'bg-[var(--plate-fill)] text-[var(--on-ink)] border-[var(--plate-line)] hover:text-white hover:bg-[var(--plate-fill-strong)]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: isSelected ? '#191510' : zone.color }}
                  ></span>
                  <span>{zone.short}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <select
              value={selectedZone}
              onChange={(e) => handleZoneSelect(e.target.value)}
              className="bg-ink-900 border border-[var(--plate-line-strong)] hover:border-[var(--plate-line-stronger)] text-[var(--on-ink)] text-[11px] font-medium rounded-lg px-2.5 py-1 focus:outline-none focus:border-[var(--accent)] focus-visible:ring-4 focus-visible:ring-[rgba(229,71,42,0.35)] cursor-pointer"
            >
              {CAMPUS_ZONES.map((z) => (
                <option key={z.id} value={z.id} className="bg-ink-900 text-white">
                  {z.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* =========================================================================
            MAIN MAP CANVAS & INSPECTOR SPLIT
           ========================================================================= */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden relative">
          
          {/* REAL LEAFLET MAP CONTAINER */}
          <div className="relative flex-1 min-h-[260px] h-full bg-ink-950 overflow-hidden">
            
            {/* The Actual Leaflet Canvas Div */}
            <div
              ref={mapContainerRef}
              className="w-full h-full z-0 cursor-grab active:cursor-grabbing"
              style={{ background: '#000000' }}
            />

            {/* COMPACT, SLEEK ZOOM (+ / -) & RE-CENTER CONTROLS */}
            <div className="absolute top-3 left-3 z-30 flex flex-col gap-1.5">
              <div className="glass-dark rounded-xl shadow-panel flex flex-col overflow-hidden">
                <button
                  onClick={handleZoomIn}
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-white hover:bg-[rgba(229,71,42,0.22)] hover:text-[var(--accent)] active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition text-base font-bold cursor-pointer border-b border-[var(--plate-line)]"
                  title="放大 (+)"
                >
                  +
                </button>
                <button
                  onClick={handleZoomOut}
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-white hover:bg-[rgba(229,71,42,0.22)] hover:text-[var(--accent)] active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition text-base font-bold cursor-pointer"
                  title="缩小 (-)"
                >
                  &minus;
                </button>
              </div>

              <button
                onClick={handleResetCampusView}
                className="glass-dark hover:bg-ink-800 px-2.5 py-1 rounded-xl text-[var(--on-ink)] hover:text-white text-[10.5px] font-semibold shadow-md flex items-center gap-1 transition cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                title="查看全部校区"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[var(--accent)]">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>全览校区</span>
              </button>
            </div>

            {/* TOP RIGHT: MAP STYLE TOGGLE & PIN COUNT */}
            <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
              <div className="glass-dark rounded-xl p-0.5 flex items-center text-[11px] font-semibold shadow-md">
                <button
                  onClick={() => setMapStyle('dark')}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                    mapStyle === 'dark' ? 'bg-[rgba(229,71,42,0.25)] text-[var(--accent)] border border-[rgba(229,71,42,0.4)]' : 'text-[var(--meta)] hover:text-white'
                  }`}
                >
                  🌙 深色
                </button>
                <button
                  onClick={() => setMapStyle('street')}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                    mapStyle === 'street' ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' : 'text-[var(--meta)] hover:text-white'
                  }`}
                >
                  🗺️ 街道
                </button>
              </div>

              <div className="glass-dark px-2.5 py-1 rounded-xl text-[var(--accent)] text-[10.5px] font-mono font-bold shadow-md hidden sm:flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success-400 text-success-400 animate-pulse"></span>
                <span className="price">{filteredColleges.length} 个校区</span>
              </div>
            </div>

            {/* BOTTOM MAP LEGEND */}
            <div className="absolute bottom-3 left-3 z-30 glass-dark px-2.5 py-1.5 rounded-xl shadow-md flex items-center gap-2.5 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] border border-white shadow-sm"></span>
                <span className="text-[var(--on-ink)] font-semibold">书籍专区校区</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white shadow-sm"></span>
                <span className="text-[var(--on-ink)] font-semibold">二手物品校区</span>
              </div>
              <div className="hidden sm:flex items-center gap-1 pl-1.5 border-l border-[var(--plate-line)] text-[var(--meta)] text-[9.5px]">
                <span>点击图钉查看详情</span>
              </div>
            </div>

          </div>

          {/* =========================================================================
              SIDEBAR INSPECTOR WITH VISIBLE SLIDING BAR & PINNED ACTION BUTTON
             ========================================================================= */}
          <div className="w-full lg:w-96 bg-ink-950 border-t lg:border-t-0 lg:border-l border-[var(--plate-line)] flex flex-col flex-shrink-0 min-h-0 overflow-hidden">
            
            {/* Sidebar Top Header */}
            <div className="px-4 py-2.5 border-b border-[var(--plate-line)] bg-[var(--plate-fill-faint)] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success-400 text-success-400 animate-pulse"></span>
                <span className="eyebrow text-[11px] font-mono text-white">
                  校区与交接点
                </span>
              </div>
              <span className="price text-[11px] font-mono text-[var(--meta)] bg-[var(--plate-fill)] px-2 py-0.5 rounded-full border border-[var(--plate-line)]">
                {filteredColleges.length} 个在列
              </span>
            </div>

            {/* SCROLLABLE BODY WITH SLIDING BAR */}
            <div className="flex-1 min-h-0 overflow-y-auto campus-sliding-bar p-3.5 space-y-3.5">
              
              {/* Active Selected Campus Details */}
              {activeCollege && (
                <div className="plate-dark space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase border ${
                      activeCollege.stream === 'book'
                        ? 'bg-[rgba(229,71,42,0.16)] text-[var(--accent)] border-[rgba(229,71,42,0.4)]'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {activeCollege.stream === 'book' ? '📚 书籍专区校区' : '🛍️ 二手物品校区'}
                    </span>
                    <span className="text-[11px] font-mono text-[var(--meta)]">
                      {activeCollege.district}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-white text-base leading-snug">
                      {activeCollege.name}
                    </h3>
                    <p className="text-xs text-[var(--on-ink)] mt-0.5">
                      📍 {activeCollege.city} · {activeCollege.district}
                    </p>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-ink-900/90 p-2.5 rounded-xl border border-[var(--plate-line)]">
                      <span className="text-[9px] text-[var(--meta)] block font-mono uppercase">约定交接</span>
                      <span className="tnum text-xs font-bold text-[var(--accent)] flex items-center gap-1 mt-0.5">
                        ⚡ {activeCollege.avgMeetupTime}
                      </span>
                    </div>
                    <div className="bg-ink-900/90 p-2.5 rounded-xl border border-[var(--plate-line)]">
                      <span className="text-[9px] text-[var(--meta)] block font-mono uppercase">建议交接点</span>
                      <span className="text-xs font-bold text-[var(--accent)] flex items-center gap-1 mt-0.5">
                        📍 {activeCollege.primaryPickup}
                      </span>
                    </div>
                  </div>

                  {/* Safe Pickup Points */}
                  <div className="bg-ink-900/70 p-2.5 rounded-xl border border-[var(--plate-line)] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-[var(--meta)] uppercase font-bold">
                        建议交接点：
                      </span>
                      <span className="text-[9px] font-mono text-[var(--accent)] font-bold uppercase">公共区域</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {activeCollege.pickupPoints.map((spot, idx) => (
                        <span
                          key={idx}
                          className="bg-[var(--plate-fill)] border border-[var(--plate-line)] text-[var(--on-ink)] text-[11px] px-2 py-0.5 rounded-md"
                        >
                          ✓ {spot}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Campus Highlight Note */}
                  <p className="text-[10.5px] text-[var(--on-ink)] italic bg-[var(--plate-fill-faint)] p-2.5 rounded-xl border border-[var(--plate-line)] leading-relaxed">
                    "{activeCollege.highlight}"
                  </p>
                </div>
              )}

              {/* List of Campuses in View */}
              <div className="reveal space-y-2 pt-1">
                <div className="eyebrow flex items-center justify-between px-1 text-[10.5px] font-mono text-[var(--meta)]">
                  <span>
                    {selectedZone === 'all'
                      ? `全部校区（${filteredColleges.length}）`
                      : `当前校区（${filteredColleges.length}）`}
                  </span>
                  <span className="text-[9.5px] text-[var(--accent)]">点击查看</span>
                </div>

                <div className="overflow-hidden rounded-lg border border-[var(--plate-line)] divide-y divide-[var(--plate-line)]">
                  {filteredColleges.map((col) => {
                    const isSelected = col.id === activeCollege?.id;
                    const isBook = col.stream === 'book';
                    return (
                      <div
                        key={col.id}
                        onClick={() => focusOnCollege(col)}
                        className={`p-2.5 transition-colors cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? isBook
                              ? 'bg-[rgba(229,71,42,0.14)] text-white'
                              : 'bg-[rgba(255,159,10,0.14)] text-white'
                            : 'hover:bg-[var(--plate-fill-faint)] text-[var(--on-ink)]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white text-[11px] flex-shrink-0 ${
                            isBook ? 'bg-[var(--accent)]' : 'bg-amber-500'
                          }`}>
                            {isBook ? '📚' : '🛍️'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white text-xs truncate">
                              {col.shortName}
                            </div>
                            <div className="tnum text-[11px] text-[var(--meta)] truncate">
                              {col.city} · {col.avgMeetupTime}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isSelected && (
                            <span className="text-[9px] font-mono font-bold uppercase bg-[rgba(229,71,42,0.18)] text-[var(--accent)] border border-[rgba(229,71,42,0.35)] px-1.5 py-0.5 rounded">
                              当前
                            </span>
                          )}
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--meta)]">
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* PINNED ALWAYS-VISIBLE ACTION FOOTER (NEVER CUT OFF) */}
            {activeCollege && (
              <div className="p-3 border-t border-[var(--plate-line)] bg-ink-950 flex-shrink-0 shadow-2xl">
                <button
                  onClick={() => {
                    if (onSelectCampus) onSelectCampus(activeCollege);
                    onClose();
                  }}
                  className={`press w-full py-2.5 px-4 rounded-field font-bold text-xs shadow-lg transition-colors focus-visible:ring-4 focus-visible:ring-[rgba(229,71,42,0.35)] flex items-center justify-center gap-2 ${
                    activeCollege.stream === 'book'
                      ? 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)] text-white'
                      : 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-ink-950'
                  }`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>选择 {activeCollege.shortName}</span>
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
