import { Component, OnInit, HostListener, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LocateurPopupService } from '../../services/locateur-popup.service';
import { LocateurPopupComponent } from '../locateur-popup/locateur-popup.component';
import { StadeService } from '../../services/stade.service';
import { StadePopupService } from '../../services/stade-popup.service';
import { StadePopupComponent } from '../stade-popup/stade-popup.component';
import { TousStadesPopupComponent } from '../tous-stades-popup/tous-stades-popup.component';
import { StadeAvecDistance } from '../../models/stade.model';
import { ImageFallbackDirective } from '../../directives/image-fallback.directive';
import * as AOS from 'aos';
import * as L from 'leaflet';
import { ReservationPopupComponent } from '../reservation/reservation-popup.component';
import { CalendrierLocataireComponent } from '../calendrier-locataire/calendrier-locataire.component';
import { CalendrierLocateurComponent } from '../calendrier-locateur/calendrier-locateur.component';

@Component({
  selector: 'app-detail-annonce',
  standalone: true,
  imports: [CommonModule, LocateurPopupComponent, StadePopupComponent, TousStadesPopupComponent, ImageFallbackDirective, ReservationPopupComponent, CalendrierLocataireComponent, CalendrierLocateurComponent],
  templateUrl: './detail-annonce.component.html',
  styleUrl: './detail-annonce.component.css'
})
export class DetailAnnonceComponent implements OnInit, AfterViewInit, OnDestroy {
  annonce: any = null;
  isLoading = true;
  errorMessage = '';
  currentImageIndex = 0;
  isModalOpen = false;
  modalImageIndex = 0;
  
  // Propriétés pour les stades
  stadesProches: StadeAvecDistance[] = [];
  
  // Propriétés pour la carte
  private map: any = null;
  private marker: any = null;
  mapInitialized = false;
  mapError = false;

  // Réservation popup state
  @ViewChild('reservationPopup') reservationPopup?: ReservationPopupComponent;

