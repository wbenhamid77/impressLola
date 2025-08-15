import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { 
  Reservation, 
  RecapitulatifRequest, 
  RecapitulatifResponse, 
  CreateReservationRequest,
  DisponibiliteResponse,
  PeriodeIndisponible
} from '../models/reservation.model';

export interface PeriodeReservee {
  dateDebut: string;
  dateFin: string;
  statut: string;
}

export interface ReservationResponse {
  id: string;
  annonceId: string;
  dateArrivee: string;
  dateDepart: string;
  nombreVoyageurs: number;
  statut: string;
  dateCreation: string;
}

export interface StatistiquesReservation {
  total: number;
  enAttente: number;
  confirmees: number;
  enCours: number;
  terminees: number;
  annulees: number;
  revenus: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private readonly API_BASE_URL = 'http://localhost:8083';
  private readonly API_RESERVATIONS_URL = 'http://localhost:8083';

  constructor(private http: HttpClient) {}

  // ===== CRÉATION DE RÉSERVATIONS =====

  /**
   * Crée un récapitulatif de réservation
   */
  creerRecapitulatif(recapitulatif: RecapitulatifRequest): Observable<RecapitulatifResponse> {
    const url = `${this.API_BASE_URL}/api/reservations/recapitulatif`;
    console.log('📋 Création du récapitulatif:', recapitulatif);
    
    return this.http.post<RecapitulatifResponse>(url, recapitulatif)
      .pipe(catchError(this.handleError));
  }

  /**
   * Crée une nouvelle réservation
   */
  creerReservation(reservation: CreateReservationRequest, locataireId: string): Observable<ReservationResponse> {
    const params = new HttpParams().set('locataireId', locataireId);
    const url = `${this.API_BASE_URL}/api/reservations`;

    console.log('🚀 Création de réservation:', { url, reservation, locataireId });

    return this.http.post<ReservationResponse>(url, reservation, { params })
      .pipe(catchError(this.handleError));
  }

  // ===== MODIFICATION DE RÉSERVATIONS =====

