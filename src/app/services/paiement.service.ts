import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { 
  Paiement, 
  CreatePaiementRequest, 
  ConfirmerPaiementRequest, 
  RembourserPaiementRequest,
  PaiementStats,
  StatutPaiement,
  TypePaiement,
  ModePaiement
} from '../models/paiement.model';

@Injectable({
  providedIn: 'root'
})
export class PaiementService {
  private apiUrl = `${environment.apiUrl}/api/paiements`;
  private paiementsSubject = new BehaviorSubject<Paiement[]>([]);
  private statsSubject = new BehaviorSubject<PaiementStats | null>(null);

  public paiements$ = this.paiementsSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Créer un paiement
  creerPaiement(request: CreatePaiementRequest): Observable<Paiement> {
    return this.http.post<Paiement>(this.apiUrl, request).pipe(
      tap(paiement => {
        const currentPaiements = this.paiementsSubject.value;
        this.paiementsSubject.next([...currentPaiements, paiement]);
      })
    );
  }

  // Confirmer un paiement
  confirmerPaiement(id: string, request: ConfirmerPaiementRequest): Observable<Paiement> {
    return this.http.put<Paiement>(`${this.apiUrl}/${id}/confirmer`, request).pipe(
      tap(paiement => this.updatePaiementInList(paiement))
    );
  }

  // Marquer un paiement comme en cours
  marquerEnCours(id: string): Observable<Paiement> {
    return this.http.put<Paiement>(`${this.apiUrl}/${id}/en-cours`, {}).pipe(
      tap(paiement => this.updatePaiementInList(paiement))
    );
  }

  // Marquer un paiement comme échec
  marquerEchec(id: string): Observable<Paiement> {
    return this.http.put<Paiement>(`${this.apiUrl}/${id}/echec`, {}).pipe(
      tap(paiement => this.updatePaiementInList(paiement))
    );
  }

  // Annuler un paiement
  annulerPaiement(id: string): Observable<Paiement> {
    return this.http.put<Paiement>(`${this.apiUrl}/${id}/annuler`, {}).pipe(
      tap(paiement => this.updatePaiementInList(paiement))
    );
  }

  // Rembourser un paiement
  rembourserPaiement(id: string, request: RembourserPaiementRequest): Observable<Paiement> {
    return this.http.put<Paiement>(`${this.apiUrl}/${id}/rembourser`, request).pipe(
      tap(paiement => this.updatePaiementInList(paiement))
    );
  }

  // Obtenir un paiement par ID
  getPaiement(id: string): Observable<Paiement> {
    return this.http.get<Paiement>(`${this.apiUrl}/${id}`);
  }

  // Obtenir les paiements d'une réservation
  getPaiementsReservation(reservationId: string): Observable<Paiement[]> {
    return this.http.get<Paiement[]>(`${this.apiUrl}/reservation/${reservationId}`);
  }

  // Obtenir les paiements d'un locataire
  getPaiementsLocataire(locataireId: string): Observable<Paiement[]> {
    return this.http.get<Paiement[]>(`${this.apiUrl}/locataire/${locataireId}`).pipe(
      tap(paiements => this.paiementsSubject.next(paiements))
    );
  }

  // Obtenir les paiements d'un locateur
  getPaiementsLocateur(locateurId: string): Observable<Paiement[]> {
    return this.http.get<Paiement[]>(`${this.apiUrl}/locateur/${locateurId}`).pipe(
      tap(paiements => this.paiementsSubject.next(paiements))
    );
  }

  // Obtenir les paiements en attente d'un locataire
  getPaiementsEnAttenteLocataire(locataireId: string): Observable<Paiement[]> {
    return this.http.get<Paiement[]>(`${this.apiUrl}/locataire/${locataireId}/en-attente`);
  }

  // Obtenir les paiements en attente d'un locateur
  getPaiementsEnAttenteLocateur(locateurId: string): Observable<Paiement[]> {
    return this.http.get<Paiement[]>(`${this.apiUrl}/locateur/${locateurId}/en-attente`);
  }

  // Obtenir les paiements expirés
  getPaiementsExpires(): Observable<Paiement[]> {
    return this.http.get<Paiement[]>(`${this.apiUrl}/expires`);
  }

  // Marquer les paiements expirés
  marquerPaiementsExpires(): Observable<{ count: number }> {
    return this.http.post<{ count: number }>(`${this.apiUrl}/marquer-expires`, {});
  }

