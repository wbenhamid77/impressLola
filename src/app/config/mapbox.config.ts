export const MAPBOX_CONFIG = {
  // Token Mapbox gratuit - vous devrez créer un compte sur mapbox.com
  // Plan gratuit : 50,000 vues/mois
  accessToken: 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw',
  
  // Styles de carte disponibles
  styles: {
    streets: 'mapbox://styles/mapbox/streets-v12',
    outdoors: 'mapbox://styles/mapbox/outdoors-v12',
    light: 'mapbox://styles/mapbox/light-v11',
    dark: 'mapbox://styles/mapbox/dark-v11',
    satellite: 'mapbox://styles/mapbox/satellite-v9',
    satelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v12',
    navigation: 'mapbox://styles/mapbox/navigation-day-v1',
    navigationNight: 'mapbox://styles/mapbox/navigation-night-v1'
  },
  
  // Configuration par défaut
  default: {
    center: [2.3522, 48.8566] as [number, number], // Paris
    zoom: 12,
    style: 'mapbox://styles/mapbox/streets-v12',
    minZoom: 3,
    maxZoom: 18
  },
  
  // Configuration pour la France
  france: {
    center: [2.3522, 48.8566] as [number, number], // Paris
    zoom: 6,
    bounds: [
      [-5.0, 41.0], // Sud-Ouest
      [10.0, 51.0]  // Nord-Est
    ]
  },
  
  // Configuration pour le Maroc
  morocco: {
    center: [-7.0, 31.0] as [number, number], // Maroc
    zoom: 6,
    bounds: [
      [-13.0, 27.0], // Sud-Ouest
      [-1.0, 36.0]   // Nord-Est
    ]
  }
};

// Instructions pour obtenir un token Mapbox gratuit :
// 1. Aller sur https://www.mapbox.com/
// 2. Créer un compte gratuit
// 3. Aller dans Account > Access tokens
// 4. Créer un nouveau token avec les permissions "public" et "styles:read"
// 5. Remplacer le token ci-dessus par votre token personnel
// 6. Le plan gratuit inclut 50,000 vues de carte par mois

export const MAPBOX_FEATURES = {
  // Fonctionnalités disponibles
  geocoding: true,
  reverseGeocoding: true,
  directions: false, // Nécessite un plan payant
  traffic: false,    // Nécessite un plan payant
  
  // Limites du plan gratuit
  limits: {
    geocodingRequests: 100000, // par mois
    mapViews: 50000,           // par mois
    styleRequests: 50000       // par mois
  }
}; 