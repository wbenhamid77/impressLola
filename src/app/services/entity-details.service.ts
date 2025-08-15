import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface LocateurDetails {
  id: string;
  role: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  statutKyc: string;
  dateInscription: string;
  derniereConnexion: string;
  estActif: boolean;
  photoProfil?: string;
  dateModification: string;
}

export interface AnnonceDetails {
  id: string;
  titre: string;
  description: string;
  adresse: {
    id: string;
    numero: string;
    rue: string;
    codePostal: string;
    ville: string;
    pays: string;
  };
  prixParNuit: number;
  prixParSemaine: number;
  prixParMois: number;
  capacite: number;
  nombreChambres: number;
  nombreSallesDeBain: number;
  typeMaison: string;
  estActive: boolean;
  dateCreation: string;
  dateModification: string;
  equipements: string[];
  regles: string[];
  images: string[];
  noteMoyenne: number;
  nombreAvis: number;
  locateur: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  };
  latitude: number;
  longitude: number;
}

export interface LocataireDetails {
  id: string;
  role: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  statutKyc: string;
  dateInscription: string;
  derniereConnexion: string;
  estActif: boolean;
  photoProfil?: string;
  dateModification: string;
}

// Nouvelle interface pour la réponse API des réservations
export interface ReservationDetails {
  id: string;
  annonce: {
    id: string;
    titre: string;
    description: string;
    adresse: {
      id: string;
      rue: string;
      numero: string;
      codePostal: string;
      ville: string;
      pays: string;
      complement?: string;
      surface?: number;
      locateurId: string;
      nomLocateur: string;
      dateCreation: string;
      dateModification: string;
      estActive: boolean;
    };
    prixParNuit: number;
    prixParSemaine: number;
    prixParMois: number;
    capacite: number;
    nombreChambres: number;
    nombreSallesDeBain: number;
    typeMaison: string;
    estActive: boolean;
    dateCreation: string;
    dateModification: string;
    equipements: string[];
    regles: string[];
    images: string[];
    imagesBlob: any[];
    noteMoyenne: number;
    nombreAvis: number;
    locateur: {
      id: string;
      nom: string;
      prenom: string;
      email: string | null;
      telephone: string | null;
      photoProfil: string | null;
      description: string | null;
      noteMoyenne: number;
      nombreAnnonces: number;
      estVerifie: boolean;
      raisonSociale: string | null;
    };
    latitude: number | null;
    longitude: number | null;
    distancesStades: any;
    stadeLePlusProche: any;
  };
  locataire: {
    id: string;
    role: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    statutKyc: string;
    dateInscription: string;
    derniereConnexion: string;
    estActif: boolean;
    photoProfil: string | null;
    dateModification: string;
  };
  dateArrivee: string;
  dateDepart: string;
  nombreNuits: number;
  nombreVoyageurs: number;
  prixParNuit: number;
  prixTotal: number;
  fraisService: number;
  fraisNettoyage: number;
  fraisDepot: number;
  montantTotal: number;
  statut: string;
  libelleStatut: string;
  messageProprietaire: string;
  dateCreation: string;
  dateModification: string;
  dateConfirmation: string | null;
  dateAnnulation: string | null;
  raisonAnnulation: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class EntityDetailsService {
  private baseUrl = 'http://localhost:8083/api';

  constructor(private http: HttpClient) {}

  // ===== API LOCATEUR =====
  getLocateurDetails(id: string): Observable<LocateurDetails> {
    return this.http.get<LocateurDetails>(`${this.baseUrl}/locateurs/${id}`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des détails du locateur:', error);
          return of({
            id: id,
            role: 'LOCATEUR',
            nom: 'Nom non disponible',
            prenom: 'Prénom non disponible',
            email: 'Email non disponible',
            telephone: 'Téléphone non disponible',
            statutKyc: 'NON_VERIFIE',
            dateInscription: '',
            derniereConnexion: '',
            estActif: false,
            dateModification: ''
          } as LocateurDetails);
        })
      );
  }

  // ===== API ANNONCE =====
  getAnnonceDetails(id: string): Observable<AnnonceDetails> {
    return this.http.get<AnnonceDetails>(`${this.baseUrl}/annonces/${id}`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des détails de l\'annonce:', error);
          return of({
            id: id,
            titre: 'Titre non disponible',
            description: 'Description non disponible',
            adresse: {
              id: '',
              numero: '',
              rue: '',
              codePostal: '',
              ville: 'Ville non disponible',
              pays: 'Pays non disponible'
            },
            prixParNuit: 0,
            prixParSemaine: 0,
            prixParMois: 0,
            capacite: 0,
            nombreChambres: 0,
            nombreSallesDeBain: 0,
            typeMaison: 'NON_DEFINI',
            estActive: false,
            dateCreation: '',
            dateModification: '',
            equipements: [],
            regles: [],
            images: [],
            noteMoyenne: 0,
            nombreAvis: 0,
            locateur: {
              id: '',
              nom: 'Nom non disponible',
              prenom: 'Prénom non disponible',
              email: 'Email non disponible'
            },
            latitude: 0,
            longitude: 0
          } as AnnonceDetails);
        })
      );
  }

  // ===== API LOCATAIRE =====
  getLocataireDetails(id: string): Observable<LocataireDetails> {
    return this.http.get<LocataireDetails>(`${this.baseUrl}/locataires/${id}`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des détails du locataire:', error);
          return of({
            id: id,
            role: 'LOCATAIRE',
            nom: 'Nom non disponible',
            prenom: 'Prénom non disponible',
            email: 'Email non disponible',
            telephone: 'Téléphone non disponible',
            statutKyc: 'NON_VERIFIE',
            dateInscription: '',
            derniereConnexion: '',
            estActif: false,
            dateModification: ''
          } as LocataireDetails);
        })
      );
  }

  // ===== NOUVELLE API RÉSERVATIONS =====
  getReservationsLocateur(id: string): Observable<ReservationDetails[]> {
    return this.http.get<ReservationDetails[]>(`${this.baseUrl}/locateurs/${id}/reservations`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des réservations du locateur:', error);
          return of([]);
        })
      );
  }

  getReservationsLocataire(id: string): Observable<ReservationDetails[]> {
    return this.http.get<ReservationDetails[]>(`${this.baseUrl}/locataires/${id}/reservations`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des réservations du locataire:', error);
          return of([]);
        })
      );
  }

  // ===== MÉTHODES UTILITAIRES =====
  getFullName(entity: LocateurDetails | LocataireDetails): string {
    return `${entity.prenom} ${entity.nom}`.trim();
  }

  getFormattedAddress(annonce: AnnonceDetails): string {
    const adr = annonce.adresse;
    return `${adr.numero} ${adr.rue}, ${adr.codePostal} ${adr.ville}, ${adr.pays}`.trim();
  }

  getShortAddress(annonce: AnnonceDetails): string {
    const adr = annonce.adresse;
    return `${adr.ville}, ${adr.pays}`;
  }

  isVerified(entity: LocateurDetails | LocataireDetails): boolean {
    return entity.statutKyc === 'VERIFIE';
  }

  getStatusBadgeClass(entity: LocateurDetails | LocataireDetails): string {
    if (entity.estActif && this.isVerified(entity)) {
      return 'badge-success';
    } else if (entity.estActif) {
      return 'badge-warning';
    } else {
      return 'badge-danger';
    }
  }

  // ===== NOUVELLES MÉTHODES UTILITAIRES =====
  getFormattedAddressFromReservation(reservation: ReservationDetails): string {
    const adr = reservation.annonce.adresse;
    return `${adr.numero} ${adr.rue}, ${adr.codePostal} ${adr.ville}, ${adr.pays}`.trim();
  }

  getShortAddressFromReservation(reservation: ReservationDetails): string {
    const adr = reservation.annonce.adresse;
    return `${adr.ville}, ${adr.pays}`;
  }

  getFullNameFromReservation(reservation: ReservationDetails, type: 'locataire' | 'locateur'): string {
    if (type === 'locataire') {
      return `${reservation.locataire.prenom} ${reservation.locataire.nom}`.trim();
    } else {
      return `${reservation.annonce.locateur.prenom} ${reservation.annonce.locateur.nom}`.trim();
    }
  }

  getStatusBadgeClassForReservation(reservation: ReservationDetails): string {
    switch (reservation.statut) {
      case 'CONFIRMEE':
        return 'badge-success';
      case 'EN_ATTENTE':
        return 'badge-warning';
      case 'EN_COURS':
        return 'badge-info';
      case 'TERMINEE':
        return 'badge-secondary';
      case 'ANNULEE':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }
} 