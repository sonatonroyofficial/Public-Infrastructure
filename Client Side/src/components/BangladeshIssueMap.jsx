import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { mapAPI } from '../utils/api';
import { BANGLADESH_CENTER, DEFAULT_ZOOM, BANGLADESH_DISTRICTS, getDistrictInfo } from '../data/bangladeshDistrictsData';
import { FaMapMarkerAlt, FaCompress, FaExclamationTriangle, FaInfoCircle, FaShieldAlt, FaFilter } from 'react-icons/fa';
import { Link } from 'react-router-dom';

// Custom SVG Icon creator for Leaflet Markers color-coded by Severity
const createSeverityIcon = (severityLabel, isMyReport = false) => {
    let color = '#10b981'; // Low (emerald)
    if (severityLabel === 'Critical') color = '#e11d48'; // Critical (rose)
    else if (severityLabel === 'High') color = '#f97316'; // High (orange)
    else if (severityLabel === 'Medium') color = '#f59e0b'; // Medium (amber)

    const starBadge = isMyReport ? `
        <div style="
            position: absolute;
            top: -6px;
            right: -6px;
            background: #f59e0b;
            color: #ffffff;
            border-radius: 50%;
            width: 16px;
            height: 16px;
            font-size: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1.5px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.4);
        ">★</div>
    ` : '';

    const borderHalo = isMyReport ? `border: 2.5px solid #f59e0b; border-radius: 50%; background: rgba(245, 158, 11, 0.25);` : '';

    const svgHtml = `
        <div style="
            position: relative;
            width: 34px;
            height: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));
            ${borderHalo}
        ">
            ${starBadge}
            <svg viewBox="0 0 24 24" width="30" height="30" fill="${color}">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
        </div>
    `;

    return L.divIcon({
        html: svgHtml,
        className: 'custom-leaflet-marker',
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -30]
    });
};

// Map Controller Component for smooth programmatic pan & zoom
function MapViewController({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom, { duration: 1.2 });
        }
    }, [center, zoom, map]);
    return null;
}

// Relative time helper
function formatRelativeTime(dateString) {
    if (!dateString) return 'recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
}

/**
 * Shared Reusable Bangladesh Issue Map Component
 * 
 * @param {"public" | "citizen" | "admin"} mode Controls visibility & permissions
 * @param {Function} onDistrictClick Optional callback when district is selected
 * @param {Object} filters Optional filters { category, severity, status }
 * @param {Array<string>} myReportIds Optional array of report IDs submitted by current citizen
 */
