import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, interval, firstValueFrom } from 'rxjs';
import { PaiementService } from '../../services/paiement.service';
import { ApiService, SoldeResponse } from '../../services/api.service';
import { RibDTO } from '../../models/rib.model';
import { AuthService } from '../../services/auth.service';
import { Paiement, StatutPaiement, TypePaiement, ModePaiement, PaiementStats } from '../../models/paiement.model';
import { TransactionInstructionDTO } from '../../models/transaction-instruction.model';

@Component({
  selector: 'app-paiements-locataire',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './paiements-locataire.component.html',
  styleUrls: ['./paiements-locataire.component.css']
})
export class PaiementsLocataireComponent implements OnInit, OnDestroy {
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
  refundReason: string = '';
  generatedInstructions: TransactionInstructionDTO[] = [];
  refundPendingByReservation: { [reservationId: string]: boolean } = {};
  
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
  
  // Timer pour les paiements en attente
  private timer$ = interval(1000);
  private destroy$ = new Subject<void>();

  private paiementService = inject(PaiementService);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.chargerPaiements();
    this.chargerStats();
    this.chargerEncaissementsEtSolde();
    this.demarrerTimer();
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

    this.paiementService.getPaiementsLocataire(userId)
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

    this.paiementService.getStatsPaiements(userId, 'locataire')
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
    this.apiService.getEncaissementsLocataire(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (list: TransactionInstructionDTO[]) => {
          this.encaissements = Array.isArray(list) ? list : [];
        },
        error: () => {}
      });
    this.apiService.getSoldeLocataire(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (solde: SoldeResponse) => { this.solde = solde; },
        error: () => {}
      });
  }

  demarrerTimer(): void {
    this.timer$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Vérifier les paiements expirés
        this.paiementsEnAttente.forEach((paiement: Paiement) => {
          if (this.paiementService.isPaiementExpire(paiement)) {
            this.chargerPaiements();
          }
        });
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
  async effectuerPaiement(paiement: Paiement): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    const locataireId = currentUser?.id;
    if (!locataireId) {
      this.errorMessage = 'Utilisateur non connecté';
      return;
    }

    // Vérifier la présence d'un RIB par défaut pour le locataire
    try {
      const ribs = await firstValueFrom(this.apiService.getRibsLocataire(locataireId));
      const hasDefault = Array.isArray(ribs) && ribs.some(r => r.actif && r.defautCompte);
      if (!hasDefault) {
        // Collecter rapidement les informations RIB (prompt minimal)
        alert('Pour recevoir d\'éventuels remboursements, veuillez renseigner votre RIB.');
        const titulaireNom = prompt('Titulaire du compte (Nom et prénom):');
        const iban = prompt('IBAN (ex: FR76...):');
        const bic = prompt('BIC (ex: AGRIFRPPXXX):');
        const banque = prompt('Banque:');
        if (!titulaireNom || !iban || !bic || !banque) {
          alert('RIB incomplet. Paiement annulé.');
          return;
        }
        await this.apiService.creerRib({
          type: 'LOCATAIRE',
          locataireId,
          titulaireNom,
          iban: iban.replace(/\s+/g, '').toUpperCase(),
          bic: bic.toUpperCase(),
          banque,
          defautCompte: true
        }).toPromise();
      }
    } catch (e) {
      console.warn('Impossible de vérifier/créer le RIB locataire', e);
    }

    // Calculer le split 80/20
    const montantTotal = paiement.montant;
    const montantLocateur = montantTotal * 0.8;  // 80% au locateur
    const montantPlateforme = montantTotal * 0.2;  // 20% à la plateforme

    // Afficher le récapitulatif du split
    const confirmation = confirm(
      `💰 Récapitulatif du paiement:\n\n` +
      `Montant total: ${this.formaterMontant(montantTotal)}\n\n` +
      `Répartition automatique:\n` +
      `• 80% au propriétaire: ${this.formaterMontant(montantLocateur)}\n` +
      `• 20% commission plateforme: ${this.formaterMontant(montantPlateforme)}\n\n` +
      `✅ Les transactions seront générées automatiquement.\n\n` +
      `Confirmer le paiement ?`
    );

    if (!confirmation) {
      return;
    }

    // Simuler le processus de paiement avec PSP
    console.log('🔄 Démarrage du flux de paiement...');
    this.isLoading = true;
    this.errorMessage = '';

    try {
      // Étape 1: Marquer le paiement comme en cours
      console.log('📝 Étape 1: Marquer le paiement en cours...');
      await firstValueFrom(this.paiementService.marquerEnCours(paiement.id));
      
      // Simuler l'attente du PSP (Stripe, PayPal, etc.)
      console.log('💳 Étape 2: Simulation du traitement PSP (2 secondes)...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Générer une référence de transaction simulée
      const numeroTransaction = `TXN-STRIPE-${Date.now()}`;
      const referenceExterne = `pi_${Math.random().toString(36).substring(2, 15)}`;
      
      console.log('✅ Étape 3: Confirmation du paiement avec le backend...');
      console.log('   Numéro transaction:', numeroTransaction);
      console.log('   Référence externe:', referenceExterne);

      // Étape 2: Confirmer le paiement
      // ⚠️ Le backend va automatiquement:
      // - Marquer le paiement comme PAYE
      // - Créer 2 instructions de transaction (80/20) avec statut EXECUTED
      // - Créer une instruction PAYIN (argent du locataire vers la plateforme)
      const paiementConfirme = await firstValueFrom(
        this.paiementService.confirmerPaiement(paiement.id, {
          numeroTransaction,
          referenceExterne,
          metadonnees: JSON.stringify({ 
            gateway: 'stripe_simulation',
            timestamp: new Date().toISOString(),
            split: {
              locateur: montantLocateur,
              plateforme: montantPlateforme
            }
          })
        })
      );

      console.log('✅ Paiement confirmé:', paiementConfirme);

      // Étape 3: Récupérer les instructions de transaction générées
      console.log('📊 Étape 4: Récupération des instructions de transaction...');
      try {
        const instructions = await firstValueFrom(
          this.apiService.getInstructionsByPaiement(paiement.id)
        );
        
        console.log('✅ Instructions récupérées:', instructions);

        // Afficher un récapitulatif détaillé
        const instructionsPayout = instructions.filter(i => i.type === 'PAYOUT_LOCATEUR');
        const instructionsCommission = instructions.filter(i => i.type === 'COMMISSION_PLATEFORME');
        const instructionsPayin = instructions.filter(i => i.type === 'PAYIN_PLATEFORME');

        let message = `✅ Paiement effectué avec succès!\n\n`;
        message += `💳 Numéro de transaction: ${numeroTransaction}\n\n`;
        message += `📊 Transactions générées automatiquement:\n\n`;

        if (instructionsPayout.length > 0) {
          message += `• ${instructionsPayout.length} paiement(s) au propriétaire (80%)\n`;
        }
        if (instructionsCommission.length > 0) {
          message += `• ${instructionsCommission.length} commission(s) plateforme (20%)\n`;
        }
        if (instructionsPayin.length > 0) {
          message += `• ${instructionsPayin.length} encaissement(s) plateforme\n`;
        }

        message += `\n✅ Toutes les transactions ont été exécutées avec succès.`;

        alert(message);
      } catch (instructionError) {
        console.warn('⚠️ Impossible de récupérer les instructions, mais le paiement est confirmé:', instructionError);
        alert(`✅ Paiement effectué avec succès!\n\n💳 Numéro de transaction: ${numeroTransaction}\n\n✅ Les transactions 80/20 ont été générées automatiquement.`);
      }

      // Recharger les données
      this.chargerPaiements();
      this.chargerEncaissementsEtSolde();
      
    } catch (error: any) {
      console.error('❌ Erreur lors du paiement:', error);
      this.errorMessage = error?.error?.message || 'Erreur lors du paiement. Veuillez réessayer.';
      alert(`❌ Erreur lors du paiement: ${this.errorMessage}`);
    } finally {
      this.isLoading = false;
    }
  }

  // ===== Remboursements =====
  openRefund(paiement: Paiement): void {
    this.selectedPaiementForRefund = paiement;
    this.generatedInstructions = [];
    this.refundError = '';
    this.refundSuccess = '';
    this.refundReason = '';
    this.refundModalOpen = true;
    // Charger les instructions en attente pour cette réservation
    firstValueFrom(this.apiService.listerInstructionsEnAttente())
      .then(list => {
        const resId = paiement.reservationId;
        this.generatedInstructions = (list || []).filter(i => i.reservationId === resId);
      })
      .catch(() => {});
  }

  closeRefund(): void {
    this.refundModalOpen = false;
    this.selectedPaiementForRefund = null;
    this.generatedInstructions = [];
    this.refundError = '';
    this.refundSuccess = '';
    this.refundReason = '';
  }

  async generateRefund(): Promise<void> {
    if (!this.selectedPaiementForRefund) return;
    this.refundLoading = true;
    this.refundError = '';
    this.refundSuccess = '';
    try {
      const reservationId = this.selectedPaiementForRefund.reservationId;
      const instructions = await firstValueFrom(this.apiService.genererRemboursementReservation(reservationId, this.refundReason));
      this.generatedInstructions = instructions || [];
      this.refundPendingByReservation[reservationId] = this.generatedInstructions.some(i => i.statut === 'PENDING');
      this.refundSuccess = this.generatedInstructions.length === 0
        ? 'Aucune instruction générée (annulation < 24h)'
        : `${this.generatedInstructions.length} instruction(s) générée(s).`;
      // Met à jour l'affichage du statut pour l'utilisateur locataire
      this.chargerPaiements();
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
      // Mettre à jour localement
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
      // Marquer comme non en attente pour cette réservation
      if (this.selectedPaiementForRefund) {
        this.refundPendingByReservation[this.selectedPaiementForRefund.reservationId] = false;
      }
      // Recharger la liste des paiements pour refléter l'état REMBOURSE côté serveur
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
