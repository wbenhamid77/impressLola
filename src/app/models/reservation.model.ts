export interface DisponibiliteResponse {
  disponible: boolean;
  message?: string;
}

export interface PeriodeIndisponible {
  dateDebut: string; // YYYY-MM-DD
  dateFin: string;   // YYYY-MM-DD
}

export type ModePaiement = 'PAIEMENT_SUR_PLACE' | 'CARTE' | 'VIREMENT';

export interface RecapitulatifRequest {
  annonceId: string;
  dateArrivee: string; // YYYY-MM-DD
  dateDepart: string;  // YYYY-MM-DD
  nombreVoyageurs: number;
  modePaiement?: ModePaiement;
  messageProprietaire?: string;
  fraisService?: number;
  fraisNettoyage?: number;
  fraisDepot?: number;
}

export interface RecapitulatifResponse {
  prixTotal: number;
  nombreNuits: number;
  fraisService?: number;
  fraisNettoyage?: number;
  fraisDepot?: number;
  details?: string;
}

export interface CreateReservationRequest extends RecapitulatifRequest {}

export interface Reservation {
  id: string;
  annonceId: string;
  locataireId: string;
  locateurId?: string;
  dateArrivee: string;
  dateDepart: string;
  nombreVoyageurs: number;
  montantTotal?: number;
  statut: 'EN_ATTENTE' | 'CONFIRMEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
  messageProprietaire?: string;
  dateCreation?: string;
} 