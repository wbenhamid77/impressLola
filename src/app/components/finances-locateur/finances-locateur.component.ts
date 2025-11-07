import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FinancesLocateurService } from '../../services/finances-locateur.service';
import { AuthService } from '../../services/auth.service';
import { LocateurFinancesDTO } from '../../models/finances-locateur.model';
import { 
  TransactionInstructionDTO,
  TransactionType,
  TransactionStatus
} from '../../models/transaction-instruction.model';

@Component({
  selector: 'app-finances-locateur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finances-locateur.component.html',
  styleUrls: ['./finances-locateur.component.css']
})
export class FinancesLocateurComponent implements OnInit, OnDestroy {
  // Données
  overview: LocateurFinancesDTO | null = null;
  transactions: TransactionInstructionDTO[] = [];
  filteredTransactions: TransactionInstructionDTO[] = [];

  // États
  isLoading = false;
  isLoadingTransactions = false;
  errorMessage = '';
  errorTransactions = '';

  // Filtres
  statutFiltre: TransactionStatus | '' = '';
  typeFiltre: TransactionType | '' = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  private destroy$ = new Subject<void>();
  private financesService = inject(FinancesLocateurService);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.chargerDonnees();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge toutes les données financières
   */
  chargerDonnees(): void {
    const locateurId = this.authService.getLocateurId();
    
    if (!locateurId) {
      this.errorMessage = 'ID du locateur non trouvé. Veuillez vous reconnecter.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Charger l'overview et les transactions en parallèle
    forkJoin({
      overview: this.financesService.getOverview(locateurId).pipe(
        catchError(error => {
          console.error('Erreur lors du chargement de l\'overview:', error);
          this.errorMessage = 'Erreur lors du chargement des données financières';
          return of(null);
        })
      ),
      transactions: this.financesService.getTransactions(locateurId).pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des transactions:', error);
          this.errorTransactions = 'Erreur lors du chargement des transactions';
          return of([]);
        })
      )
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.overview = data.overview;
        this.transactions = data.transactions || [];
        this.appliquerFiltres();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur générale:', error);
        this.errorMessage = 'Une erreur est survenue lors du chargement des données';
        this.isLoading = false;
      }
    });
  }

  /**
   * Charge uniquement les transactions avec filtres
   */
  chargerTransactions(): void {
    const locateurId = this.authService.getLocateurId();
    
    if (!locateurId) {
      return;
    }

    this.isLoadingTransactions = true;
    this.errorTransactions = '';

    const filters: { statut?: TransactionStatus; type?: TransactionType } = {};
    if (this.statutFiltre) filters.statut = this.statutFiltre;
    if (this.typeFiltre) filters.type = this.typeFiltre;

    this.financesService.getTransactions(locateurId, filters)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Erreur lors du chargement des transactions:', error);
          this.errorTransactions = 'Erreur lors du chargement des transactions';
          return of([]);
        })
      )
      .subscribe({
        next: (transactions) => {
          this.transactions = transactions;
          this.appliquerFiltres();
          this.isLoadingTransactions = false;
        },
        error: () => {
          this.isLoadingTransactions = false;
        }
      });
  }

  /**
   * Applique les filtres sur les transactions
   */
  appliquerFiltres(): void {
    let filtered = [...this.transactions];

    if (this.statutFiltre) {
      filtered = filtered.filter(t => t.statut === this.statutFiltre);
    }

    if (this.typeFiltre) {
      filtered = filtered.filter(t => t.type === this.typeFiltre);
    }

    this.filteredTransactions = filtered;
    this.totalPages = Math.ceil(this.filteredTransactions.length / this.itemsPerPage);
    this.currentPage = 1;
  }

  /**
   * Change le filtre de statut
   */
  changerFiltreStatut(statut: TransactionStatus | ''): void {
    this.statutFiltre = statut;
    this.appliquerFiltres();
  }

  /**
   * Change le filtre de type
   */
  changerFiltreType(type: TransactionType | ''): void {
    this.typeFiltre = type;
    this.appliquerFiltres();
  }

  /**
   * Réinitialise tous les filtres
   */
  reinitialiserFiltres(): void {
    this.statutFiltre = '';
    this.typeFiltre = '';
    this.appliquerFiltres();
  }

  /**
   * Obtient les transactions pour la page courante
   */
  getTransactionsPage(): TransactionInstructionDTO[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredTransactions.slice(start, end);
  }

  /**
   * Change de page
   */
  changerPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  /**
   * Formate un montant
   */
  formaterMontant(montant: number): string {
    return this.financesService.formaterMontant(montant);
  }

  /**
   * Obtient la couleur du statut
   */
  getStatutColor(statut: TransactionStatus): string {
    return this.financesService.getStatutColor(statut);
  }

  /**
   * Obtient l'icône du type
   */
  getTypeIcon(type: TransactionType): string {
    return this.financesService.getTypeIcon(type);
  }

  /**
   * Obtient le libellé du type
   */
  getTypeLabel(type: TransactionType): string {
    return this.financesService.getTypeLabel(type);
  }

  /**
   * Obtient le libellé du statut
   */
  getStatutLabel(statut: TransactionStatus): string {
    return this.financesService.getStatutLabel(statut);
  }

  /**
   * Formate une date
   */
  formaterDate(dateString: string | null | undefined): string {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }
}

