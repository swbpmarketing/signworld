import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';

// Import leaflet CSS
import 'leaflet/dist/leaflet.css';

// Import marker images for Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Delete default icon settings
delete (L.Icon.Default.prototype as any)._getIconUrl;

// Set new default icon options
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface Location {
  id: string | number;
  name: string;
  owner: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  rating: number;
  reviews: number;
  distance: number | null;
  services: string[];
  hours: {
    open: string;
    close: string;
  };
  isOpen: boolean;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface MapViewProps {
  locations: Location[];
  selectedLocation: Location | null;
  onLocationSelect: (location: Location) => void;
  className?: string;
  userLocation?: { lat: number; lng: number } | null;
}

// Component to handle map updates when selected location changes
const MapUpdater = ({
  selectedLocation,
  userLocation,
  locations
}: {
  selectedLocation: Location | null;
  userLocation?: { lat: number; lng: number } | null;
  locations: Location[];
}) => {
  const map = useMap();

  useEffect(() => {
    if (selectedLocation && selectedLocation.coordinates.lat !== 0) {
      map.setView([selectedLocation.coordinates.lat, selectedLocation.coordinates.lng], 14, {
        animate: true,
        duration: 0.5
      });
    } else if (userLocation) {
      // Fit bounds to include user location and all markers
      const bounds = L.latLngBounds([[userLocation.lat, userLocation.lng]]);
      locations.forEach(loc => {
        if (loc.coordinates.lat !== 0 && loc.coordinates.lng !== 0) {
          bounds.extend([loc.coordinates.lat, loc.coordinates.lng]);
        }
      });
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [selectedLocation, userLocation, locations, map]);

  return null;
};

// Custom marker icon for open locations
const openIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom marker icon for closed locations
const closedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom marker icon for selected location
const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom marker icon for user location
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MapView = ({ locations, selectedLocation, onLocationSelect, className = '', userLocation }: MapViewProps) => {
  const mapRef = useRef<L.Map | null>(null);

  // Calculate center point from user location or all locations
  const calculateCenter = () => {
    if (userLocation) {
      return { lat: userLocation.lat, lng: userLocation.lng };
    }

    const validLocations = locations.filter(loc => loc.coordinates.lat !== 0 && loc.coordinates.lng !== 0);

    if (validLocations.length === 0) return { lat: 33.4484, lng: -112.0740 }; // Default to Phoenix, AZ

    const avgLat = validLocations.reduce((sum, loc) => sum + loc.coordinates.lat, 0) / validLocations.length;
    const avgLng = validLocations.reduce((sum, loc) => sum + loc.coordinates.lng, 0) / validLocations.length;

    return { lat: avgLat, lng: avgLng };
  };

  const center = calculateCenter();

  const getMarkerIcon = (location: Location) => {
    if (selectedLocation?.id === location.id) return selectedIcon;
    if (location.isOpen) return openIcon;
    return closedIcon;
  };

  // Filter out locations with invalid coordinates
  const validLocations = locations.filter(loc =>
    loc.coordinates.lat !== 0 && loc.coordinates.lng !== 0
  );

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={userLocation ? 10 : 11}
        ref={mapRef}
        className="h-full w-full"
        style={{ minHeight: '600px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater
          selectedLocation={selectedLocation}
          userLocation={userLocation}
          locations={validLocations}
        />

        {/* User Location Marker */}
        {userLocation && (
          <>
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userIcon}
            >
              <Popup>
                <div className="p-2">
                  <h4 className="font-semibold text-gray-900 mb-1">Your Location</h4>
                  <p className="text-sm text-gray-600">You are here</p>
                </div>
              </Popup>
            </Marker>
            {/* Circle to show approximate search area */}
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={500} // Small radius to show user position
              pathOptions={{
                color: '#8b5cf6',
                fillColor: '#8b5cf6',
                fillOpacity: 0.1,
              }}
            />
          </>
        )}

        {validLocations.map((location) => (
          <Marker
            key={location.id}
            position={[location.coordinates.lat, location.coordinates.lng]}
            icon={getMarkerIcon(location)}
            eventHandlers={{
              click: () => onLocationSelect(location)
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h4 className="font-semibold text-gray-900 mb-1">{location.name}</h4>
                <p className="text-sm text-gray-600 mb-1">{location.owner}</p>
                <p className="text-xs text-gray-500 mb-2">
                  {location.address}<br />
                  {location.city}, {location.state} {location.zipCode}
                </p>
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    location.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {location.isOpen ? 'Open' : 'Closed'}
                  </span>
                  {location.distance !== null && (
                    <span className="text-sm font-medium text-primary-600">{location.distance} mi</span>
                  )}
                </div>
                <div className="flex items-center mb-2">
                  <span className="text-yellow-400 mr-1">&#9733;</span>
                  <span className="text-sm font-medium">{location.rating.toFixed(1)}</span>
                  <span className="text-xs text-gray-500 ml-1">({location.reviews} reviews)</span>
                </div>
                <button
                  onClick={() => onLocationSelect(location)}
                  className="w-full text-xs bg-primary-600 text-white py-1 px-2 rounded hover:bg-primary-700 transition-colors"
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
