import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LocateurPopupService } from '../../services/locateur-popup.service';
import { LocateurPopupComponent } from '../locateur-popup/locateur-popup.component';
import * as AOS from 'aos';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, LocateurPopupComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit {
  username = '';
  connectionDate = '';
  isLocataire = true;
  
  // Propriétés pour les annonces
  annonces: any[] = [];
  filteredAnnonces: any[] = [];
  isLoading = false;
  errorMessage = '';
  
  // Propriétés pour les favoris
  favorisMap: { [key: string]: boolean } = {};
  
  // Propriétés pour la recherche et filtres
  searchTerm = '';
  selectedType = '';
  selectedPrice = '';
  selectedCapacity = '';
  showFilters = false;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private locateurPopupService: LocateurPopupService
  ) {}

  ngOnInit(): void {
    this.initializeDashboard();
    this.redirigerVersBonDashboard();
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

  initializeDashboard(): void {
    // Simuler les données utilisateur
    this.username = 'Utilisateur';
    this.connectionDate = new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR');
    this.isLocataire = true;
  }

  redirigerVersBonDashboard(): void {
    // Vérifier le rôle de l'utilisateur
    const locataireId = localStorage.getItem('locataireId');
    const locateurId = localStorage.getItem('locateurId');
    const userRole = localStorage.getItem('userRole');

    if (locateurId || userRole === 'LOCATEUR') {
      // Rediriger vers le dashboard des locateurs
      this.router.navigate(['/dashboard-locateur']);
    } else if (locataireId || userRole === 'LOCATAIRE') {
      // Rediriger vers le dashboard des locataires
      this.router.navigate(['/dashboard-locataire']);
    } else {
      // Par défaut, rediriger vers le dashboard des locataires
      this.router.navigate(['/dashboard-locataire']);
    }
  }

  async chargerAnnonces(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      const response = await this.apiService.getAnnonces().toPromise();
      
      if (response) {
        this.annonces = response;
        this.filteredAnnonces = [...this.annonces];
        // Vérifier l'état des favoris pour chaque annonce
        await this.chargerEtatFavoris();
      } else {
        this.annonces = [];
        this.filteredAnnonces = [];
      }
    } catch (error) {
      console.error('Erreur lors du chargement des annonces:', error);
      this.errorMessage = 'Erreur lors du chargement des annonces';
    } finally {
      this.isLoading = false;
    }
  }

  async chargerEtatFavoris(): Promise<void> {
    const userId = localStorage.getItem('locataireId') || localStorage.getItem('userId');
    if (!userId) return;

    for (const annonce of this.annonces) {
      try {
        const isFavorite = await this.apiService.verifierFavoris(userId, annonce.id).toPromise();
        this.favorisMap[annonce.id] = isFavorite || false;
      } catch (error) {
        console.error(`Erreur lors de la vérification des favoris pour l'annonce ${annonce.id}:`, error);
        this.favorisMap[annonce.id] = false;
      }
    }
  }

  // Méthodes de filtrage et recherche
  filterAnnonces(): void {
    let filtered = [...this.annonces];

    // Filtre par recherche textuelle
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(annonce => 
        annonce.titre?.toLowerCase().includes(search) ||
        annonce.description?.toLowerCase().includes(search) ||
        annonce.adresse?.ville?.toLowerCase().includes(search) ||
        annonce.stadePlusProche?.toLowerCase().includes(search)
      );
    }

    // Filtre par type
    if (this.selectedType) {
      filtered = filtered.filter(annonce => annonce.typeMaison === this.selectedType);
    }

    // Filtre par prix
    if (this.selectedPrice) {
      const maxPrice = parseInt(this.selectedPrice);
      filtered = filtered.filter(annonce => annonce.prix <= maxPrice);
    }

    // Filtre par capacité
    if (this.selectedCapacity) {
      const capacity = parseInt(this.selectedCapacity);
      filtered = filtered.filter(annonce => annonce.capacite >= capacity);
    }

    this.filteredAnnonces = filtered;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedType = '';
    this.selectedPrice = '';
    this.selectedCapacity = '';
    this.filteredAnnonces = [...this.annonces];
  }

  // Méthodes utilitaires
  getAverageRating(): string {
    if (this.annonces.length === 0) return '0.0';
    const total = this.annonces.reduce((sum, annonce) => sum + (annonce.noteMoyenne || 0), 0);
    return (total / this.annonces.length).toFixed(1);
  }

  getAveragePrice(): string {
    if (this.annonces.length === 0) return '0€';
    const total = this.annonces.reduce((sum, annonce) => sum + (annonce.prixParNuit || 0), 0);
    return Math.round(total / this.annonces.length) + '€';
  }

  getStadesCount(): number {
    const stades = new Set(this.annonces.map(annonce => annonce.stadePlusProche).filter(Boolean));
    return stades.size;
  }

  // Méthode pour obtenir le chemin de l'image
  getImagePath(imagePath: string): string {
    if (!imagePath) {
      return '';
    }
    
    // Si c'est une image en base64, la retourner directement
    if (imagePath.startsWith('data:image/')) {
      return imagePath;
    }
    
    // Si c'est une URL complète
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Si c'est un chemin absolu
    if (imagePath.startsWith('/')) {
      return imagePath;
    }
    
    // Si c'est un chemin Windows, essayer de le convertir
    if (imagePath.startsWith('C:\\') || imagePath.startsWith('D:\\')) {
      return `file:///${imagePath.replace(/\\/g, '/')}`;
    }
    
    // Si c'est un nom de fichier simple
    if (imagePath.includes('.')) {
      return `/assets/images/${imagePath}`;
    }
    
    // Par défaut, retourner l'image du stade
    return '/assets/images/morocco-can2025/football-stadium.jpg';
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const card = img.closest('.annonce-card');
    const placeholder = card?.querySelector('.image-placeholder') as HTMLElement;
    const postImages = card?.querySelector('.post-images') as HTMLElement;
    
    if (img && postImages) {
      img.style.display = 'none';
      if (placeholder) {
        placeholder.style.display = 'flex';
      }
    }
  }

  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    const card = img.closest('.annonce-card');
    const placeholder = card?.querySelector('.image-placeholder') as HTMLElement;
    
    if (img && placeholder) {
      img.style.opacity = '1';
      placeholder.style.display = 'none';
    }
  }

  getStatusClass(estActive: boolean): string {
    return estActive ? 'status-active' : 'status-inactive';
  }

  getStatusIcon(estActive: boolean): string {
    return estActive ? 'fas fa-check-circle' : 'fas fa-times-circle';
  }

  getStatusText(estActive: boolean): string {
    return estActive ? 'Disponible' : 'Indisponible';
  }

  formaterPrix(prix: number): string {
    return prix ? prix + '€' : '0€';
  }

  getTypeMaisonLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'APPARTEMENT': 'Appartement',
      'MAISON': 'Maison',
      'VILLA': 'Villa',
      'STUDIO': 'Studio',
      'CHAMBRE': 'Chambre'
    };
    return labels[type] || type;
  }

  getNoteEtoiles(note: number): string[] {
    const etoiles = [];
    const noteEntiere = Math.floor(note);
    const noteDecimale = note % 1;

    for (let i = 1; i <= 5; i++) {
      if (i <= noteEntiere) {
        etoiles.push('fas fa-star');
      } else if (i === noteEntiere + 1 && noteDecimale > 0) {
        etoiles.push('fas fa-star-half-alt');
      } else {
        etoiles.push('far fa-star');
      }
    }
    return etoiles;
  }

  trackByAnnonceId(index: number, annonce: any): string {
    return annonce.id;
  }

  // Méthodes d'action
  voirDetails(annonceId: string): void {
    this.router.navigate(['/detail-annonce', annonceId]);
  }

  reserverAnnonce(annonceId: string): void {
    // TODO: Implémenter la logique de réservation
    console.log('Réservation de l\'annonce:', annonceId);
    alert('Fonctionnalité de réservation à implémenter');
  }

  ajouterFavori(annonceId: string): void {
    const userId = localStorage.getItem('locataireId') || localStorage.getItem('userId');
    if (!userId) {
      alert('Vous devez être connecté pour ajouter des annonces aux favoris');
      return;
    }

    // Vérifier d'abord si l'annonce est déjà dans les favoris
    this.apiService.verifierFavoris(userId, annonceId).subscribe({
      next: (isFavorite) => {
        if (isFavorite) {
          // Retirer des favoris
          this.apiService.retirerDesFavoris(userId, annonceId).subscribe({
            next: (response) => {
              console.log('Annonce retirée des favoris:', response);
              this.favorisMap[annonceId] = false;
              alert('Annonce retirée de vos favoris');
            },
            error: (error) => {
              console.error('Erreur lors du retrait des favoris:', error);
              alert('Erreur lors du retrait de l\'annonce des favoris');
            }
          });
        } else {
          // Ajouter aux favoris
          this.apiService.ajouterAuxFavoris(userId, annonceId).subscribe({
            next: (response) => {
              console.log('Annonce ajoutée aux favoris:', response);
              this.favorisMap[annonceId] = true;
              alert('Annonce ajoutée à vos favoris');
            },
            error: (error) => {
              console.error('Erreur lors de l\'ajout aux favoris:', error);
              alert('Erreur lors de l\'ajout de l\'annonce aux favoris');
            }
          });
        }
      },
      error: (error) => {
        console.error('Erreur lors de la vérification des favoris:', error);
        alert('Erreur lors de la vérification des favoris');
      }
    });
  }

  // Méthodes de navigation (gardées pour compatibilité)
  voirAnnonces(): void {
    this.router.navigate(['/annonces']);
  }

  ajouterAnnonce(): void {
    this.router.navigate(['/ajouter-annonce']);
  }

  mesAnnonces(): void {
    this.router.navigate(['/mes-annonces']);
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

  getPostTime(dateCreation: string): string {
    if (!dateCreation) {
      return 'Récemment';
    }
    
    const date = new Date(dateCreation);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'À l\'instant';
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    }
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/images/morocco-can2025/morocco-flag.png';
  }

  // Méthode pour voir le profil du locateur
  voirProfilLocateur(locateurId: string): void {
    // Trouver le locateur dans les annonces
    const annonce = this.annonces.find(a => a.locateur?.id === locateurId);
    if (annonce && annonce.locateur) {
      this.locateurPopupService.openPopup(annonce.locateur);
    }
  }

  // Méthode pour fermer la popup
  closeLocateurPopup(): void {
    this.locateurPopupService.closePopup();
  }

  // Méthodes pour les statistiques Facebook-style
  getRandomViews(annonceId?: string): number {
    if (!annonceId) return 45;
    // Générer une valeur déterministe basée sur l'ID de l'annonce
    const hash = this.hashCode(annonceId);
    return Math.abs(hash % 100) + 10; // Valeur entre 10 et 109
  }

  getRandomLikes(annonceId?: string): number {
    if (!annonceId) return 12;
    // Générer une valeur déterministe basée sur l'ID de l'annonce
    const hash = this.hashCode(annonceId);
    return Math.abs(hash % 50) + 5; // Valeur entre 5 et 54
  }

  // Fonction utilitaire pour générer un hash simple
  private hashCode(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  // Méthode pour contacter le locateur
  contacterLocateur(annonceId: string): void {
    // TODO: Implémenter la logique de contact
    console.log('Contact du locateur pour l\'annonce:', annonceId);
    alert('Fonctionnalité de contact à implémenter');
  }

  // Méthodes pour les favoris
  getFavoriIcon(annonceId: string): string {
    return this.favorisMap[annonceId] ? '❤️' : '🤍';
  }

  getFavoriClass(annonceId: string): string {
    return this.favorisMap[annonceId] ? 'favori-active' : 'favori-inactive';
  }

  isFavori(annonceId: string): boolean {
    return this.favorisMap[annonceId] || false;
  }
} 