const BangladeshIssueMap = ({ mode = "public", onDistrictClick, filters = {}, myReportIds = [] }) => {
    const [districtsStats, setDistrictsStats] = useState([]);
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [pinsData, setPinsData] = useState([]);
    const [loadingDistricts, setLoadingDistricts] = useState(true);
    const [loadingPins, setLoadingPins] = useState(false);
    const [mapCenter, setMapCenter] = useState(BANGLADESH_CENTER);
    const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);

    // Fetch District Aggregations on load or filter change
    useEffect(() => {
        fetchDistrictsData();
    }, [JSON.stringify(filters)]);

    // Fetch Pins when a district is selected
    useEffect(() => {
        if (selectedDistrict) {
            fetchPinsData(selectedDistrict);
        } else {
            setPinsData([]);
        }
    }, [selectedDistrict, JSON.stringify(filters)]);

    const fetchDistrictsData = async () => {
        setLoadingDistricts(true);
        try {
            const res = await mapAPI.getDistricts(filters);
            setDistrictsStats(res.data || []);
        } catch (err) {
            console.error('Error loading district map data:', err);
        } finally {
            setLoadingDistricts(false);
        }
    };

    const fetchPinsData = async (districtName) => {
        setLoadingPins(true);
        try {
            const res = await mapAPI.getPins({ district: districtName, ...filters });
            setPinsData(res.data || []);
        } catch (err) {
            console.error(`Error loading pins for ${districtName}:`, err);
        } finally {
            setLoadingPins(false);
        }
    };

    const handleDistrictSelect = (districtName) => {
        const distInfo = getDistrictInfo(districtName);
        setSelectedDistrict(districtName);

        if (distInfo) {
            setMapCenter(distInfo.center);
            setMapZoom(11);
        }

        if (onDistrictClick) {
            onDistrictClick(districtName);
        }
    };

    const handleResetMap = () => {
        setSelectedDistrict(null);
        setMapCenter(BANGLADESH_CENTER);
        setMapZoom(DEFAULT_ZOOM);
    };

    // Calculate maximum issues for heat scale
    const maxIssuesCount = Math.max(...districtsStats.map(d => d.totalIssues || 0), 1);

    // Color gradient calculator for district circle heat map
    const getCircleStyle = (count) => {
        if (!count || count === 0) {
            return { color: '#94a3b8', fillColor: '#cbd5e1', fillOpacity: 0.2, weight: 1.5 };
        }
        const ratio = count / maxIssuesCount;
        if (ratio > 0.6) return { color: '#e11d48', fillColor: '#e11d48', fillOpacity: 0.65, weight: 2.5 };
        if (ratio > 0.3) return { color: '#8b5cf6', fillColor: '#8b5cf6', fillOpacity: 0.55, weight: 2 };
        return { color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.45, weight: 1.5 };
    };

    return (
        <div className="relative w-full h-[600px] rounded-2xl overflow-hidden border border-gray-200 shadow-xl bg-gray-900 font-sans">
            {/* Top Bar Overlay Controls */}
            <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
                <div className="flex items-center gap-2 pointer-events-auto">
                    {selectedDistrict ? (
                        <button
                            onClick={handleResetMap}
                            className="bg-white/90 hover:bg-white text-gray-900 font-bold px-4 py-2 rounded-xl shadow-lg border border-gray-200/80 backdrop-blur-md flex items-center gap-2 text-sm transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                        >
                            <FaCompress className="text-blue-600" />
                            <span>← Full Bangladesh Map</span>
                        </button>
                    ) : (
                        <div className="bg-gray-900/85 backdrop-blur-md text-white px-4 py-2 rounded-xl border border-gray-700/80 shadow-lg text-sm font-semibold flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                            <span>Live Bangladesh Map</span>
                        </div>
                    )}

                    {selectedDistrict && (
                        <div className="bg-blue-600 text-white font-bold px-3.5 py-2 rounded-xl shadow-lg text-xs tracking-wide uppercase flex items-center gap-1.5">
                            <FaMapMarkerAlt /> {selectedDistrict} District
                        </div>
                    )}
                </div>

                {/* Legend & Filter Badge */}
                <div className="flex items-center gap-2 pointer-events-auto bg-gray-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-gray-700/80 text-xs text-gray-200">
                    <span className="font-semibold text-gray-400">Severity:</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Critical</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> High</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Medium</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Low</span>
                </div>
            </div>

            {/* Loading Spinner Overlay */}
            {(loadingDistricts || loadingPins) && (
                <div className="absolute inset-0 z-[1001] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                    <div className="bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-gray-700 flex items-center gap-3 font-semibold text-sm animate-bounce">
                        <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading Map Data...
                    </div>
                </div>
            )}

            {/* Leaflet Map Container */}
            <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                scrollWheelZoom={true}
                className="w-full h-full"
                zoomControl={false}
            >
                <MapViewController center={mapCenter} zoom={mapZoom} />

                {/* OpenStreetMap Dark Carto Tile Layer for modern visual contrast */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                {/* Render District Choropleth Circles */}
                {!selectedDistrict && BANGLADESH_DISTRICTS.map((dist) => {
                    const stats = districtsStats.find(s => s.district?.toLowerCase() === dist.name.toLowerCase());
                    const issueCount = stats ? stats.totalIssues : 0;
                    const circleStyle = getCircleStyle(issueCount);

                    return (
                        <Circle
                            key={dist.name}
                            center={dist.center}
                            radius={dist.radiusMeters}
                            pathOptions={circleStyle}
                            eventHandlers={{
                                click: () => handleDistrictSelect(dist.name)
                            }}
                        >
                            <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                                <div className="p-2 font-sans text-xs space-y-1.5 min-w-[160px]">
                                    <div className="font-bold text-sm text-gray-900 border-b pb-1 flex items-center justify-between">
                                        <span>{dist.name} District</span>
                                        <span className="text-[10px] text-gray-400 font-normal">{dist.division}</span>
                                    </div>
                                    <div className="flex justify-between items-center font-medium">
                                        <span className="text-gray-600">Total Issues:</span>
                                        <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{issueCount}</span>
                                    </div>
                                    {stats && (
                                        <>
                                            <div className="flex justify-between items-center font-medium text-gray-600">
                                                <span>Avg Severity:</span>
                                                <span className="font-bold text-amber-600">{stats.avgSeverityScore}/10</span>
                                            </div>
                                            <div className="pt-1 border-t border-gray-100 flex gap-1 justify-between text-[10px] font-bold">
                                                <span className="text-rose-600">{stats.bySeverity?.Critical || 0} Critical</span>
                                                <span className="text-orange-500">{stats.bySeverity?.High || 0} High</span>
                                                <span className="text-amber-500">{stats.bySeverity?.Medium || 0} Med</span>
                                                <span className="text-emerald-600">{stats.bySeverity?.Low || 0} Low</span>
                                            </div>
                                        </>
                                    )}
                                    <div className="text-[10px] text-blue-500 font-semibold italic text-center pt-1">
                                        Click to zoom & view report pins →
                                    </div>
                                </div>
                            </Tooltip>
                        </Circle>
                    );
                })}

                {/* Render Individual Report Pin Markers when Zoomed into a District */}
                {selectedDistrict && pinsData.map((pin) => {
                    const isMyReport = myReportIds && Array.isArray(myReportIds) && myReportIds.includes(pin.id);

                    return (
                        <Marker
                            key={pin.id}
                            position={[pin.latitude, pin.longitude]}
                            icon={createSeverityIcon(pin.severityLabel, isMyReport)}
                        >
                            <Popup>
                                <div className="p-1 font-sans text-xs max-w-[240px] space-y-2">
                                    <div className="flex items-center justify-between gap-2 border-b pb-1.5">
                                        <div className="flex items-center gap-1">
                                            <span className="font-mono text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                                #{pin.trackingCode}
                                            </span>
                                            {isMyReport && (
                                                <span className="bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide">
                                                    ★ My Report
                                                </span>
                                            )}
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border
                                            ${pin.severityLabel === 'Critical' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                                              pin.severityLabel === 'High' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                              pin.severityLabel === 'Medium' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                              'bg-emerald-100 text-emerald-800 border-emerald-200'}`}>
                                            {pin.severityLabel}
                                        </span>
                                    </div>

                                <div>
                                    <h4 className="font-bold text-sm text-gray-900 leading-snug">
                                        {pin.specificIssueLabel || pin.aiCategory}
                                    </h4>
                                    {(pin.duplicateStatus === 'possible_duplicate' || pin.duplicateStatus === 'confirmed_duplicate') && (
                                        <div className="mt-1">
                                            <span className="bg-purple-50 text-purple-700 border border-purple-200 font-bold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                                                🔗 Duplicate Report
                                            </span>
                                        </div>
                                    )}
                                    <p className="text-gray-600 text-xs mt-1 line-clamp-2 italic">
                                        "{pin.aiSummaryEn || pin.title}"
                                    </p>
                                </div>

                                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                                    <span>{formatRelativeTime(pin.submittedAt)}</span>
                                    <span className="capitalize font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                        {pin.status}
                                    </span>
                                </div>

                                <div className="pt-1">
                                    <Link
                                        to={`/issues/${pin.id}`}
                                        className="block text-center w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition-colors"
                                    >
                                        View Full Report Details →
                                    </Link>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                    );
                })}
            </MapContainer>

            {/* Empty State Banner if selected district has 0 pins */}
            {selectedDistrict && !loadingPins && pinsData.length === 0 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-gray-900/90 text-white px-6 py-3 rounded-2xl shadow-2xl border border-gray-700 flex items-center gap-3 backdrop-blur-md">
                    <FaInfoCircle className="text-amber-400 text-lg flex-shrink-0" />
                    <span className="text-sm font-semibold">No active issues reported in {selectedDistrict} district yet.</span>
                </div>
            )}
        </div>
    );
};

export default BangladeshIssueMap;