  /**
   * Confirme une réservation
   */
  confirmerReservation(id: string): Observable<Reservation> {
    const url = `${this.API_BASE_URL}/api/reservations/${id}/confirmer`;
    console.log('✅ Confirmation de réservation:', id);
    
    return this.http.put<Reservation>(url, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Annule une réservation
   */
  annulerReservation(id: string, raison?: string): Observable<Reservation> {
    const url = `${this.API_BASE_URL}/api/reservations/${id}/annuler`;
    const body = raison ? { raison } : {};
    console.log('❌ Annulation de réservation:', id, raison);
    
    return this.http.put<Reservation>(url, body)
      .pipe(catchError(this.handleError));
  }

  /**
   * Met à jour le statut d'une réservation
   */
  mettreAJourStatut(id: string, statut: string): Observable<Reservation> {
    const url = `${this.API_BASE_URL}/api/reservations/${id}/statut`;
    console.log('🔄 Mise à jour du statut:', id, statut);
    
    return this.http.put<Reservation>(url, { statut })
      .pipe(catchError(this.handleError));
  }

  // ===== CONSULTATION DE RÉSERVATIONS =====

  /**
   * Récupère une réservation par ID
   */
  getReservationById(id: string): Observable<Reservation> {
    const url = `${this.API_BASE_URL}/api/reservations/${id}`;
    console.log('🔍 Récupération de réservation par ID:', id);
    
    return this.http.get<Reservation>(url)
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupère toutes les réservations d'un locataire
   */
  getReservationsLocataire(locataireId: string): Observable<Reservation[]> {
    const url = `${this.API_BASE_URL}/api/reservations/locataire/${locataireId}`;
    console.log('👤 Récupération des réservations du locataire:', locataireId);
    
    return this.http.get<Reservation[]>(url)
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupère les réservations futures d'un locataire
   */
  getReservationsFuturesLocataire(locataireId: string): Observable<Reservation[]> {
    const url = `${this.API_BASE_URL}/api/reservations/locataire/${locataireId}/futures`;
    console.log('🔮 Récupération des réservations futures du locataire:', locataireId);
    
    return this.http.get<Reservation[]>(url)
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupère les réservations passées d'un locataire
   */
  getReservationsPasseesLocataire(locataireId: string): Observable<Reservation[]> {
    const url = `${this.API_BASE_URL}/api/reservations/locataire/${locataireId}/passees`;
    console.log('📚 Récupération des réservations passées du locataire:', locataireId);
    
    return this.http.get<Reservation[]>(url)
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupère toutes les réservations d'un locateur
   */
  getReservationsLocateur(locateurId: string): Observable<Reservation[]> {
    const url = `${this.API_BASE_URL}/api/reservations/locateur/${locateurId}`;
    console.log('🏠 Récupération des réservations du locateur:', locateurId);
    
    return this.http.get<Reservation[]>(url)
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupère le récapitulatif des réservations d'un locateur
   */
  getRecapitulatifLocateur(locateurId: string): Observable<StatistiquesReservation> {
    const url = `${this.API_BASE_URL}/api/locateurs/${locateurId}/reservations/recapitulatif`;
    console.log('📊 Récupération du récapitulatif du locateur:', locateurId);
    
    return this.http.get<StatistiquesReservation>(url)
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupère les réservations en attente d'un locateur
   */
  getReservationsEnAttenteLocateur(locateurId: string): Observable<Reservation[]> {
    const url = `${this.API_BASE_URL}/api/locateurs/${locateurId}/reservations/en-attente`;
    console.log('⏳ Récupération des réservations en attente du locateur:', locateurId);
    
    return this.http.get<Reservation[]>(url)
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupère les réservations confirmées d'un locateur
   */
  getReservationsConfirmeesLocateur(locateurId: string): Observable<Reservation[]> {
    const url = `${this.API_BASE_URL}/api/locateurs/${locateurId}/reservations/confirmees`;
    console.log('✅ Récupération des réservations confirmées du locateur:', locateurId);
    
    return this.http.get<Reservation[]>(url)
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupère les réservations en cours d'un locateur
   */
  getReservationsEnCoursLocateur(locateurId: string): Observable<Reservation[]> {
    const url = `${this.API_BASE_URL}/api/locateurs/${locateurId}/reservations/en-cours`;
    console.log('🔄 Récupération des réservations en cours du locateur:', locateurId);
    
    return this.http.get<Reservation[]>(url)
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupère les réservations terminées d'un locateur
   */
  getReservationsTermineesLocateur(locateurId: string): Observable<Reservation[]> {
    const url = `${this.API_BASE_URL}/api/locateurs/${locateurId}/reservations/terminees`;
    console.log('🏁 Récupération des réservations terminées du locateur:', locateurId);
    
    return this.http.get<Reservation[]>(url)
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupère les réservations annulées d'un locateur
   */
  getReservationsAnnuleesLocateur(locateurId: string): Observable<Reservation[]> {
    const url = `${this.API_BASE_URL}/api/locateurs/${locateurId}/reservations/annulees`;
    console.log('❌ Récupération des réservations annulées du locateur:', locateurId);
    
    return this.http.get<Reservation[]>(url)
      .pipe(catchError(this.handleError));
  }

  /**
   * Filtre les réservations d'un locateur par statut
   */
  getReservationsLocateurParStatut(locateurId: string, statut: string): Observable<Reservation[]> {
    const url = `${this.API_BASE_URL}/api/locateurs/${locateurId}/reservations/statut/${statut}`;
    console.log('🔍 Filtrage des réservations du locateur par statut:', locateurId, statut);
    
    return this.http.get<Reservation[]>(url)
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupère toutes les réservations en attente (admin)
   */
  getReservationsEnAttente(): Observable<Reservation[]> {
    const url = `${this.API_BASE_URL}/api/reservations/en-attente`;
    console.log('⏳ Récupération de toutes les réservations en attente');
    
    return this.http.get<Reservation[]>(url)
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupère les statistiques générales (admin)
   */
  getStatistiquesGenerales(): Observable<StatistiquesReservation> {
    const url = `${this.API_BASE_URL}/api/reservations/statistiques`;
    console.log('📊 Récupération des statistiques générales');
    
    return this.http.get<StatistiquesReservation>(url)
      .pipe(catchError(this.handleError));
  }

  // ===== VÉRIFICATION DE DISPONIBILITÉ =====

  /**
   * Vérifie la disponibilité d'une période
   */
  verifierDisponibilite(annonceId: string, dateArrivee: string, dateDepart: string): Observable<DisponibiliteResponse> {
    const url = `${this.API_BASE_URL}/api/reservations/disponibilite`;
    const params = new HttpParams()
      .set('annonceId', annonceId)
      .set('dateArrivee', dateArrivee)
      .set('dateDepart', dateDepart);
    
    console.log('🔍 Vérification disponibilité:', { annonceId, dateArrivee, dateDepart });
        
    return this.http.get<DisponibiliteResponse>(url, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupère les périodes réservées d'une annonce
   */
  getPeriodesReservees(annonceId: string): Observable<PeriodeIndisponible[]> {
    const url = `${this.API_BASE_URL}/api/reservations/annonce/${annonceId}/periodes`;
    console.log('📅 Récupération des périodes réservées pour l\'annonce:', annonceId);
    
    return this.http.get<PeriodeIndisponible[]>(url)
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupère les périodes futures réservées pour une annonce
   */
  getPeriodesFuturesReservees(annonceId: string, statuts: string[] = ['EN_ATTENTE', 'CONFIRMEE', 'EN_COURS']): Observable<PeriodeReservee[]> {
    const statutsParam = statuts.join(',');
    const url = `${this.API_RESERVATIONS_URL}/api/reservations/annonce/${annonceId}/periodes-futures?statuts=${statutsParam}`;

    return this.http.get<PeriodeReservee[]>(url)
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupère tous les jours réservés d'une annonce (format YYYY-MM-DD)
   */
  getJoursReserves(annonceId: string, statuts: string[] = ['EN_ATTENTE', 'CONFIRMEE', 'EN_COURS']): Observable<string[]> {
    const statutsParam = statuts.join(',');
    const url = `${this.API_BASE_URL}/api/reservations/annonce/${annonceId}/jours-reserves?statuts=${statutsParam}`;
    
    console.log('📅 Récupération des jours réservés pour l\'annonce:', annonceId, 'avec statuts:', statuts);

    return this.http.get<string[]>(url)
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupère les jours réservés par statut spécifique
   */
  getJoursReservesParStatut(annonceId: string, statut: string): Observable<string[]> {
    return this.getJoursReserves(annonceId, [statut]);
  }

  /**
   * Récupère tous les jours réservés (tous statuts confondus)
   */
  getTousJoursReserves(annonceId: string): Observable<string[]> {
    return this.getJoursReserves(annonceId, ['EN_ATTENTE', 'CONFIRMEE', 'EN_COURS']);
  }

  /**
   * Récupère toutes les réservations d'une annonce
   */
  getReservationsAnnonce(annonceId: string): Observable<Reservation[]> {
    const url = `${this.API_BASE_URL}/api/reservations/annonce/${annonceId}`;
    
    console.log('🔍 Récupération des réservations pour l\'annonce:', annonceId);
    
    return this.http.get<Reservation[]>(url)
      .pipe(catchError(this.handleError));
  }

  // ===== MÉTHODES UTILITAIRES =====

  /**
   * Valide les dates d'une réservation
   */
  validerDates(dateArrivee: string, dateDepart: string): { isValid: boolean; message?: string } {
    const arrivee = new Date(dateArrivee);
    const depart = new Date(dateDepart);
    const aujourdhui = new Date();
    
    // Réinitialise l'heure pour la comparaison des dates
    aujourdhui.setHours(0, 0, 0, 0);
    arrivee.setHours(0, 0, 0, 0);
    depart.setHours(0, 0, 0, 0);

    if (arrivee < aujourdhui) {
      return { isValid: false, message: 'La date d\'arrivée ne peut pas être dans le passé' };
    }

    if (depart <= arrivee) {
      return { isValid: false, message: 'La date de départ doit être postérieure à la date d\'arrivée' };
    }

    const differenceJours = Math.ceil((depart.getTime() - arrivee.getTime()) / (1000 * 60 * 60 * 24));
    if (differenceJours > 30) {
      return { isValid: false, message: 'La durée du séjour ne peut pas dépasser 30 jours' };
    }

    return { isValid: true };
  }

  /**
   * Gestion centralisée des erreurs
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else if (error.status) {
      // Erreur côté serveur
      switch (error.status) {
        case 400:
          errorMessage = 'Données de réservation invalides';
          break;
        case 409:
          errorMessage = 'Conflit de réservation - Période non disponible';
          break;
        case 404:
          errorMessage = 'Annonce non trouvée';
          break;
        case 500:
          errorMessage = 'Erreur interne du serveur';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.message}`;
      }
    }

    console.error('Erreur dans le service de réservation:', error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Formate une date pour l'affichage
   */
  formaterDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Calcule la durée d'un séjour
   */
  calculerDureeSejour(dateArrivee: string, dateDepart: string): number {
    const arrivee = new Date(dateArrivee);
    const depart = new Date(dateDepart);
    const differenceMs = depart.getTime() - arrivee.getTime();
    return Math.ceil(differenceMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Formate le statut pour l'affichage
   */
  formaterStatut(statut: string): string {
    const statuts: { [key: string]: string } = {
      'EN_ATTENTE': 'En attente',
      'CONFIRMEE': 'Confirmée',
      'EN_COURS': 'En cours',
      'TERMINEE': 'Terminée',
      'ANNULEE': 'Annulée'
    };
    return statuts[statut] || statut;
  }

  /**
   * Obtient la classe CSS pour le statut
   */
  getClasseStatut(statut: string): string {
    const classes: { [key: string]: string } = {
      'EN_ATTENTE': 'badge-warning',
      'CONFIRMEE': 'badge-success',
      'EN_COURS': 'badge-info',
      'TERMINEE': 'badge-secondary',
      'ANNULEE': 'badge-danger'
    };
    return classes[statut] || 'badge-secondary';
  }
} 