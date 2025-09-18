import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import * as AOS from 'aos';

@Component({
  selector: 'app-annonces',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './annonces.component.html',
  styleUrls: ['./annonces.component.css']
})
export class AnnoncesComponent implements OnInit, AfterViewInit {
  annonces: any[] = [];
  filteredAnnonces: any[] = [];
  isLoading = false;
  errorMessage = '';
  searchTerm = '';
  selectedType = '';
  selectedPrice = '';
  selectedCapacity = '';
  selectedStade = '';
  
  // Propriétés pour les favoris
  favorisMap: { [key: string]: boolean } = {};

  // Propriétés pour la vue et pagination
  viewMode: 'grid' | 'list' = 'grid';
  currentPage = 1;
  itemsPerPage = 12;

  // Propriétés pour le tri
  sortBy = '';

  constructor(
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.chargerAnnonces();
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

  retourAccueil(): void {
    this.router.navigate(['/']);
  }

  voirDetails(annonceId: string): void {
    this.router.navigate(['/detail-annonce', annonceId]);
  }

  reserverAnnonce(annonceId: string): void {
    // TODO: Implémenter la logique de réservation
    console.log('Réservation de l\'annonce:', annonceId);
    alert('Fonctionnalité de réservation à implémenter');
  }

  async ajouterFavori(annonceId: string): Promise<void> {
    const userId = localStorage.getItem('locataireId') || localStorage.getItem('userId');
    if (!userId) {
      alert('Vous devez être connecté pour ajouter aux favoris');
      return;
    }

    try {
      const isCurrentlyFavorite = this.favorisMap[annonceId];
      
      if (isCurrentlyFavorite) {
          // Retirer des favoris
        await this.apiService.retirerDesFavoris(userId, annonceId).toPromise();
              this.favorisMap[annonceId] = false;
        console.log('Annonce retirée des favoris');
        } else {
          // Ajouter aux favoris
        await this.apiService.ajouterAuxFavoris(userId, annonceId).toPromise();
              this.favorisMap[annonceId] = true;
        console.log('Annonce ajoutée aux favoris');
      }
    } catch (error) {
      console.error('Erreur lors de la gestion des favoris:', error);
      alert('Erreur lors de la gestion des favoris');
            }
  }

  // Alias pour la compatibilité avec le template
  async ajouterAuxFavoris(annonceId: string): Promise<void> {
    return this.ajouterFavori(annonceId);
  }

  // Méthode pour basculer l'état des favoris
  toggleFavori(annonceId: string, event: Event): void {
    event.stopPropagation(); // Empêcher la propagation du clic
    this.ajouterFavori(annonceId);
  }

  // Méthode pour la réservation
  reserver(annonceId: string): void {
    event?.stopPropagation(); // Empêcher la propagation du clic
    this.reserverAnnonce(annonceId);
  }

  // Méthode pour effacer la recherche
  clearSearch(): void {
    this.searchTerm = '';
    this.filterAnnonces();
  }

  // Méthode pour changer le mode de vue
  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
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
      filtered = filtered.filter(annonce => annonce.prixParNuit <= maxPrice);
    }

    // Filtre par capacité
    if (this.selectedCapacity) {
      const minCapacity = parseInt(this.selectedCapacity);
      filtered = filtered.filter(annonce => annonce.capacite >= minCapacity);
    }

    // Filtre par stade
    if (this.selectedStade) {
      filtered = filtered.filter(annonce => 
        annonce.stadePlusProche?.toLowerCase().includes(this.selectedStade.toLowerCase())
      );
    }

    this.filteredAnnonces = filtered;
    // Réinitialiser à la première page après filtrage
    this.currentPage = 1;
    
    // Appliquer le tri si nécessaire
    if (this.sortBy) {
      this.sortAnnonces();
    }
  }

  // Méthode de tri des annonces
  sortAnnonces(): void {
    if (!this.sortBy) return;

    this.filteredAnnonces.sort((a, b) => {
      switch (this.sortBy) {
        case 'prix-asc':
          return a.prixParNuit - b.prixParNuit;
        case 'prix-desc':
          return b.prixParNuit - a.prixParNuit;
        case 'note-desc':
          return (b.noteMoyenne || 0) - (a.noteMoyenne || 0);
        case 'distance':
          // Tri par distance du stade (simulation)
          return (a.distanceStade || 0) - (b.distanceStade || 0);
        default:
          return 0;
      }
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedType = '';
    this.selectedPrice = '';
    this.selectedCapacity = '';
    this.selectedStade = '';
    this.sortBy = '';
    this.filteredAnnonces = [...this.annonces];
    this.currentPage = 1;
  }

  // Alias pour la compatibilité avec le template
  clearAllFilters(): void {
    this.clearFilters();
  }

  // Méthodes de pagination
  get totalPages(): number {
    return Math.ceil(this.filteredAnnonces.length / this.itemsPerPage);
  }

  get paginatedAnnonces(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredAnnonces.slice(startIndex, endIndex);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    const halfRange = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, this.currentPage - halfRange);
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  // Méthode de trackBy pour optimiser ngFor
  trackByAnnonceId(index: number, annonce: any): string {
    return annonce.id;
  }

  // Méthodes de statistiques
  getAverageRating(): string {
    const annoncesWithRating = this.filteredAnnonces.filter(annonce => annonce.noteMoyenne > 0);
    if (annoncesWithRating.length === 0) return '0.0';
    
    const totalRating = annoncesWithRating.reduce((sum, annonce) => sum + annonce.noteMoyenne, 0);
    const average = totalRating / annoncesWithRating.length;
    return average.toFixed(1);
  }

  getAveragePrice(): string {
    if (this.filteredAnnonces.length === 0) return '0';
    
    const totalPrice = this.filteredAnnonces.reduce((sum, annonce) => sum + annonce.prixParNuit, 0);
    const average = totalPrice / this.filteredAnnonces.length;
    return Math.round(average).toString();
  }

  getStadesCount(): number {
    const stades = new Set(this.filteredAnnonces.map(annonce => annonce.stadePlusProche).filter(Boolean));
    return stades.size;
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
    const placeholder = img.parentElement?.querySelector('.image-placeholder') as HTMLElement;
    if (placeholder) {
      img.style.display = 'none';
      placeholder.style.display = 'flex';
    }
  }

  // Méthode pour gérer le chargement réussi des images
  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    const placeholder = img.parentElement?.querySelector('.image-placeholder') as HTMLElement;
    if (placeholder) {
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

  // Méthode pour formater les prix
  formaterPrix(prix: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(prix);
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

  // Méthode pour obtenir les étoiles de notation
  getNoteEtoiles(note: number): string[] {
    const etoiles = [];
    for (let i = 1; i <= 5; i++) {
      etoiles.push(i <= note ? '★' : '☆');
    }
    return etoiles;
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