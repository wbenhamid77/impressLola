export const GOOGLE_MAPS_CONFIG = {
  // Clé API Google Maps - vous devrez créer la vôtre
  // Plan gratuit : 28,500 requêtes/mois
  apiKey: 'AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg',
  
  // Configuration par défaut
  default: {
    center: { lat: 48.8566, lng: 2.3522 }, // Paris
    zoom: 12,
    mapTypeId: 'roadmap',
    minZoom: 3,
    maxZoom: 18
  },
  
  // Configuration pour la France
  france: {
    center: { lat: 46.603354, lng: 1.888334 }, // Centre de la France
    zoom: 6,
    bounds: {
      north: 51.0,
      south: 41.0,
      east: 10.0,
      west: -5.0
    }
  },
  
  // Configuration pour le Maroc
  morocco: {
    center: { lat: 31.7917, lng: -7.0926 }, // Centre du Maroc
    zoom: 6,
    bounds: {
      north: 36.0,
      south: 27.0,
      east: -1.0,
      west: -13.0
    }
  },
  
  // Styles de carte disponibles
  mapTypes: {
    roadmap: 'roadmap',
    satellite: 'satellite',
    hybrid: 'hybrid',
    terrain: 'terrain'
  },
  
  // Options de contrôle
  controls: {
    zoom: true,
    mapType: true,
    scale: true,
    streetView: true,
    rotate: true,
    fullscreen: true
  }
};

// Instructions pour obtenir une clé API Google Maps gratuite :
// 1. Aller sur https://console.cloud.google.com/
// 2. Créer un nouveau projet ou sélectionner un projet existant
// 3. Activer l'API Maps JavaScript
// 4. Aller dans "Credentials" > "Create credentials" > "API key"
// 5. Copier la clé générée
// 6. Remplacer la clé ci-dessus par votre clé personnelle
// 7. Le plan gratuit inclut 28,500 requêtes par mois

export const GOOGLE_MAPS_FEATURES = {
  // Fonctionnalités disponibles
  geocoding: true,
  reverseGeocoding: true,
  places: true,
  directions: true,
  traffic: false, // Nécessite un plan payant
  
  // Limites du plan gratuit
  limits: {
    mapLoads: 28500,        // par mois
    geocodingRequests: 2500, // par jour
    placesRequests: 1000,   // par jour
    directionsRequests: 2500 // par jour
  }
};

// Styles personnalisés pour la carte
export const GOOGLE_MAPS_STYLES = [
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#f5f5f5' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#c9d6e8' }]
  }
]; 