export interface Stade {
  id: string;
  nom: string;
  ville: string;
  capacite: number;
  latitude: number;
  longitude: number;
  adresse: string;
  description: string;
  images: string[];
  equipements: string[];
  dateConstruction: number;
  surfaceJeu: string;
  equipeResident?: string;
  // distance éventuellement fournie par l'API des distances
  distance?: number;
  // Champs optionnels venant du backend distances
  adresseComplete?: string;
  estActif?: boolean;
  dateCreation?: string;
  dateModification?: string | null;
  surfaceMetresCarres?: number;
  categories?: string[];
  categoriesPlaces?: any[];
  prixMin?: number;
  prixMax?: number;
  imagesBlob?: any[];
  surfaceType?: string | null;
  dimensions?: string | null;
  siteWeb?: string | null;
  telephone?: string | null;
  // Métadonnées de distance/transport (si présentes)
  tempsTrajetMinutes?: number;
  tempsTrajetFormate?: string;
  modeTransport?: string;
  estLePlusProche?: boolean;
}

export interface StadeAvecDistance extends Stade {
  distance: number; // Distance en kilomètres
}

export const STADES_CAN_2025: Stade[] = [
  {
    id: 'mohammed-v',
    nom: 'Stade Mohammed V',
    ville: 'Casablanca',
    capacite: 67000,
    latitude: 33.5653,
    longitude: -7.6228,
    adresse: 'Boulevard Zerktouni, Casablanca',
    description: 'Le plus grand stade du Maroc, entièrement rénové pour accueillir les plus grands événements footballistiques.',
    images: [
      '/assets/images/stades/mohammed-v-1.jpg',
      '/assets/images/stades/mohammed-v-2.jpg',
      '/assets/images/stades/mohammed-v-3.jpg'
    ],
    equipements: [
      'Pelouse hybride',
      'Éclairage LED',
      'Écrans géants',
      'Loges VIP',
      'Parking 5000 places',
      'Centre médical',
      'Restaurants'
    ],
    dateConstruction: 1955,
    surfaceJeu: '105m x 68m',
    equipeResident: 'Raja Casablanca, Wydad Casablanca'
  },
  {
    id: 'ibn-batouta',
    nom: 'Stade Ibn Batouta',
    ville: 'Tanger',
    capacite: 65000,
    latitude: 35.7595,
    longitude: -5.8008,
    adresse: 'Route de Tétouan, Tanger',
    description: 'Stade moderne avec vue sur le détroit de Gibraltar, symbole du football marocain du nord.',
    images: [
      '/assets/images/stades/ibn-batouta-1.jpg',
      '/assets/images/stades/ibn-batouta-2.jpg',
      '/assets/images/stades/ibn-batouta-3.jpg'
    ],
    equipements: [
      'Pelouse naturelle',
      'Système de chauffage',
      'Écrans 4K',
      'Loges premium',
      'Parking couvert',
      'Salle de presse',
      'Boutiques officielles'
    ],
    dateConstruction: 2011,
    surfaceJeu: '105m x 68m',
    equipeResident: 'IR Tanger'
  },
  {
    id: 'moulay-abdallah',
    nom: 'Stade Moulay Abdallah',
    ville: 'Rabat',
    capacite: 52000,
    latitude: 34.0209,
    longitude: -6.8417,
    adresse: 'Avenue Moulay Abdallah, Rabat',
    description: 'Stade de la capitale, témoin des plus grands moments du football marocain.',
    images: [
      '/assets/images/stades/moulay-abdallah-1.jpg',
      '/assets/images/stades/moulay-abdallah-2.jpg',
      '/assets/images/stades/moulay-abdallah-3.jpg'
    ],
    equipements: [
      'Pelouse hybride',
      'Éclairage moderne',
      'Tableaux d\'affichage',
      'Tribunes VIP',
      'Parking 3000 places',
      'Musée du football',
      'Espaces commerciaux'
    ],
    dateConstruction: 1983,
    surfaceJeu: '105m x 68m',
    equipeResident: 'FUS Rabat'
  },
  {
    id: 'marrakech',
    nom: 'Stade de Marrakech',
    ville: 'Marrakech',
    capacite: 45000,
    latitude: 31.6295,
    longitude: -7.9811,
    adresse: 'Route de Casablanca, Marrakech',
    description: 'Stade moderne au cœur de la ville rouge, alliant tradition et modernité.',
    images: [
      '/assets/images/stades/marrakech-1.jpg',
      '/assets/images/stades/marrakech-2.jpg',
      '/assets/images/stades/marrakech-3.jpg'
    ],
    equipements: [
      'Pelouse naturelle',
      'Climatisation',
      'Écrans LED',
      'Loges royales',
      'Parking sécurisé',
      'Centre de formation',
      'Hôtel intégré'
    ],
    dateConstruction: 2009,
    surfaceJeu: '105m x 68m',
    equipeResident: 'Kawkab Marrakech'
  },
  {
    id: 'fes',
    nom: 'Stade de Fès',
    ville: 'Fès',
    capacite: 35000,
    latitude: 34.0331,
    longitude: -5.0003,
    adresse: 'Avenue des Sports, Fès',
    description: 'Stade historique de la ville impériale, rénové pour les standards internationaux.',
    images: [
      '/assets/images/stades/fes-1.jpg',
      '/assets/images/stades/fes-2.jpg',
      '/assets/images/stades/fes-3.jpg'
    ],
    equipements: [
      'Pelouse naturelle',
      'Éclairage LED',
      'Système audio',
      'Tribunes familiales',
      'Parking visiteurs',
      'Académie jeunes',
      'Cafétéria'
    ],
    dateConstruction: 1967,
    surfaceJeu: '105m x 68m',
    equipeResident: 'MAS Fès'
  },
  {
    id: 'agadir',
    nom: 'Stade d\'Agadir',
    ville: 'Agadir',
    capacite: 30000,
    latitude: 30.4278,
    longitude: -9.5981,
    adresse: 'Boulevard Mohammed V, Agadir',
    description: 'Stade côtier avec architecture moderne, face à l\'océan Atlantique.',
    images: [
      '/assets/images/stades/agadir-1.jpg',
      '/assets/images/stades/agadir-2.jpg',
      '/assets/images/stades/agadir-3.jpg'
    ],
    equipements: [
      'Pelouse hybride',
      'Ventilation naturelle',
      'Écrans tactiles',
      'Terrasses panoramiques',
      'Parking étendu',
      'Spa sportif',
      'Restaurant gastronomique'
    ],
    dateConstruction: 2013,
    surfaceJeu: '105m x 68m',
    equipeResident: 'Hassania Agadir'
  }
]; 