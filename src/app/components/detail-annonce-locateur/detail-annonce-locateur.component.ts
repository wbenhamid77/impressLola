import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { ReservationService } from '../../services/reservation.service';
import { CalendrierLocateurComponent } from '../calendrier-locateur/calendrier-locateur.component';
import { Annonce } from '../../models/annonce.model';

@Component({
  selector: 'app-detail-annonce-locateur',
  standalone: true,
  imports: [CommonModule, CalendrierLocateurComponent],
  templateUrl: './detail-annonce-locateur.component.html'
})
export class DetailAnnonceLocateurComponent implements OnInit, AfterViewInit, OnDestroy {
  annonce: Annonce | null = null;
  isLoading = false;
  errorMessage = '';
  calModalOpen = false;
  
  // Statistiques des réservations
  nombreReservationsEnAttente = 0;
  nombreReservationsConfirmees = 0;
  nombreReservationsEnCours = 0;

  // Propriétés pour la galerie d'images
  currentImageIndex = 0;

  // Méthodes pour la navigation des images
  previousImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }

  nextImage(): void {
    if (this.annonce && this.annonce.images && this.currentImageIndex < this.annonce.images.length - 1) {
      this.currentImageIndex++;
    }
  }

  goToImage(index: number): void {
    if (this.annonce && this.annonce.images && index >= 0 && index < this.annonce.images.length) {
      this.currentImageIndex = index;
    }
  }

  // Méthodes utilitaires
  retourAnnonces(): void {
    // Navigation vers la liste des annonces
    console.log('Retour aux annonces');
  }

  getImagePath(imagePath: string): string {
    return imagePath || 'assets/images/placeholder.jpg';
  }

  getStatusClass(isActive: boolean | undefined): string {
    return isActive ? 'status-active' : 'status-inactive';
  }

  getStatusIcon(isActive: boolean | undefined): string {
    return isActive ? 'fa-check-circle' : 'fa-times-circle';
  }

  getStatusText(isActive: boolean | undefined): string {
    return isActive ? 'Disponible' : 'Non disponible';
  }

  getNoteEtoiles(note: number): string[] {
    const etoiles = [];
    const noteArrondie = Math.round(note);
    for (let i = 1; i <= 5; i++) {
      etoiles.push(i <= noteArrondie ? '★' : '☆');
    }
    return etoiles;
  }

  // Statistiques des réservations
  statsReservations = {
    total: 0,
    revenus: 0,
    tauxOccupation: 0
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private reservationService: ReservationService
  ) {}

  ngOnInit(): void {
    this.chargerDetailAnnonce();
    this.chargerStatistiquesReservations();
  }

  ngAfterViewInit(): void {
    // Initialisation après le rendu de la vue
  }

  ngOnDestroy(): void {
    // Nettoyage des ressources
  }

  async chargerDetailAnnonce(): Promise<void> {
    const annonceId = this.route.snapshot.paramMap.get('id');
    if (!annonceId) {
      this.errorMessage = 'ID d\'annonce manquant';
      return;
    }

    try {
      this.isLoading = true;
      this.errorMessage = '';
      
      const result = await firstValueFrom(this.apiService.getAnnonceById(annonceId));
      this.annonce = result || null;
      
      if (!this.annonce) {
        this.errorMessage = 'Annonce non trouvée';
      }

      console.log('✅ Détails de l\'annonce chargés:', this.annonce);

    } catch (error: any) {
      console.error('❌ Erreur lors du chargement de l\'annonce:', error);
      this.errorMessage = 'Erreur lors du chargement de l\'annonce';
    } finally {
      this.isLoading = false;
    }
  }

  async chargerStatistiquesReservations(): Promise<void> {
    const annonceId = this.route.snapshot.paramMap.get('id');
    if (!annonceId) return;

    try {
      // Charger les jours réservés par statut
      const [joursEnAttente, joursConfirmes, joursEnCours] = await Promise.all([
        firstValueFrom(this.reservationService.getJoursReservesParStatut(annonceId, 'EN_ATTENTE')),
        firstValueFrom(this.reservationService.getJoursReservesParStatut(annonceId, 'CONFIRMEE')),
        firstValueFrom(this.reservationService.getJoursReservesParStatut(annonceId, 'EN_COURS'))
      ]);

      this.nombreReservationsEnAttente = joursEnAttente?.length || 0;
      this.nombreReservationsConfirmees = joursConfirmes?.length || 0;
      this.nombreReservationsEnCours = joursEnCours?.length || 0;

      // Calculer les statistiques complètes
      const totalReservations = this.nombreReservationsEnAttente + this.nombreReservationsConfirmees + this.nombreReservationsEnCours;
      const revenus = totalReservations * (this.annonce?.prixParNuit || 0);
      const tauxOccupation = this.annonce ? Math.round((totalReservations / 365) * 100) : 0;

      this.statsReservations = {
        total: totalReservations,
        revenus: revenus,
        tauxOccupation: tauxOccupation
      };

      console.log('📊 Statistiques des réservations chargées:', {
        enAttente: this.nombreReservationsEnAttente,
        confirmes: this.nombreReservationsConfirmees,
        enCours: this.nombreReservationsEnCours,
        total: this.statsReservations.total,
        revenus: this.statsReservations.revenus,
        tauxOccupation: this.statsReservations.tauxOccupation
      });

    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des statistiques:', error);
    }
  }

  /**
   * Affiche toutes les réservations
   */
  voirToutesReservations(): void {
    console.log('📋 Affichage de toutes les réservations');
    // TODO: Implémenter la logique pour afficher toutes les réservations
    // Peut-être naviguer vers une page dédiée ou ouvrir un modal
  }

  /**
   * Exporte le calendrier
   */
  exporterCalendrier(): void {
    console.log('📥 Export du calendrier');
    // TODO: Implémenter la logique d'export du calendrier
    // Peut-être générer un PDF ou un fichier Excel
  }

  /**
   * Modifie l'annonce
   */
  modifierAnnonce(): void {
    if (this.annonce) {
      this.router.navigate(['/modifier-annonce', this.annonce.id]);
    }
  }

  /**
   * Supprime l'annonce
   */
  supprimerAnnonce(): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
      console.log('🗑️ Suppression de l\'annonce:', this.annonce?.id);
      // TODO: Implémenter la logique de suppression
    }
  }

  /**
   * Ajoute des photos à l'annonce
   */
  ajouterPhotos(): void {
    console.log('📸 Ajout de photos');
    // TODO: Implémenter la logique d'ajout de photos
  }

  /**
   * Modifie les informations de l'annonce
   */
  modifierInformations(): void {
    console.log('✏️ Modification des informations');
    // TODO: Implémenter la logique de modification des informations
  }

  /**
   * Modifie le profil du propriétaire
   */
  modifierProfilProprietaire(): void {
    console.log('👤 Modification du profil propriétaire');
    // TODO: Implémenter la logique de modification du profil
  }

  /**
   * Ouvre le popup calendrier (locateur)
   */
  ouvrirCalendrierReservation(): void {
    this.calModalOpen = true;
  }

  /**
   * Ferme le popup calendrier (locateur)
   */
  fermerCalendrierModal(): void {
    this.calModalOpen = false;
  }

  /**
   * Vérifie si un équipement est disponible
   */
  aEquipement(equipement: string): boolean {
    if (!this.annonce || !this.annonce.equipements) return false;
    return this.annonce.equipements.includes(equipement);
  }

  /**
   * Formate l'adresse complète
   */
  getAdresseComplete(): string {
    if (!this.annonce || !this.annonce.adresse) return '';
    const adr = this.annonce.adresse;
    return `${adr.numero} ${adr.rue}, ${adr.codePostal} ${adr.ville}, ${adr.pays}`;
  }
} 