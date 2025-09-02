import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Annonce, Adresse } from '../../models/annonce.model';
import { firstValueFrom } from 'rxjs';
import { CalendrierLocataireComponent } from '../calendrier-locataire/calendrier-locataire.component';
import { ReservationPopupComponent } from '../reservation/reservation-popup.component';

@Component({
  selector: 'app-detail-annonce-locataire',
  standalone: true,
  imports: [CommonModule, CalendrierLocataireComponent, ReservationPopupComponent],
  templateUrl: './detail-annonce-locataire.component.html'
})
export class DetailAnnonceLocataireComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(ReservationPopupComponent) reservationPopup!: ReservationPopupComponent;

  // Propriétés du composant
  annonce: Annonce | null = null;
  isLoading = false;
  errorMessage = '';
  
  // Dates sélectionnées dans le calendrier
  dateArriveeSelectionnee: string = '';
  dateDepartSelectionnee: string = '';

  // Affichage du calendrier dans la section Réserver
  afficherCalendrierReservation = false;

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

  // Bascule l'affichage du calendrier de réservation
  toggleCalendrierReservation(): void {
    this.afficherCalendrierReservation = !this.afficherCalendrierReservation;
  }

  // Ouvre le calendrier et fait défiler vers la section réservation
  ouvrirCalendrierReservation(): void {
    this.afficherCalendrierReservation = true;
    setTimeout(() => {
      const el = document.getElementById('reservation-calendrier');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  // Utilitaires de formatage
  private formatDateIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Actions rapides
  choisirAujourdhui(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    this.dateArriveeSelectionnee = this.formatDateIso(today);
    this.dateDepartSelectionnee = this.formatDateIso(tomorrow);
  }

  choisirCeWeekend(): void {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const day = now.getDay(); // 0=dim .. 6=sam
    // On cible ven->dim du prochain week-end
    const daysUntilFriday = (5 - day + 7) % 7; // 5 = vendredi
    const vendredi = new Date(now);
    vendredi.setDate(now.getDate() + daysUntilFriday);
    const dimanche = new Date(vendredi);
    dimanche.setDate(vendredi.getDate() + 2);
    this.dateArriveeSelectionnee = this.formatDateIso(vendredi);
    this.dateDepartSelectionnee = this.formatDateIso(dimanche);
  }

  choisirSeptNuits(): void {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    this.dateArriveeSelectionnee = this.formatDateIso(start);
    this.dateDepartSelectionnee = this.formatDateIso(end);
  }

  effacerSelection(): void {
    this.effacerToutesDates();
  }

  getNoteEtoiles(note: number): string[] {
    const etoiles = [];
    const noteArrondie = Math.round(note);
    for (let i = 1; i <= 5; i++) {
      etoiles.push(i <= noteArrondie ? '★' : '☆');
    }
    return etoiles;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.chargerDetailAnnonce();
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
      // Pour la démo, créer une annonce par défaut
      this.annonce = this.creerAnnonceDefaut();
      return;
    }

    try {
      this.isLoading = true;
      this.errorMessage = '';
      
      // Essayer de charger depuis l'API
      try {
        const result = await firstValueFrom(this.apiService.getAnnonceById(annonceId));
        this.annonce = result || null;
      } catch (apiError) {
        console.warn('⚠️ Erreur API, utilisation des données d\'exemple:', apiError);
        // En cas d'erreur API, créer une annonce par défaut
        this.annonce = this.creerAnnonceDefaut();
      }
      
      if (!this.annonce) {
        this.errorMessage = 'Annonce non trouvée';
      }

      console.log('✅ Détails de l\'annonce chargés:', this.annonce);

    } catch (error: any) {
      console.error('❌ Erreur lors du chargement de l\'annonce:', error);
      this.errorMessage = 'Erreur lors du chargement de l\'annonce';
      // En cas d'erreur, créer une annonce par défaut
      this.annonce = this.creerAnnonceDefaut();
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Crée une annonce par défaut pour la démo
   */
  private creerAnnonceDefaut(): Annonce {
    return {
      id: 'demo-1',
      titre: 'Appartement moderne au cœur de la ville',
      description: 'Magnifique appartement rénové avec vue panoramique, idéalement situé près des transports et commerces.',
      adresse: {
        id: '1',
        rue: 'Rue de la Paix',
        numero: '15',
        codePostal: '75001',
        ville: 'Paris',
        pays: 'France',
        complement: '3ème étage',
        surface: 65,
        locateurId: '1',
        nomLocateur: 'Marie Dupont',
        dateCreation: new Date().toISOString(),
        dateModification: new Date().toISOString(),
        estActive: true
      },
      prixParNuit: 120,
      prixParSemaine: 750,
      prixParMois: 2800,
      capacite: 4,
      nombreChambres: 2,
      nombreSallesDeBain: 1,
      typeMaison: 'APPARTEMENT',
      estActive: true,
      dateCreation: new Date().toISOString(),
      dateModification: new Date().toISOString(),
      equipements: ['WiFi', 'Parking', 'Climatisation', 'Cuisine équipée'],
      regles: ['Pas de fête', 'Pas d\'animaux', 'Arrivée après 15h', 'Départ avant 11h'],
      images: [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=400&fit=crop',
        'https://images.unsplash.com/photo-1560448075-bb485b067938?w=200&h=80&fit=crop',
        'https://images.unsplash.com/photo-1560448204-60394e4be125?w=200&h=80&fit=crop'
      ],
      noteMoyenne: 4.8,
      nombreAvis: 12,
      locateurId: '1',
      nomLocateur: 'Marie Dupont',
      stadePlusProche: 'Stade de France',
      distanceStade: 8.5,
      adresseStade: '93200 Saint-Denis',
      latitude: 48.9244,
      longitude: 2.3601
    };
  }

  onReservationConfirmed(): void {
    console.log('✅ Réservation confirmée avec succès');
    // Rediriger vers une page de confirmation ou afficher un message
    alert('Réservation confirmée avec succès !');
  }

  // Gestion des dates sélectionnées dans le calendrier
  onDateArriveeChange(date: string): void {
    this.dateArriveeSelectionnee = date;
    console.log('📅 Date d\'arrivée sélectionnée:', date);

    if (this.dateDepartSelectionnee && new Date(date) > new Date(this.dateDepartSelectionnee)) {
      this.dateDepartSelectionnee = '';
      console.log('🔄 Date de départ réinitialisée');
    }
  }

  onDateDepartChange(date: string): void {
    this.dateDepartSelectionnee = date;
    console.log('📅 Date de départ sélectionnée:', date);
  }

  // Ouvrir la réservation avec les dates pré-sélectionnées
  ouvrirReservationAvecDates(): void {
    if (this.dateArriveeSelectionnee && this.dateDepartSelectionnee) {
      console.log('🎯 Ouverture de la réservation avec dates:', this.dateArriveeSelectionnee, this.dateDepartSelectionnee);
      
      // Ouvrir le popup de réservation avec les dates pré-remplies
      if (this.reservationPopup) {
        this.reservationPopup.openWithDates(this.dateArriveeSelectionnee, this.dateDepartSelectionnee);
      } else {
        // Fallback si le ViewChild n'est pas encore disponible
        this.simulerReservation();
      }
    } else {
      console.log('⚠️ Dates non sélectionnées');
      alert('Veuillez sélectionner vos dates de séjour');
    }
  }

  // Simulation de réservation pour la démo
  private simulerReservation(): void {
    const duree = this.calculerDureeSejour();
    const prixTotal = duree * (this.annonce?.prixParNuit || 120);
    
    const confirmation = confirm(
      `Confirmer votre réservation ?\n\n` +
      `Arrivée: ${this.dateArriveeSelectionnee}\n` +
      `Départ: ${this.dateDepartSelectionnee}\n` +
      `Durée: ${duree} jour(s)\n` +
      `Prix total: ${prixTotal}€`
    );
    
    if (confirmation) {
      this.onReservationConfirmed();
    }
  }

  /**
   * Efface la date d'arrivée sélectionnée
   */
  effacerDateArrivee(): void {
    this.dateArriveeSelectionnee = '';
    console.log('🗑️ Date d\'arrivée effacée');
  }

  /**
   * Efface la date de départ sélectionnée
   */
  effacerDateDepart(): void {
    this.dateDepartSelectionnee = '';
    console.log('🗑️ Date de départ effacée');
  }

  /**
   * Calcule la durée du séjour en jours
   */
  calculerDureeSejour(): number {
    if (!this.dateArriveeSelectionnee || !this.dateDepartSelectionnee) {
      return 0;
    }

    const arrivee = new Date(this.dateArriveeSelectionnee);
    const depart = new Date(this.dateDepartSelectionnee);
    const difference = depart.getTime() - arrivee.getTime();
    const jours = Math.ceil(difference / (1000 * 3600 * 24));
    
    return jours;
  }

  /**
   * Simule la sélection de dates pour la démo
   */
  simulerSelectionDates(): void {
    const aujourdhui = new Date();
    const arrivee = new Date(aujourdhui);
    arrivee.setDate(aujourdhui.getDate() + 7); // Dans une semaine
    
    const depart = new Date(arrivee);
    depart.setDate(arrivee.getDate() + 7); // Une semaine plus tard
    
    this.dateArriveeSelectionnee = arrivee.toISOString().split('T')[0];
    this.dateDepartSelectionnee = depart.toISOString().split('T')[0];
    
    console.log('📅 Dates simulées:', this.dateArriveeSelectionnee, this.dateDepartSelectionnee);
  }

  /**
   * Efface toutes les dates sélectionnées
   */
  effacerToutesDates(): void {
    this.dateArriveeSelectionnee = '';
    this.dateDepartSelectionnee = '';
    console.log('🗑️ Toutes les dates effacées');
  }

  /**
   * Obtient l'adresse formatée
   */
  getAdresseFormatee(): string {
    if (!this.annonce) return '';
    const adr = this.annonce.adresse;
    return `${adr.ville}, ${adr.pays}`;
  }

  /**
   * Obtient le type de logement formaté
   */
  getTypeLogementFormate(): string {
    if (!this.annonce) return '';
    const types = {
      'APPARTEMENT': 'Appartement',
      'MAISON': 'Maison',
      'STUDIO': 'Studio',
      'VILLA': 'Villa'
    };
    return types[this.annonce.typeMaison] || this.annonce.typeMaison;
  }

  /**
   * Vérifie si un équipement est disponible
   */
  aEquipement(equipement: string): boolean {
    if (!this.annonce) return false;
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

  /**
   * Ouvre la popup de réservation
   */
  ouvrirReservationPopup(): void {
    this.reservationPopup?.openWithDates(this.dateArriveeSelectionnee, this.dateDepartSelectionnee);
  }

  /**
   * Ferme la popup de réservation
   */
  fermerReservationPopup(): void {
    if (this.reservationPopup) {
      this.reservationPopup.close();
    }
  }
} 