  // Dates sélectionnées dans le calendrier
  dateArriveeSelectionnee: string = '';
  dateDepartSelectionnee: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private locateurPopupService: LocateurPopupService,
    private stadeService: StadeService,
    private stadePopupService: StadePopupService
  ) {}

  ngOnInit(): void {
    this.chargerDetailAnnonce();
  }

  ngAfterViewInit(): void {
    // Initialize AOS
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
      mirror: false,
      offset: 100,
    });
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  async chargerDetailAnnonce(): Promise<void> {
    try {
    this.isLoading = true;
    this.errorMessage = '';

      const annonceId = this.route.snapshot.paramMap.get('id');
      if (!annonceId) {
        this.errorMessage = 'ID de l\'annonce manquant';
        return;
      }

      const response = await this.apiService.getAnnonceById(annonceId).toPromise();
      
      if (response) {
        this.annonce = response;
        
        // Calculer les stades proches
        if (this.annonce.latitude && this.annonce.longitude) {
          this.stadesProches = this.stadeService.getStadesAvecDistances(
            this.annonce.latitude, 
            this.annonce.longitude
          );
        }
        
        // Initialiser la carte immédiatement après le chargement de l'annonce
        this.initMap();
        
        // Initialiser les placeholders d'images après le rendu
        setTimeout(() => {
          this.initImagePlaceholders();
        }, 100);
      } else {
        this.errorMessage = 'Annonce non trouvée';
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'annonce:', error);
      this.errorMessage = 'Erreur lors du chargement de l\'annonce';
    } finally {
      this.isLoading = false;
    }
  }

  retourAnnonces(): void {
    this.router.navigate(['/annonces']);
  }

  async initMap(): Promise<void> {
    if (!this.annonce || !this.annonce.latitude || !this.annonce.longitude) {
      console.log('Coordonnées manquantes pour la carte');
      return;
    }

    try {
      // Attendre que le DOM soit prêt (délai réduit pour un affichage plus rapide)
      await new Promise(resolve => setTimeout(resolve, 100));

      const mapContainer = document.getElementById('location-map');
      if (!mapContainer) {
        console.error('Container de carte non trouvé');
        return;
      }

      // Coordonnées de l'annonce
      const lat = parseFloat(this.annonce.latitude);
      const lng = parseFloat(this.annonce.longitude);

      // Initialiser la carte
      this.map = L.map('location-map', {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true,
        attributionControl: true
      });

      // Ajouter la couche de tuiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      // Créer un marqueur personnalisé avec les couleurs marocaines
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background: linear-gradient(135deg, #c1272d, #006233);
            color: white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: bold;
            border: 3px solid white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          ">
            <i class="fas fa-home"></i>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      });

      // Ajouter le marqueur
      this.marker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map);

      // Ajouter une popup avec les informations de l'annonce
      const popupContent = `
        <div style="text-align: center; padding: 10px;">
          <h4 style="margin: 0 0 10px 0; color: #c1272d;">${this.annonce.titre}</h4>
          <p style="margin: 5px 0; color: #666;">
            <i class="fas fa-map-marker-alt"></i> 
            ${this.annonce.adresse?.ville || 'Ville'} - ${this.annonce.adresse?.pays || 'Maroc'}
          </p>
          <p style="margin: 5px 0; color: #006233; font-weight: bold;">
            <i class="fas fa-euro-sign"></i> ${this.annonce.prixParNuit}€/nuit
          </p>
        </div>
      `;

      this.marker.bindPopup(popupContent);

      this.mapInitialized = true;
      this.mapError = false;

    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la carte:', error);
      this.mapError = true;
    }
  }

  // Méthode pour obtenir le chemin de l'image
  getImagePath(imagePath: string): string {
    // Si c'est une image en base64, la retourner directement
    if (imagePath.startsWith('data:image/')) {
      return imagePath;
    }
    
    // Si c'est un chemin absolu Windows, essayer de le convertir
    if (imagePath.startsWith('C:\\') || imagePath.startsWith('D:\\')) {
      return `file:///${imagePath.replace(/\\/g, '/')}`;
    }
    
    // Sinon, on suppose que c'est un chemin relatif ou une URL
    return imagePath;
  }

  // Méthode pour gérer les erreurs de chargement d'images
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const placeholder = img.nextElementSibling as HTMLElement;
    
    // Déterminer le type d'image basé sur les classes CSS
    let imageType = 'property';
    if (img.classList.contains('avatar-image')) {
      imageType = 'avatar';
    } else if (img.classList.contains('thumbnail-image') || img.classList.contains('modal-thumbnail-image')) {
      imageType = 'gallery';
    }
    
    if (placeholder && placeholder.classList.contains('image-placeholder')) {
      img.style.display = 'none';
      placeholder.style.display = 'flex';
    } else {
      // Si pas de placeholder, masquer l'image et créer un placeholder
      img.style.display = 'none';
      
      // Créer un placeholder dynamiquement si il n'existe pas
      if (!placeholder || !placeholder.classList.contains('image-placeholder')) {
        const newPlaceholder = document.createElement('div');
        newPlaceholder.className = 'image-placeholder';
        
        // Personnaliser le placeholder selon le type d'image
        let icon = 'fas fa-image';
        let text = 'Photo non disponible';
        
        switch (imageType) {
          case 'avatar':
            icon = 'fas fa-user';
            text = 'Avatar non disponible';
            newPlaceholder.classList.add('avatar-placeholder');
            break;
          case 'gallery':
            icon = 'fas fa-image';
            text = 'Photo non disponible';
            if (img.classList.contains('thumbnail-image')) {
              newPlaceholder.classList.add('thumbnail-placeholder');
            } else if (img.classList.contains('modal-thumbnail-image')) {
              newPlaceholder.classList.add('modal-thumbnail-placeholder');
            }
            break;
          default:
            icon = 'fas fa-home';
            text = 'Photo du logement non disponible';
            break;
        }
        
        newPlaceholder.innerHTML = `
          <i class="${icon}"></i>
          <span>${text}</span>
        `;
        img.parentNode?.insertBefore(newPlaceholder, img.nextSibling);
        newPlaceholder.style.display = 'flex';
      }
    }
  }

  // Méthode pour gérer le chargement réussi des images
  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    const placeholder = img.nextElementSibling as HTMLElement;
    
    // Afficher l'image et masquer le placeholder
    img.style.display = 'block';
    if (placeholder && placeholder.classList.contains('image-placeholder')) {
      placeholder.style.display = 'none';
    }
  }

  // Méthode pour gérer les images avec un timeout
  handleImageWithTimeout(img: HTMLImageElement, timeout: number = 5000): void {
    const timer = setTimeout(() => {
      // Si l'image n'est pas chargée après le timeout, afficher le placeholder
      if (!img.complete || img.naturalWidth === 0) {
        this.onImageError({ target: img } as unknown as Event);
      }
    }, timeout);

    // Si l'image se charge avant le timeout, annuler le timer
    img.onload = () => {
      clearTimeout(timer);
      this.onImageLoad({ target: img } as unknown as Event);
    };
  }

  // Méthodes pour les badges de statut
  getStatusClass(estActive: boolean): string {
    return estActive ? 'status-active' : 'status-inactive';
  }

  getStatusIcon(estActive: boolean): string {
    return estActive ? 'fa-check-circle' : 'fa-pause-circle';
  }

  getStatusText(estActive: boolean): string {
    return estActive ? 'Active' : 'Inactive';
  }

  // Méthodes pour la galerie interactive
  goToImage(index: number): void {
    this.currentImageIndex = index;
  }

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

  // Méthodes pour le modal
  openImageModal(index: number): void {
    this.modalImageIndex = index;
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden'; // Empêcher le scroll
    
    // Refresh AOS after modal opens
    setTimeout(() => {
      AOS.refresh();
    }, 100);
  }

  closeImageModal(): void {
    this.isModalOpen = false;
    document.body.style.overflow = 'auto'; // Réactiver le scroll
  }

  goToModalImage(index: number): void {
    this.modalImageIndex = index;
  }

  previousModalImage(): void {
    if (this.modalImageIndex > 0) {
      this.modalImageIndex--;
    }
  }

  nextModalImage(): void {
    if (this.annonce && this.annonce.images && this.modalImageIndex < this.annonce.images.length - 1) {
      this.modalImageIndex++;
    }
  }

  // Gestion des touches clavier pour le modal
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.isModalOpen) return;

    switch (event.key) {
      case 'Escape':
        this.closeImageModal();
        break;
      case 'ArrowLeft':
        this.previousModalImage();
        break;
      case 'ArrowRight':
        this.nextModalImage();
        break;
    }
  }

  // Méthode pour formater les dates
  formaterDate(date: string): string {
    if (!date) return 'Non spécifiée';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  // Méthode pour obtenir les étoiles de notation
  getNoteEtoiles(note: number): string[] {
    const etoiles = [];
    for (let i = 1; i <= 5; i++) {
      etoiles.push(i <= note ? '★' : '☆');
    }
    return etoiles;
  }

  // Méthode pour obtenir les informations principales
  getInfoItems(): any[] {
    if (!this.annonce) return [];
    
    return [
      {
        icon: 'fas fa-home',
        label: 'Type',
        value: this.getTypeMaisonLabel(this.annonce.typeMaison)
      },
      {
        icon: 'fas fa-bed',
        label: 'Chambres',
        value: `${this.annonce.nombreChambres || 0} chambre${(this.annonce.nombreChambres || 0) > 1 ? 's' : ''}`
      },
      {
        icon: 'fas fa-bath',
        label: 'Salles de bain',
        value: `${this.annonce.nombreSallesDeBain || 0} salle${(this.annonce.nombreSallesDeBain || 0) > 1 ? 's' : ''} de bain`
      },
      {
        icon: 'fas fa-users',
        label: 'Capacité',
        value: `${this.annonce.capacite || 0} personne${(this.annonce.capacite || 0) > 1 ? 's' : ''}`
      }
    ];
  }

  // Méthode pour obtenir les tarifs
  getPricingItems(): any[] {
    if (!this.annonce) return [];
    
    return [
      {
        label: 'Par nuit',
        value: `${this.annonce.prixParNuit || 0}€`,
        details: 'Tarif de base',
        featured: false
      },
      {
        label: 'Par semaine',
        value: `${this.annonce.prixParSemaine || 0}€`,
        details: 'Économisez 15%',
        badge: 'Populaire',
        featured: true
      },
      {
        label: 'Par mois',
        value: `${this.annonce.prixParMois || 0}€`,
        details: 'Économisez 25%',
        featured: false
      }
    ];
  }

  // Méthode pour obtenir le label du type de maison
  getTypeMaisonLabel(type: string): string {
    const types: { [key: string]: string } = {
      'APPARTEMENT': 'Appartement',
      'MAISON': 'Maison',
      'VILLA': 'Villa',
      'STUDIO': 'Studio',
      'CHAMBRE': 'Chambre'
    };
    return types[type] || type;
  }

  // Méthode pour obtenir le badge de statut
  getStatutBadge(estActive: boolean): { class: string, text: string } {
    if (estActive) {
      return { class: 'status-active', text: 'Disponible' };
    } else {
      return { class: 'status-inactive', text: 'Indisponible' };
    }
  }

  // Méthodes pour la popup du locateur
  voirProfilLocateur(locateurId: string): void {
    if (this.annonce && this.annonce.locateur && this.annonce.locateur.id === locateurId) {
      this.locateurPopupService.openPopup(this.annonce.locateur);
    }
  }

  contacterLocateur(annonceId: string): void {
    // TODO: Implémenter la logique de contact
    console.log('Contact du locateur pour l\'annonce:', annonceId);
    alert('Fonctionnalité de contact à implémenter');
  }

  // Méthodes pour les profils des locateurs
  getAuthorAvatar(locateur: any): string {
    if (!locateur) {
      return '/assets/images/morocco-can2025/morocco-flag.png';
    }
    
    if (locateur.photoProfil) {
      return this.getImagePath(locateur.photoProfil);
    }
    
    // Avatar par défaut basé sur le nom
    return '/assets/images/morocco-can2025/morocco-flag.png';
  }

  getAuthorName(locateur: any): string {
    if (!locateur) {
      return 'Propriétaire';
    }
    
    if (locateur.prenom && locateur.nom) {
      return `${locateur.prenom} ${locateur.nom}`;
    }
    
    if (locateur.nom) {
      return locateur.nom;
    }
    
    if (locateur.email) {
      return locateur.email.split('@')[0];
    }
    
    return 'Propriétaire';
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const placeholder = img.nextElementSibling as HTMLElement;
    
    if (placeholder && placeholder.classList.contains('image-placeholder')) {
      img.style.display = 'none';
      placeholder.style.display = 'flex';
    } else {
      // Essayer d'utiliser l'image par défaut
      img.src = this.getDefaultImage('avatar');
      img.onerror = null; // Éviter les boucles infinies
    }
  }

  // Méthode pour obtenir une image par défaut selon le contexte
  getDefaultImage(type: 'property' | 'avatar' | 'gallery' = 'property'): string {
    switch (type) {
      case 'avatar':
        return '/assets/images/morocco-can2025/morocco-flag.png';
      case 'gallery':
        return '/assets/images/default-property.jpg';
      default:
        return '/assets/images/default-property.jpg';
    }
  }

  // Méthode pour vérifier si une image existe
  imageExists(src: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  // Méthode pour initialiser les placeholders d'images
  initImagePlaceholders(): void {
    // Vérifier toutes les images et créer des placeholders si nécessaire
    const images = document.querySelectorAll('img[src]');
    images.forEach((img) => {
      const imageElement = img as HTMLImageElement;
      const placeholder = imageElement.nextElementSibling as HTMLElement;
      
      // Si l'image n'a pas de placeholder, en créer un
      if (!placeholder || !placeholder.classList.contains('image-placeholder')) {
        this.createImagePlaceholder(imageElement);
      }
    });
  }

  // Méthode pour créer un placeholder pour une image
  createImagePlaceholder(img: HTMLImageElement): void {
    const newPlaceholder = document.createElement('div');
    newPlaceholder.className = 'image-placeholder';
    newPlaceholder.style.display = 'none';
    
    // Déterminer le type d'image
    let icon = 'fas fa-image';
    let text = 'Photo non disponible';
    
    if (img.classList.contains('avatar-image')) {
      icon = 'fas fa-user';
      text = 'Avatar non disponible';
      newPlaceholder.classList.add('avatar-placeholder');
    } else if (img.classList.contains('thumbnail-image')) {
      icon = 'fas fa-image';
      text = 'Photo non disponible';
      newPlaceholder.classList.add('thumbnail-placeholder');
    } else if (img.classList.contains('modal-thumbnail-image')) {
      icon = 'fas fa-image';
      text = 'Photo non disponible';
      newPlaceholder.classList.add('modal-thumbnail-placeholder');
    } else if (img.classList.contains('hero-image') || img.classList.contains('modal-image')) {
      icon = 'fas fa-home';
      text = 'Photo du logement non disponible';
    }
    
    newPlaceholder.innerHTML = `
      <i class="${icon}"></i>
      <span>${text}</span>
    `;
    
    img.parentNode?.insertBefore(newPlaceholder, img.nextSibling);
  }

  // Méthodes pour ouvrir les applications de navigation
  ouvrirGoogleMaps(): void {
    if (!this.annonce || !this.annonce.latitude || !this.annonce.longitude) {
      console.error('Coordonnées manquantes pour Google Maps');
      return;
    }

    const lat = this.annonce.latitude;
    const lng = this.annonce.longitude;
    const adresse = this.annonce.adresse?.rue 
      ? `${this.annonce.adresse.rue}, ${this.annonce.adresse.ville}, ${this.annonce.adresse.pays}`
      : `${lat}, ${lng}`;

    // URL pour Google Maps (web et mobile)
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adresse)}`;
    
    // Ouvrir dans un nouvel onglet
    window.open(googleMapsUrl, '_blank');
  }

  ouvrirWaze(): void {
    if (this.annonce && this.annonce.latitude && this.annonce.longitude) {
      const lat = this.annonce.latitude;
      const lng = this.annonce.longitude;
      const address = `${this.annonce.adresse?.numero || ''} ${this.annonce.adresse?.rue || ''}, ${this.annonce.adresse?.ville || ''}`;
      
      const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes&address=${encodeURIComponent(address)}`;
      window.open(wazeUrl, '_blank');
    }
  }

  // Méthodes pour les stades
  ouvrirPopupStade(stade: StadeAvecDistance): void {
    this.stadePopupService.ouvrirPopup(stade);
  }

  ouvrirPopupTousStades(): void {
    if (this.stadesProches.length > 0) {
      const adresseLogement = `${this.annonce.adresse?.numero || ''} ${this.annonce.adresse?.rue || ''}, ${this.annonce.adresse?.ville || ''}`;
      this.stadePopupService.ouvrirTousStadesPopup(this.stadesProches, adresseLogement);
    }
  }

  getStadePlusProche(): StadeAvecDistance | null {
    return this.stadesProches.length > 0 ? this.stadesProches[0] : null;
  }

  getAutresStades(): StadeAvecDistance[] {
    return this.stadesProches.slice(1, 4); // Afficher les 3 autres stades les plus proches
  }

  formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance}km`;
  }

  ouvrirReservation(): void {
    this.reservationPopup?.open();
  }

  onReservationClosed(): void {
    // noop pour l’instant
  }

  onReservationConfirmed(): void {
    // Rafraîchir les données si nécessaire
    console.log('✅ Réservation confirmée avec succès');
  }

  // Gestion des dates sélectionnées dans le calendrier
  onDateArriveeChange(date: string): void {
    this.dateArriveeSelectionnee = date;
    console.log('📅 Date d\'arrivée sélectionnée:', date);
    
    // Si on a une date de départ et qu'elle est avant la date d'arrivée, la réinitialiser
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
      // Ouvrir le popup de réservation avec les dates pré-remplies
      this.reservationPopup?.openWithDates(this.dateArriveeSelectionnee, this.dateDepartSelectionnee);
    } else {
      // Ouvrir le popup normal
      this.reservationPopup?.open();
    }
  }

  /**
   * Vérifie si l'utilisateur connecté est un locataire
   */
  estLocataire(): boolean {
    const userType = localStorage.getItem('userType');
    return userType === 'LOCATAIRE';
  }

  /**
   * Vérifie si l'utilisateur connecté est un locateur
   */
  estLocateur(): boolean {
    const userType = localStorage.getItem('userType');
    return userType === 'LOCATEUR';
  }

  /**
   * Obtient le nombre de réservations en attente
   */
  getNombreReservationsEnAttente(): number {
    // TODO: Implémenter la logique pour récupérer le nombre de réservations en attente
    return 3; // Valeur temporaire
  }

  /**
   * Obtient le nombre de réservations confirmées
   */
  getNombreReservationsConfirmees(): number {
    // TODO: Implémenter la logique pour récupérer le nombre de réservations confirmées
    return 5; // Valeur temporaire
  }

  /**
   * Obtient le nombre de réservations en cours
   */
  getNombreReservationsEnCours(): number {
    // TODO: Implémenter la logique pour récupérer le nombre de réservations en cours
    return 2; // Valeur temporaire
  }

  /**
   * Affiche toutes les réservations
   */
  voirToutesReservations(): void {
    console.log('📋 Affichage de toutes les réservations');
    // TODO: Implémenter la logique pour afficher toutes les réservations
  }

  /**
   * Exporte le calendrier
   */
  exporterCalendrier(): void {
    console.log('📥 Export du calendrier');
    // TODO: Implémenter la logique d'export du calendrier
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
} 