import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { PropertySummary } from '../../types';
import { formatPrice } from '../../lib/utils';

interface PropertyMapProps {
  properties: PropertySummary[];
  selectedProperty?: PropertySummary | null;
  onSelectProperty?: (property: PropertySummary) => void;
  onBoundsChange?: (bbox: { north: number; south: number; east: number; west: number }) => void;
  center?: [number, number];
  zoom?: number;
}

export default function PropertyMap({
  properties,
  selectedProperty,
  onSelectProperty,
  onBoundsChange,
  center = [77.5946, 12.9716], // Bangalore default [lng, lat]
  zoom = 11,
}: PropertyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Initialize Map
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

      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

      let debounceTimer: NodeJS.Timeout;
      map.current.on('moveend', () => {
        if (!map.current || !onBoundsChange) return;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if (!map.current) return;
          const bounds = map.current.getBounds();
          onBoundsChange({
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
          });
        }, 400);
      });
    } catch (err) {
      console.warn('MapLibre GL failed to initialize:', err);
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update Markers
  useEffect(() => {
    if (!map.current) return;

    // Clear previous markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    properties.forEach((property) => {
      if (property.longitude == null || property.latitude == null) return;

      const isSelected = selectedProperty?.id === property.id;

      // Custom marker DOM element
      const el = document.createElement('div');
      el.className = `cursor-pointer transition-transform duration-200 transform hover:scale-110 ${
        isSelected ? 'scale-110 z-30' : 'z-10'
      }`;
      el.innerHTML = `
        <div class="px-2 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1 border ${
          isSelected
            ? 'bg-estate-900 text-white border-white ring-2 ring-primary-500'
            : 'bg-white text-estate-900 border-estate-300 hover:border-primary-500'
        }">
          <span>${formatPrice(Number(property.asking_price))}</span>
        </div>
      `;

      el.addEventListener('click', () => {
        onSelectProperty?.(property);
      });

      const popup = new maplibregl.Popup({ offset: 25, closeButton: false }).setHTML(`
        <div class="p-2 max-w-[200px] text-left">
          <img src="${property.cover_image_url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80'}" class="w-full h-24 object-cover rounded-md mb-1.5" />
          <h4 class="font-bold text-xs text-estate-900 line-clamp-1">${property.title}</h4>
          <p class="text-[11px] text-estate-500">${[property.locality, property.city].filter(Boolean).join(', ')}</p>
          <p class="text-xs font-bold text-primary-600 mt-1">${formatPrice(Number(property.asking_price))}</p>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([property.longitude, property.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Auto-fit bounds if we have properties and no active selected property
    if (properties.length > 0 && !selectedProperty && map.current) {
      const bounds = new maplibregl.LngLatBounds();
      let hasValidCoords = false;
      properties.forEach((p) => {
        if (p.longitude != null && p.latitude != null) {
          bounds.extend([p.longitude, p.latitude]);
          hasValidCoords = true;
        }
      });
      if (hasValidCoords) {
        map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
      }
    }
  }, [properties, selectedProperty]);

  // Center on selected property
  useEffect(() => {
    if (selectedProperty && map.current && selectedProperty.longitude && selectedProperty.latitude) {
      map.current.flyTo({
        center: [selectedProperty.longitude, selectedProperty.latitude],
        zoom: 14,
        essential: true,
      });
    }
  }, [selectedProperty]);

  return (
    <div className="relative w-full h-full min-h-[350px] rounded-xl overflow-hidden shadow-inner border border-estate-200">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
