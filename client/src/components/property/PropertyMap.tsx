import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { PropertySummary } from '../../types';
import { formatPrice } from '../../lib/utils';
import { Search, Crosshair, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface PropertyMapProps {
  properties: PropertySummary[];
  selectedProperty?: PropertySummary | null;
  onSelectProperty?: (property: PropertySummary) => void;
  onBoundsChange?: (bbox: { north: number; south: number; east: number; west: number }) => void;
  center?: [number, number];
  zoom?: number;
  onLocateMe?: (coords: { lat: number; lng: number }) => void;
  onCitySelect?: (cityName: string) => void;
}

export const METRO_HUBS = [
  { name: 'Bengaluru', center: [77.5946, 12.9716] as [number, number], zoom: 12 },
  { name: 'Mumbai', center: [72.8477, 19.0760] as [number, number], zoom: 12 },
  { name: 'Delhi NCR', center: [77.0984, 28.4682] as [number, number], zoom: 11 },
  { name: 'Hyderabad', center: [78.3752, 17.4399] as [number, number], zoom: 12 },
  { name: 'Chennai', center: [80.2435, 13.0163] as [number, number], zoom: 12 },
];

export default function PropertyMap({
  properties,
  selectedProperty,
  onSelectProperty,
  onBoundsChange,
  center = [77.5946, 12.9716], // Default Bengaluru [lng, lat]
  zoom = 12,
  onLocateMe,
  onCitySelect,
}: PropertyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const [hasMapMoved, setHasMapMoved] = useState(false);
  const [isSearchingArea, setIsSearchingArea] = useState(false);
  const [activeMetro, setActiveMetro] = useState<string | null>(null);

  // Manual trigger search for current visible bounds
  const triggerBoundsSearch = useCallback(() => {
    if (!map.current || !onBoundsChange) return;
    const bounds = map.current.getBounds();
    setIsSearchingArea(true);
    onBoundsChange({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    });
    setHasMapMoved(false);
    setTimeout(() => setIsSearchingArea(false), 300);
  }, [onBoundsChange]);

  // Initialize Map once
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            'osm-tiles': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '&copy; OpenStreetMap contributors',
            },
          },
          layers: [
            {
              id: 'osm-tiles',
              type: 'raster',
              source: 'osm-tiles',
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        },
        center: center,
        zoom: zoom,
      });

      map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

      map.current.on('dragend', () => {
        setHasMapMoved(true);
      });
      map.current.on('zoomend', () => {
        setHasMapMoved(true);
      });
    } catch (err) {
      console.warn('MapLibre GL failed to initialize:', err);
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update center when center prop changes (explicit user location change)
  useEffect(() => {
    if (map.current && center) {
      map.current.flyTo({
        center,
        zoom: zoom || 12,
        essential: true,
      });
      setHasMapMoved(false);
    }
  }, [center?.[0], center?.[1], zoom]);

  // Update Markers on map without moving camera
  useEffect(() => {
    if (!map.current) return;

    // Clear previous markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    properties.forEach((property) => {
      if (property.longitude == null || property.latitude == null) return;

      const isSelected = selectedProperty?.id === property.id;

      const el = document.createElement('div');
      el.className = `cursor-pointer transition-all duration-200 transform hover:scale-110 ${
        isSelected ? 'scale-110 z-30' : 'z-10'
      }`;
      el.innerHTML = `
        <div class="px-2.5 py-1 rounded-full text-xs font-extrabold shadow-lg flex items-center gap-1 border transition-all ${
          isSelected
            ? 'bg-primary-600 text-white border-white ring-2 ring-primary-400 shadow-primary-500/30'
            : 'bg-white text-estate-900 border-estate-300 hover:border-primary-600 hover:bg-primary-50'
        }">
          <span>${formatPrice(Number(property.asking_price))}</span>
        </div>
      `;

      el.addEventListener('click', () => {
        onSelectProperty?.(property);
      });

      const popup = new maplibregl.Popup({ offset: 25, closeButton: false }).setHTML(`
        <div class="p-2 max-w-[220px] text-left">
          <img src="${property.cover_image_url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80'}" class="w-full h-24 object-cover rounded-lg mb-1.5" />
          <h4 class="font-bold text-xs text-estate-900 line-clamp-1">${property.title}</h4>
          <p class="text-[11px] text-estate-500 mt-0.5">${[property.locality, property.city].filter(Boolean).join(', ')}</p>
          <div class="flex items-center justify-between mt-2 pt-1.5 border-t border-estate-100">
            <span class="text-xs font-extrabold text-primary-700">${formatPrice(Number(property.asking_price))}</span>
            <a href="/properties/${property.id}" class="text-[11px] font-bold text-primary-600 hover:text-primary-800 underline">View ➔</a>
          </div>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([property.longitude, property.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [properties, selectedProperty]);

  // Smooth gentle pan when selectedProperty is clicked (no zoom change)
  useEffect(() => {
    if (selectedProperty && map.current && selectedProperty.longitude != null && selectedProperty.latitude != null) {
      map.current.easeTo({
        center: [selectedProperty.longitude, selectedProperty.latitude],
        duration: 500,
      });
    }
  }, [selectedProperty?.id]);

  // Jump to selected Metro
  const handleMetroJump = (metro: typeof METRO_HUBS[0]) => {
    if (!map.current) return;
    setActiveMetro(metro.name);
    map.current.flyTo({
      center: metro.center,
      zoom: metro.zoom,
      essential: true,
    });
    setHasMapMoved(false);
    onCitySelect?.(metro.name);
  };

  // Locate user with GPS
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    toast.info('Retrieving GPS location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!map.current) return;
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        map.current.flyTo({
          center: coords,
          zoom: 13,
          essential: true,
        });
        setHasMapMoved(false);
        toast.success('Centered on your location! Showing nearby properties.');
        onLocateMe?.({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        toast.error('Unable to retrieve location: ' + err.message);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden shadow-inner border border-estate-200 bg-estate-100">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Floating Top Controls: Metro Jump Pills */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center gap-1.5 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md px-2 py-1 rounded-xl shadow-md border border-estate-200 flex items-center gap-1 overflow-x-auto max-w-full">
          <MapPin className="w-3.5 h-3.5 text-primary-600 flex-shrink-0 ml-1" />
          <span className="text-[10px] font-bold uppercase text-estate-400 mr-1 flex-shrink-0">Jump:</span>
          {METRO_HUBS.map((metro) => (
            <button
              key={metro.name}
              type="button"
              onClick={() => handleMetroJump(metro)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeMetro === metro.name
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-estate-100 hover:bg-estate-200 text-estate-700'
              }`}
            >
              {metro.name}
            </button>
          ))}
        </div>
      </div>

      {/* Floating Action Button: Search This Area (Only visible when user dragged the map) */}
      {hasMapMoved && onBoundsChange && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={triggerBoundsSearch}
            disabled={isSearchingArea}
            className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl flex items-center gap-1.5 transition-all animate-in fade-in"
          >
            <Search className="w-3.5 h-3.5" />
            {isSearchingArea ? 'Searching...' : 'Search This Map Area'}
          </button>
        </div>
      )}

      {/* Locate Me Floating Button */}
      <div className="absolute bottom-24 right-3 z-20 pointer-events-auto">
        <button
          type="button"
          onClick={handleLocateMe}
          className="p-2.5 bg-white hover:bg-estate-50 text-estate-700 hover:text-primary-600 rounded-xl shadow-lg border border-estate-200 transition-all flex items-center justify-center gap-1 text-xs font-bold"
          title="Use My Current GPS Location"
        >
          <Crosshair className="w-4 h-4 text-primary-600" />
          <span className="hidden sm:inline">Near Me</span>
        </button>
      </div>
    </div>
  );
}
