import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';
import { PaiementService } from '../../services/paiement.service';
import { AuthService } from '../../services/auth.service';
import { Paiement, StatutPaiement, TypePaiement, ModePaiement, PaiementStats } from '../../models/paiement.model';
import { TransactionInstructionDTO } from '../../models/transaction-instruction.model';
import { ApiService, SoldeResponse } from '../../services/api.service';

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
  encaissements: TransactionInstructionDTO[] = [];
  solde: SoldeResponse | null = null;
  isLoading = false;
  errorMessage = '';
  // Remboursements UI state
  refundModalOpen = false;
  refundLoading = false;
  refundError = '';
  refundSuccess = '';
  selectedPaiementForRefund: Paiement | null = null;
  generatedInstructions: TransactionInstructionDTO[] = [];
  refundPendingByReservation: { [reservationId: string]: boolean } = {};
  // Affichage raison remboursement
  reasonModalOpen = false;
  reasonPaiement: Paiement | null = null;
  
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
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.chargerPaiements();
    this.chargerStats();
    this.chargerEncaissementsEtSolde();
    this.refreshPendingRefunds();
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

  chargerEncaissementsEtSolde(): void {
    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) return;
    this.apiService.getEncaissementsLocateur(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (list: TransactionInstructionDTO[]) => {
          this.encaissements = Array.isArray(list) ? list : [];
        },
        error: () => {}
      });
    this.apiService.getSoldeLocateur(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (solde: SoldeResponse) => { this.solde = solde; },
        error: () => {}
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

  // ===== Remboursements (instructions) =====
  rembourserPaiement(paiement: Paiement): void {
    this.openRefund(paiement);
  }

  openRefund(paiement: Paiement): void {
    this.selectedPaiementForRefund = paiement;
    this.generatedInstructions = [];
    this.refundError = '';
    this.refundSuccess = '';
    this.refundModalOpen = true;
  }

  closeRefund(): void {
    this.refundModalOpen = false;
    this.selectedPaiementForRefund = null;
    this.generatedInstructions = [];
    this.refundError = '';
    this.refundSuccess = '';
  }

  async generateRefund(): Promise<void> {
    if (!this.selectedPaiementForRefund) return;
    this.refundLoading = true;
    this.refundError = '';
    this.refundSuccess = '';
    try {
      const reservationId = this.selectedPaiementForRefund.reservationId;
      const instructions = await firstValueFrom(this.apiService.genererRemboursementReservation(reservationId));
      this.generatedInstructions = instructions || [];
      // Indiquer visuellement que le paiement est en cours de remboursement côté locateur
      this.refundPendingByReservation[reservationId] = this.generatedInstructions.some(i => i.statut === 'PENDING');
      this.chargerPaiements();
      this.refundSuccess = this.generatedInstructions.length === 0
        ? 'Aucune instruction générée (annulation < 24h)'
        : `${this.generatedInstructions.length} instruction(s) générée(s).`;
    } catch (e: any) {
      this.refundError = e?.error?.message || 'Erreur lors de la génération du remboursement';
    } finally {
      this.refundLoading = false;
    }
  }

  async executeInstruction(instruction: TransactionInstructionDTO): Promise<void> {
    const reference = prompt('Référence de virement (ex: VIR-2025-000123):');
    if (!reference) return;
    try {
      const updated = await firstValueFrom(this.apiService.executerInstruction(instruction.id, reference));
      this.generatedInstructions = this.generatedInstructions.map(i => i.id === updated.id ? updated : i);
      this.refundSuccess = 'Instruction marquée EXECUTED';
    } catch (e: any) {
      this.refundError = e?.error?.message || 'Erreur lors de l\'exécution de l\'instruction';
    }
  }

  async cancelInstruction(instruction: TransactionInstructionDTO): Promise<void> {
    const notes = prompt('Motif d\'annulation:');
    if (!notes) return;
    try {
      const updated = await firstValueFrom(this.apiService.annulerInstruction(instruction.id, notes));
      this.generatedInstructions = this.generatedInstructions.map(i => i.id === updated.id ? updated : i);
      this.refundSuccess = 'Instruction marquée CANCELLED';
    } catch (e: any) {
      this.refundError = e?.error?.message || 'Erreur lors de l\'annulation de l\'instruction';
    }
  }

  async executeAllInstructions(): Promise<void> {
    const pending = this.generatedInstructions.filter(i => i.statut === 'PENDING');
    if (pending.length === 0) {
      this.refundSuccess = 'Aucune instruction en attente';
      return;
    }
    const baseRef = this.generateAutoReference();
    this.refundLoading = true;
    this.refundError = '';
    this.refundSuccess = '';
    try {
      for (let idx = 0; idx < pending.length; idx++) {
        const instr = pending[idx];
        const updated = await firstValueFrom(this.apiService.executerInstruction(instr.id, baseRef));
        this.generatedInstructions = this.generatedInstructions.map(i => i.id === updated.id ? updated : i);
      }
      this.refundSuccess = 'Toutes les instructions ont été exécutées';
      // Recharger les paiements pour que le statut REMBOURSE remonte
      this.chargerPaiements();
    } catch (e: any) {
      this.refundError = e?.error?.message || 'Erreur lors de l\'exécution des instructions';
    } finally {
      this.refundLoading = false;
    }
  }

  hasPendingInstructions(): boolean {
    return this.generatedInstructions.some(i => i.statut === 'PENDING');
  }

  private generateAutoReference(): string {
    const now = new Date();
    const y = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const rand = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `VIR-${y}${mm}${dd}-${hh}${mi}${ss}-${rand}`;
  }

  private refreshPendingRefunds(): void {
    firstValueFrom(this.apiService.listerInstructionsEnAttente())
      .then(list => {
        const map: { [reservationId: string]: boolean } = {};
        (list || []).forEach(i => {
          if (i.reservationId) {
            map[i.reservationId] = true;
          }
        });
        this.refundPendingByReservation = map;
      })
      .catch(() => {});
  }

  // ===== Raison remboursement (locateur) =====
  openReason(paiement: Paiement): void {
    this.reasonPaiement = paiement;
    this.reasonModalOpen = true;
  }

  closeReason(): void {
    this.reasonModalOpen = false;
    this.reasonPaiement = null;
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
