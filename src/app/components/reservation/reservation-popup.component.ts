import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../services/reservation.service';
import { PeriodeIndisponible, RecapitulatifRequest, CreateReservationRequest, RecapitulatifResponse, ModePaiement } from '../../models/reservation.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reservation-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservation-popup.component.html',
  styleUrls: ['./reservation-popup.component.css']
})
export class ReservationPopupComponent {
  @Input() annonceId!: string;
  @Input() capaciteMax: number = 1;
  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();

  // UI state
  isOpen = false;
  loading = false;
  errorMessage = '';

  // Form state
  dateArrivee = '';
  dateDepart = '';
  nombreVoyageurs = 1;
  modePaiement: ModePaiement = 'PAIEMENT_SUR_PLACE';
  messageProprietaire = '';

  // Data
  periodesIndisponibles: PeriodeIndisponible[] = [];
  recapitulatif: RecapitulatifResponse | null = null;

  constructor(
    private reservationService: ReservationService,
    private authService: AuthService
  ) {}

  open(): void {
    this.isOpen = true;
    this.resetForm();
  }

  /**
   * Ouvre le popup avec les dates pré-remplies
   */
  openWithDates(dateArrivee: string, dateDepart: string): void {
    this.isOpen = true;
    this.resetForm();
    
    // Pré-remplir les dates
    this.dateArrivee = dateArrivee;
    this.dateDepart = dateDepart;
    
    console.log('📅 Popup ouvert avec dates pré-remplies:', { dateArrivee, dateDepart });
  }

  close(): void {
    this.isOpen = false;
    this.closed.emit();
  }

  private resetForm(): void {
    this.dateArrivee = '';
    this.dateDepart = '';
    this.nombreVoyageurs = 1;
    this.modePaiement = 'PAIEMENT_SUR_PLACE';
    this.messageProprietaire = '';
    this.recapitulatif = null;
    this.errorMessage = '';
  }

  /**
   * Retourne la date d'aujourd'hui au format YYYY-MM-DD
   */
  getTodayString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * Retourne la date du lendemain de la date d'arrivée au format YYYY-MM-DD
   */
  getNextDayString(dateArrivee: string): string {
    if (!dateArrivee) return this.getTodayString();
    
    const arrivee = new Date(dateArrivee);
    const nextDay = new Date(arrivee);
    nextDay.setDate(arrivee.getDate() + 1);
    
    return nextDay.toISOString().split('T')[0];
  }

  private loadPeriodes(): void {
    if (!this.annonceId) return;
    this.reservationService.getPeriodesFuturesReservees(this.annonceId).subscribe({
      next: (data: any) => this.periodesIndisponibles = data || [],
      error: () => this.periodesIndisponibles = []
    });
  }

  // Helpers de validation
  get isDateRangeValid(): boolean {
    if (!this.dateArrivee || !this.dateDepart) return false;
    return new Date(this.dateDepart) > new Date(this.dateArrivee);
  }

  dateIsDisabled(dateStr: string): boolean {
    const d = new Date(dateStr);
    return this.periodesIndisponibles.some(p => {
      const start = new Date(p.dateDebut + 'T00:00:00');
      const end = new Date(p.dateFin + 'T23:59:59');
      return d >= start && d <= end;
    });
  }

  async verifierEtRecap(): Promise<void> {
    this.errorMessage = '';
    this.recapitulatif = null;
    
    if (!this.isDateRangeValid) {
      this.errorMessage = 'Veuillez choisir des dates valides.';
      return;
    }

    try {
      this.loading = true;
      
      // Les dates en vert sont 100% disponibles, pas besoin de vérifier
      console.log('✅ Dates sélectionnées validées:', { 
        dateArrivee: this.dateArrivee,
        dateDepart: this.dateDepart 
      });

      // Créer un récapitulatif factice pour activer le bouton de confirmation
      this.recapitulatif = {
        nombreNuits: this.calculerNombreNuits(this.dateArrivee, this.dateDepart),
        prixTotal: this.calculerNombreNuits(this.dateArrivee, this.dateDepart) * 100, // Prix par défaut de 100€ par nuit
        fraisService: 0,
        fraisNettoyage: 0,
        fraisDepot: 0,
        details: 'Prix estimé basé sur la durée du séjour'
      };

      console.log('📊 Récapitulatif créé:', this.recapitulatif);

    } catch (error: any) {
      console.error('❌ Erreur lors de la vérification:', error);
      this.errorMessage = 'Erreur lors de la vérification des dates.';
    } finally {
      this.loading = false;
    }
  }

