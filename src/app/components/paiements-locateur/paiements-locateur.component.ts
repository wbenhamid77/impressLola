import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PaiementService } from '../../services/paiement.service';
import { AuthService } from '../../services/auth.service';
import { Paiement, StatutPaiement, TypePaiement, ModePaiement, PaiementStats } from '../../models/paiement.model';

@Component({
  selector: 'app-paiements-locateur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './paiements-locateur.component.html',
  styleUrls: ['./paiements-locateur.component.css']
})
export class PaiementsLocateurComponent implements OnInit, OnDestroy {
  paiements: Paiement[] = [];
  paiementsEnAttente: Paiement[] = [];
  stats: PaiementStats | null = null;
  isLoading = false;
  errorMessage = '';
  
  // Filtres
  statutFiltre: StatutPaiement | '' = '';
  typeFiltre: TypePaiement | '' = '';
  modeFiltre: ModePaiement | '' = '';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  
  // Tri
  sortBy = 'dateCreation';
  sortOrder: 'asc' | 'desc' = 'desc';
  
  private destroy$ = new Subject<void>();

  private paiementService = inject(PaiementService);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.chargerPaiements();
    this.chargerStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  chargerPaiements(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) {
      this.errorMessage = 'Utilisateur non connecté';
      this.isLoading = false;
      return;
    }

    this.paiementService.getPaiementsLocateur(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (paiements: Paiement[]) => {
          this.paiements = paiements;
          this.paiementsEnAttente = paiements.filter((p: Paiement) => p.statut === StatutPaiement.EN_ATTENTE);
          this.totalItems = paiements.length;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement des paiements:', error);
          this.errorMessage = 'Erreur lors du chargement des paiements';
          this.isLoading = false;
        }
      });
  }

  chargerStats(): void {
    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) return;

    this.paiementService.getStatsPaiements(userId, 'locateur')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats: PaiementStats) => {
          this.stats = stats;
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement des statistiques:', error);
        }
      });
  }

  appliquerFiltres(): void {
    this.currentPage = 1;
    this.chargerPaiements();
  }

  reinitialiserFiltres(): void {
    this.statutFiltre = '';
    this.typeFiltre = '';
    this.modeFiltre = '';
    this.currentPage = 1;
    this.chargerPaiements();
  }

  trier(colonnes: string): void {
    if (this.sortBy === colonnes) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = colonnes;
      this.sortOrder = 'asc';
    }
    this.chargerPaiements();
  }

  changerPage(page: number): void {
    this.currentPage = page;
    this.chargerPaiements();
  }

  getPaiementsFiltres(): Paiement[] {
    let paiementsFiltres = [...this.paiements];

    if (this.statutFiltre) {
      paiementsFiltres = paiementsFiltres.filter(p => p.statut === this.statutFiltre);
    }

    if (this.typeFiltre) {
      paiementsFiltres = paiementsFiltres.filter(p => p.typePaiement === this.typeFiltre);
    }

    if (this.modeFiltre) {
      paiementsFiltres = paiementsFiltres.filter(p => p.modePaiement === this.modeFiltre);
    }

    // Tri
    paiementsFiltres.sort((a, b) => {
      let aValue: any = a[this.sortBy as keyof Paiement];
      let bValue: any = b[this.sortBy as keyof Paiement];

      if (aValue instanceof Date) {
        aValue = aValue.getTime();
        bValue = bValue.getTime();
      }

      if (this.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return paiementsFiltres;
  }

  getPaiementsPagination(): Paiement[] {
    const paiementsFiltres = this.getPaiementsFiltres();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return paiementsFiltres.slice(startIndex, endIndex);
  }

  getTotalPages(): number {
    const paiementsFiltres = this.getPaiementsFiltres();
    return Math.ceil(paiementsFiltres.length / this.itemsPerPage);
  }

  // Actions sur les paiements
  marquerEnCours(paiement: Paiement): void {
    this.paiementService.marquerEnCours(paiement.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.chargerPaiements();
        },
        error: (error: any) => {
          console.error('Erreur lors de la mise à jour du paiement:', error);
          this.errorMessage = 'Erreur lors de la mise à jour du paiement';
        }
      });
  }

  marquerEchec(paiement: Paiement): void {
    this.paiementService.marquerEchec(paiement.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.chargerPaiements();
        },
        error: (error: any) => {
          console.error('Erreur lors de la mise à jour du paiement:', error);
          this.errorMessage = 'Erreur lors de la mise à jour du paiement';
        }
      });
  }

  annulerPaiement(paiement: Paiement): void {
    if (confirm('Êtes-vous sûr de vouloir annuler ce paiement ?')) {
      this.paiementService.annulerPaiement(paiement.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.chargerPaiements();
          },
          error: (error: any) => {
            console.error('Erreur lors de l\'annulation du paiement:', error);
            this.errorMessage = 'Erreur lors de l\'annulation du paiement';
          }
        });
    }
  }

  rembourserPaiement(paiement: Paiement): void {
    const numeroRemboursement = prompt('Numéro de remboursement:');
    const raisonRemboursement = prompt('Raison du remboursement:');

    if (numeroRemboursement && raisonRemboursement) {
      this.paiementService.rembourserPaiement(paiement.id, {
        numeroRemboursement,
        raisonRemboursement
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.chargerPaiements();
        },
        error: (error: any) => {
          console.error('Erreur lors du remboursement:', error);
          this.errorMessage = 'Erreur lors du remboursement';
        }
      });
    }
  }

  // Méthodes utilitaires
  formaterMontant(montant: number): string {
    return this.paiementService.formaterMontant(montant);
  }

  getStatutColor(statut: StatutPaiement): string {
    return this.paiementService.getStatutColor(statut);
  }

  getStatutIcon(statut: StatutPaiement): string {
    return this.paiementService.getStatutIcon(statut);
  }

  getModePaiementIcon(mode: ModePaiement): string {
    return this.paiementService.getModePaiementIcon(mode);
  }

  isPaiementExpire(paiement: Paiement): boolean {
    return this.paiementService.isPaiementExpire(paiement);
  }

  getTempsRestant(paiement: Paiement): { heures: number; minutes: number; secondes: number } {
    return this.paiementService.getTempsRestant(paiement);
  }

  // Enums pour le template
  StatutPaiement = StatutPaiement;
  TypePaiement = TypePaiement;
  ModePaiement = ModePaiement;
  Math = Math;
}