  // Obtenir les statistiques de paiement
  getStatsPaiements(userId: string, userType: 'locataire' | 'locateur'): Observable<PaiementStats> {
    const params = new HttpParams()
      .set('userId', userId)
      .set('userType', userType);
    
    return this.http.get<PaiementStats>(`${this.apiUrl}/stats`, { params }).pipe(
      tap(stats => this.statsSubject.next(stats))
    );
  }

  // Obtenir tous les paiements avec filtres
  getPaiements(filters?: {
    statut?: StatutPaiement;
    typePaiement?: TypePaiement;
    modePaiement?: ModePaiement;
    dateDebut?: Date;
    dateFin?: Date;
    page?: number;
    limit?: number;
  }): Observable<{ paiements: Paiement[]; total: number; page: number; limit: number }> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.statut) params = params.set('statut', filters.statut);
      if (filters.typePaiement) params = params.set('typePaiement', filters.typePaiement);
      if (filters.modePaiement) params = params.set('modePaiement', filters.modePaiement);
      if (filters.dateDebut) params = params.set('dateDebut', filters.dateDebut.toISOString());
      if (filters.dateFin) params = params.set('dateFin', filters.dateFin.toISOString());
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<{ paiements: Paiement[]; total: number; page: number; limit: number }>(this.apiUrl, { params });
  }

  // Vérifier si un paiement est expiré
  isPaiementExpire(paiement: Paiement): boolean {
    return new Date() > new Date(paiement.dateEcheance);
  }

  // Calculer le temps restant avant expiration
  getTempsRestant(paiement: Paiement): { heures: number; minutes: number; secondes: number } {
    const maintenant = new Date();
    const echeance = new Date(paiement.dateEcheance);
    const diff = echeance.getTime() - maintenant.getTime();

    if (diff <= 0) {
      return { heures: 0, minutes: 0, secondes: 0 };
    }

    const heures = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secondes = Math.floor((diff % (1000 * 60)) / 1000);

    return { heures, minutes, secondes };
  }

  // Formater le montant
  formaterMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(montant);
  }

  // Obtenir la couleur du statut
  getStatutColor(statut: StatutPaiement): string {
    const colors = {
      [StatutPaiement.EN_ATTENTE]: 'text-yellow-600 bg-yellow-100',
      [StatutPaiement.EN_COURS]: 'text-blue-600 bg-blue-100',
      [StatutPaiement.PAYE]: 'text-green-600 bg-green-100',
      [StatutPaiement.ECHEC]: 'text-red-600 bg-red-100',
      [StatutPaiement.ANNULE]: 'text-gray-600 bg-gray-100',
      [StatutPaiement.REMBOURSE]: 'text-purple-600 bg-purple-100',
      [StatutPaiement.EXPIRE]: 'text-orange-600 bg-orange-100'
    };
    return colors[statut] || 'text-gray-600 bg-gray-100';
  }

  // Obtenir l'icône du statut
  getStatutIcon(statut: StatutPaiement): string {
    const icons = {
      [StatutPaiement.EN_ATTENTE]: 'fas fa-clock',
      [StatutPaiement.EN_COURS]: 'fas fa-spinner',
      [StatutPaiement.PAYE]: 'fas fa-check-circle',
      [StatutPaiement.ECHEC]: 'fas fa-times-circle',
      [StatutPaiement.ANNULE]: 'fas fa-ban',
      [StatutPaiement.REMBOURSE]: 'fas fa-undo',
      [StatutPaiement.EXPIRE]: 'fas fa-exclamation-triangle'
    };
    return icons[statut] || 'fas fa-question-circle';
  }

  // Obtenir l'icône du mode de paiement
  getModePaiementIcon(mode: ModePaiement): string {
    const icons = {
      [ModePaiement.CARTE_BANCAIRE]: 'fas fa-credit-card',
      [ModePaiement.PAYPAL]: 'fab fa-paypal',
      [ModePaiement.VIREMENT_BANCAIRE]: 'fas fa-university',
      [ModePaiement.PAIEMENT_SUR_PLACE]: 'fas fa-hand-holding-usd',
      [ModePaiement.CHEQUE]: 'fas fa-file-invoice'
    };
    return icons[mode] || 'fas fa-money-bill';
  }

  // Mettre à jour un paiement dans la liste
  private updatePaiementInList(paiement: Paiement): void {
    const currentPaiements = this.paiementsSubject.value;
    const index = currentPaiements.findIndex(p => p.id === paiement.id);
    
    if (index !== -1) {
      currentPaiements[index] = paiement;
      this.paiementsSubject.next([...currentPaiements]);
    }
  }

  // Nettoyer les données
  clearData(): void {
    this.paiementsSubject.next([]);
    this.statsSubject.next(null);
  }
}