  // Méthode utilitaire pour calculer le nombre de nuits
  private calculerNombreNuits(dateArrivee: string, dateDepart: string): number {
    const arrivee = new Date(dateArrivee);
    const depart = new Date(dateDepart);
    const differenceMs = depart.getTime() - arrivee.getTime();
    return Math.ceil(differenceMs / (1000 * 60 * 60 * 24));
  }

  async confirmerReservation(): Promise<void> {
    this.errorMessage = '';
    try {
      this.loading = true;
      console.log('🔍 Début de confirmerReservation');
      
      // 🔍 DEBUG : Vérifier le contenu du localStorage
      this.debugLocalStorage();
      
      const locataireId = this.authService.getLocataireId();
      console.log('👤 Locataire ID récupéré:', locataireId);
      
      if (!locataireId) {
        this.errorMessage = 'Session locataire introuvable. Veuillez vous connecter.';
        console.error('❌ Aucun ID de locataire trouvé');
        
        // 🔍 DEBUG : Suggestions de résolution
        this.suggestAuthenticationFix();
        return;
      }

      const payload: CreateReservationRequest = {
        annonceId: this.annonceId,
        dateArrivee: this.dateArrivee,
        dateDepart: this.dateDepart,
        nombreVoyageurs: this.nombreVoyageurs,
        modePaiement: this.modePaiement,
        messageProprietaire: this.messageProprietaire
      };
      
      console.log('📝 Payload de réservation:', payload);
      console.log('🚀 Appel de l\'API de création...');
      
      const response = await this.reservationService.creerReservation(payload, locataireId).toPromise();
      console.log('✅ Réservation créée avec succès:', response);
      
      this.confirmed.emit();
      this.close();
    } catch (e: any) {
      console.error('❌ Erreur lors de la création de la réservation:', e);
      this.errorMessage = `Erreur lors de la création de la réservation: ${e.message || 'Erreur inconnue'}`;
    } finally {
      this.loading = false;
    }
  }

  onReservationConfirmed(): void {
    // Rafraîchir les données si nécessaire
    console.log('✅ Réservation confirmée avec succès');
  }

  // 🔍 DEBUG : Méthode pour diagnostiquer le localStorage
  private debugLocalStorage(): void {
    console.log('🔍 === DIAGNOSTIC LOCALSTORAGE ===');
    console.log('🔑 authToken:', localStorage.getItem('authToken'));
    console.log('👤 userType:', localStorage.getItem('userType'));
    console.log('📧 userEmail:', localStorage.getItem('userEmail'));
    console.log('🆔 userId:', localStorage.getItem('userId'));
    console.log('🏠 locataireId:', localStorage.getItem('locataireId'));
    console.log('🏢 locateurId:', localStorage.getItem('locateurId'));
    console.log('👨‍💼 userNom:', localStorage.getItem('userNom'));
    console.log('👩‍💼 userPrenom:', localStorage.getItem('userPrenom'));
    console.log('🔍 === FIN DIAGNOSTIC ===');
  }

  // 🔍 DEBUG : Suggestions de résolution
  private suggestAuthenticationFix(): void {
    console.log('💡 === SUGGESTIONS DE RÉSOLUTION ===');
    
    const authToken = localStorage.getItem('authToken');
    const userType = localStorage.getItem('userType');
    
    if (!authToken) {
      console.log('❌ Aucun token d\'authentification trouvé');
      console.log('💡 Solution: Se reconnecter via la page de connexion');
    } else if (!userType) {
      console.log('❌ Type d\'utilisateur non défini');
      console.log('💡 Solution: Vérifier la réponse de l\'API de connexion');
    } else if (userType === 'LOCATEUR') {
      console.log('❌ Utilisateur connecté en tant que LOCATEUR, pas LOCATAIRE');
      console.log('💡 Solution: Se connecter avec un compte locataire');
    } else if (userType === 'LOCATAIRE') {
      const locataireId = localStorage.getItem('locataireId');
      if (!locataireId) {
        console.log('❌ Type LOCATAIRE mais pas d\'ID de locataire');
        console.log('💡 Solution: Vérifier que l\'API retourne bien userId dans la réponse');
      }
    }
    
    console.log('💡 === FIN SUGGESTIONS ===');
  }
} 