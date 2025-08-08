import { Component, OnInit, HostListener, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LocateurPopupService } from '../../services/locateur-popup.service';
import { LocateurPopupComponent } from '../locateur-popup/locateur-popup.component';
import * as AOS from 'aos';
import * as L from 'leaflet';

@Component({
  selector: 'app-detail-annonce',
  standalone: true,
  imports: [CommonModule, LocateurPopupComponent],
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
  
  // Propriétés pour la carte
  private map: any = null;
  private marker: any = null;
  mapInitialized = false;
  mapError = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private locateurPopupService: LocateurPopupService
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
        // Initialiser la carte immédiatement après le chargement de l'annonce
        this.initMap();
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
    
    if (placeholder && placeholder.classList.contains('image-placeholder')) {
      img.style.display = 'none';
      placeholder.style.display = 'flex';
    } else {
      // If no placeholder, use a default image
      img.src = 'assets/images/default-property.jpg'; // Assumes this default image exists
      img.onerror = null; // Prevent infinite loops if default image also fails
    }
  }

  // Méthode pour gérer le chargement réussi des images
  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    const placeholder = img.nextElementSibling as HTMLElement;
    
    if (placeholder && placeholder.classList.contains('image-placeholder')) {
      placeholder.style.display = 'none';
    }
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
    img.src = '/assets/images/morocco-can2025/morocco-flag.png';
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
    if (!this.annonce || !this.annonce.latitude || !this.annonce.longitude) {
      console.error('Coordonnées manquantes pour Waze');
      return;
    }

    const lat = this.annonce.latitude;
    const lng = this.annonce.longitude;
    const adresse = this.annonce.adresse?.rue 
      ? `${this.annonce.adresse.rue}, ${this.annonce.adresse.ville}, ${this.annonce.adresse.pays}`
      : `${lat}, ${lng}`;

    // URL pour Waze (web et mobile)
    const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes&q=${encodeURIComponent(adresse)}`;
    
    // Ouvrir dans un nouvel onglet
    window.open(wazeUrl, '_blank');
  }
} 