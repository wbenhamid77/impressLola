export interface Adresse {
  id: string | null;
  rue: string;
  numero: string;
  codePostal: string;
  ville: string;
  pays: string;
  complement: string;
  surface: number | null;
  locateurId: string | null;
  nomLocateur: string | null;
  dateCreation: string | null;
  dateModification: string | null;
  estActive: boolean;
}

export interface CreateAnnonceRequest {
  titre: string;
  description: string;
  adresse: {
    rue: string;
    numero: string;
    codePostal: string;
    ville: string;
    pays: string;
    complement?: string;
    surface: number;
  };
  prixParNuit: number;
  prixParSemaine: number;
  prixParMois: number;
  capacite: number;
  nombreChambres: number;
  nombreSallesDeBain: number;
  typeMaison: 'APPARTEMENT' | 'MAISON' | 'STUDIO' | 'VILLA';
  equipements: string[];
  regles: string[];
  images?: string[];
  locateurId: string;
  stadePlusProche: string;
  distanceStade: number;
  adresseStade: string;
  latitude: number;
  longitude: number;
}

export interface Annonce {
  id: string;
  titre: string;
  description: string;
  adresse: Adresse;
  prixParNuit: number;
  prixParSemaine: number;
  prixParMois: number;
  capacite: number;
  nombreChambres: number;
  nombreSallesDeBain: number;
  typeMaison: 'APPARTEMENT' | 'MAISON' | 'STUDIO' | 'VILLA';
  estActive: boolean;
  dateCreation: string;
  dateModification: string;
  equipements: string[];
  regles: string[];
  images?: string[];
  noteMoyenne: number;
  nombreAvis: number;
  locateurId: string;
  nomLocateur: string;
  stadePlusProche: string;
  distanceStade: number;
  adresseStade: string;
  latitude: number;
  longitude: number;
} 