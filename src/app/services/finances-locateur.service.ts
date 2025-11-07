import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LocateurFinancesDTO } from '../models/finances-locateur.model';
import { 
  TransactionInstructionDTO,
  TransactionType,
  TransactionStatus
} from '../models/transaction-instruction.model';

@Injectable({
  providedIn: 'root'
})
export class FinancesLocateurService {
  private baseUrl = `${environment.apiUrl}/api/locateurs`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère l'overview global des finances du locateur
   */
  getOverview(locateurId: string): Observable<LocateurFinancesDTO> {
    return this.http.get<LocateurFinancesDTO>(
      `${this.baseUrl}/${locateurId}/finances/overview`
    );
  }

  /**
   * Récupère le total des revenus (payouts exécutés)
   */
  getTotalRevenus(locateurId: string): Observable<number> {
    return this.http.get<number>(
      `${this.baseUrl}/${locateurId}/finances/revenus`
    );
  }

  /**
   * Récupère le total des remboursements (exécutés)
   */
  getTotalRemboursements(locateurId: string): Observable<number> {
    return this.http.get<number>(
      `${this.baseUrl}/${locateurId}/finances/remboursements`
    );
  }

  /**
   * Récupère le total des commissions plateforme (exécutées)
   */
  getTotalCommissions(locateurId: string): Observable<number> {
    return this.http.get<number>(
      `${this.baseUrl}/${locateurId}/finances/commissions`
    );
  }

  /**
   * Récupère le total des payins plateforme (exécutés)
   */
  getTotalPayins(locateurId: string): Observable<number> {
    return this.http.get<number>(
      `${this.baseUrl}/${locateurId}/finances/paiements`
    );
  }

  /**
   * Récupère la liste des transactions avec filtres optionnels
   */
  getTransactions(
    locateurId: string,
    filters?: {
      statut?: TransactionStatus;
      type?: TransactionType;
    }
  ): Observable<TransactionInstructionDTO[]> {
    let params = new HttpParams();

    if (filters?.statut) {
      params = params.set('statut', filters.statut);
    }

    if (filters?.type) {
      params = params.set('type', filters.type);
    }

    return this.http.get<TransactionInstructionDTO[]>(
      `${this.baseUrl}/${locateurId}/finances/transactions`,
      { params }
    );
  }

  /**
   * Formate un montant en format monétaire
   */
  formaterMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(montant);
  }

  /**
   * Récupère la couleur du statut de transaction
   */
  getStatutColor(statut: TransactionStatus): string {
    const colors = {
      PENDING: 'text-yellow-600 bg-yellow-100',
      EXECUTED: 'text-green-600 bg-green-100',
      CANCELLED: 'text-red-600 bg-red-100'
    };
    return colors[statut] || 'text-gray-600 bg-gray-100';
  }

  /**
   * Récupère l'icône du type de transaction
   */
  getTypeIcon(type: TransactionType): string {
    const icons = {
      PAYIN_PLATEFORME: 'fas fa-arrow-down',
      PAYOUT_LOCATEUR: 'fas fa-arrow-up',
      COMMISSION_PLATEFORME: 'fas fa-percent',
      REFUND_LOCATAIRE_FROM_LOCATEUR: 'fas fa-undo',
      REFUND_LOCATAIRE_FROM_PLATEFORME: 'fas fa-undo'
    };
    return icons[type] || 'fas fa-exchange-alt';
  }

  /**
   * Récupère le libellé du type de transaction
   */
  getTypeLabel(type: TransactionType): string {
    const labels = {
      PAYIN_PLATEFORME: 'Paiement reçu',
      PAYOUT_LOCATEUR: 'Paiement versé',
      COMMISSION_PLATEFORME: 'Commission plateforme',
      REFUND_LOCATAIRE_FROM_LOCATEUR: 'Remboursement (depuis locateur)',
      REFUND_LOCATAIRE_FROM_PLATEFORME: 'Remboursement (depuis plateforme)'
    };
    return labels[type] || type;
  }

  /**
   * Récupère le libellé du statut
   */
  getStatutLabel(statut: TransactionStatus): string {
    const labels = {
      PENDING: 'En attente',
      EXECUTED: 'Exécutée',
      CANCELLED: 'Annulée'
    };
    return labels[statut] || statut;
  }
}

