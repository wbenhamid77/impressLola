import { Component, OnInit, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LocateurPopupService } from '../../services/locateur-popup.service';
import { LocateurPopupComponent } from '../locateur-popup/locateur-popup.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import * as AOS from 'aos';

@Component({
  selector: 'app-dashboard-locataire',
  standalone: true,
  imports: [CommonModule, FormsModule, ScrollingModule],
  templateUrl: './dashboard-locataire.component.html',
  styleUrl: './dashboard-locataire.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardLocataireComponent implements OnInit, AfterViewInit {
  username = '';
  connectionDate = '';
  
  // Propriétés pour les annonces
  annonces: any[] = [];
  filteredAnnonces: any[] = [];
  isLoading = false;
  errorMessage = '';
  
  // Optimisations d'affichage avec CDK
  annoncesToShow: any[] = [];
  private readonly ITEMS_PER_PAGE = 12;
  currentPage = 1; // Commencer à la page 1
  totalPages = 0;
  isLoadMoreVisible = false;
  
  // Virtual scrolling
  itemSize = 400; // Hauteur estimée d'une carte d'annonce
  viewport!: CdkVirtualScrollViewport;
  
  // Skeleton loader optimisé
  skeletonItems = Array(12).fill(0);
  
  // Cache intelligent
  private imageCache = new Map<string, string>();
  private loadedImages = new Set<string>();
  
  // Propriétés pour les favoris
  favorisMap: { [key: string]: boolean } = {};
  favorisLoading: { [key: string]: boolean } = {};
  
  // Cache pour optimiser les performances
  private annoncesCache: any[] = [];
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  // Propriétés pour la recherche et filtres
  searchTerm = '';
  selectedType = '';
  selectedPrice = '';
  selectedCapacity = '';
  showFilters = false;
  
  // Debounce pour la recherche
  private searchTimeout: any;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private locateurPopupService: LocateurPopupService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeDashboard();
    
    // AFFICHAGE IMMÉDIAT - Initialiser avec des données de démonstration
    this.initialiserAffichageImmediat();
    
    // Chargement des vraies données en arrière-plan
    this.chargerAnnoncesRapide();
  }

  // Initialisation immédiate pour affichage instantané
  private initialiserAffichageImmediat(): void {
    // Créer des annonces de démonstration pour affichage immédiat
    this.annoncesToShow = [
      {
        id: 'demo-1',
        titre: 'Chargement des annonces...',
        prixParNuit: 0,
        capacite: 0,
        nombreChambres: 0,
        typeMaison: 'APPARTEMENT',
        images: [],
        adresse: { ville: 'Chargement...', pays: 'Maroc' },
        noteMoyenne: 0,
        nombreAvis: 0,
        estActive: true
      },
      {
        id: 'demo-2',
        titre: 'Chargement des annonces...',
        prixParNuit: 0,
        capacite: 0,
        nombreChambres: 0,
        typeMaison: 'MAISON',
        images: [],
        adresse: { ville: 'Chargement...', pays: 'Maroc' },
        noteMoyenne: 0,
        nombreAvis: 0,
        estActive: true
      },
      {
        id: 'demo-3',
        titre: 'Chargement des annonces...',
        prixParNuit: 0,
        capacite: 0,
        nombreChambres: 0,
        typeMaison: 'STUDIO',
        images: [],
        adresse: { ville: 'Chargement...', pays: 'Maroc' },
        noteMoyenne: 0,
        nombreAvis: 0,
        estActive: true
      }
    ];
    
    this.totalPages = 1;
    this.isLoadMoreVisible = false;
    this.cdr.markForCheck();
  }

  // Méthode de chargement ultra-rapide
  async chargerAnnoncesRapide(): Promise<void> {
    try {
      // Chargement en parallèle du cache et de l'API
      const cachePromise = this.isCacheValid() ? Promise.resolve(this.annoncesCache) : Promise.resolve(null);
      const apiPromise = this.apiService.getAnnonces().toPromise();

      // Utiliser le cache si disponible, sinon attendre l'API
      const [cachedData, apiData] = await Promise.allSettled([cachePromise, apiPromise]);
      
      let annoncesData = null;
      
      if (cachedData.status === 'fulfilled' && cachedData.value) {
        console.log('⚡ Utilisation du cache ultra-rapide');
        annoncesData = cachedData.value;
      } else if (apiData.status === 'fulfilled' && apiData.value) {
        console.log('⚡ Chargement API ultra-rapide');
        annoncesData = apiData.value;
        // Mettre à jour le cache
        this.annoncesCache = [...apiData.value];
        this.cacheTimestamp = Date.now();
      }

      if (annoncesData && annoncesData.length > 0) {
        this.annonces = annoncesData;
        this.filteredAnnonces = [...annoncesData];
        
        // Calculer le nombre total de pages
        this.totalPages = Math.ceil(this.filteredAnnonces.length / this.ITEMS_PER_PAGE);
        
        // REMPLACEMENT IMMÉDIAT des annonces de démonstration - Page 1
        this.currentPage = 1;
        this.loadPage(1);
        
        // Forcer l'affichage immédiat
        this.isLoading = false;
        this.cdr.markForCheck();
        
        // Charger le reste en arrière-plan
        setTimeout(() => {
          this.preloadImages();
          this.chargerEtatFavoris().catch(console.error);
        }, 100);
      } else {
        // Garder les annonces de démonstration si pas de données
        this.annonces = [];
        this.filteredAnnonces = [];
        this.totalPages = 1;
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    } catch (error) {
      console.error('Erreur chargement rapide:', error);
      // Garder les annonces de démonstration en cas d'erreur
      this.isLoading = false;
      this.cdr.markForCheck();
    }
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
    // Récupérer les informations utilisateur depuis le localStorage
    const userNom = localStorage.getItem('userNom') || 'Locataire';
    const userPrenom = localStorage.getItem('userPrenom') || '';
    this.username = `${userPrenom} ${userNom}`.trim() || 'Locataire';
    this.connectionDate = new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR');
  }

  async chargerAnnonces(): Promise<void> {
    try {
      // Vérifier le cache d'abord
      if (this.isCacheValid()) {
        console.log('📦 Utilisation du cache pour les annonces');
        this.annonces = [...this.annoncesCache];
        this.filteredAnnonces = [...this.annonces];
        this.loadPage(1);
        this.cdr.markForCheck();
        
        // Charger les favoris en arrière-plan
        this.chargerEtatFavoris().catch(error => {
          console.error('Erreur lors du chargement des favoris:', error);
        });
        return;
      }

      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.markForCheck();

      console.log('🚀 Chargement des annonces depuis l\'API...');
      const startTime = performance.now();
      
      // Chargement immédiat des premières annonces
      const response = await this.apiService.getAnnonces().toPromise();
      
      const endTime = performance.now();
      console.log(`⚡ Annonces chargées en ${(endTime - startTime).toFixed(2)}ms`);
      
      if (response) {
        this.annonces = response;
        this.filteredAnnonces = [...this.annonces];
        
        // Mettre à jour le cache
        this.annoncesCache = [...response];
        this.cacheTimestamp = Date.now();
        
        // AFFICHAGE IMMÉDIAT - Charger seulement les 6 premières annonces
        this.annoncesToShow = this.filteredAnnonces.slice(0, 6);
        this.isLoadMoreVisible = this.filteredAnnonces.length > 6;
        
        // Forcer l'affichage immédiat
        this.cdr.markForCheck();
        
        // Précharger les images des premières annonces
        setTimeout(() => {
          this.preloadImages();
        }, 0);
        
        // Charger les favoris en arrière-plan (non bloquant)
        setTimeout(() => {
          this.chargerEtatFavoris().catch(error => {
            console.error('Erreur lors du chargement des favoris:', error);
          });
        }, 100);
        
        // Charger le reste des annonces progressivement
        setTimeout(() => {
          this.loadPage(1);
        }, 200);
        
      } else {
        this.annonces = [];
        this.filteredAnnonces = [];
        this.annoncesToShow = [];
      }
    } catch (error) {
      console.error('Erreur lors du chargement des annonces:', error);
      this.errorMessage = 'Erreur lors du chargement des annonces';
      
      // En cas d'erreur, essayer d'utiliser le cache s'il existe
      if (this.annoncesCache.length > 0) {
        console.log('🔄 Utilisation du cache en cas d\'erreur');
        this.annonces = [...this.annoncesCache];
        this.filteredAnnonces = [...this.annonces];
        this.annoncesToShow = this.filteredAnnonces.slice(0, 6);
        this.isLoadMoreVisible = this.filteredAnnonces.length > 6;
        this.errorMessage = 'Données mises en cache (connexion limitée)';
        this.cdr.markForCheck();
      }
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  private isCacheValid(): boolean {
    return this.annoncesCache.length > 0 && 
           (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION;
  }

  // Nouvelle méthode de pagination classique
  loadPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    
    this.currentPage = page;
    const startIndex = (page - 1) * this.ITEMS_PER_PAGE;
    const endIndex = startIndex + this.ITEMS_PER_PAGE;
    
    this.annoncesToShow = this.filteredAnnonces.slice(startIndex, endIndex);
    
    console.log(`📄 Page ${page} chargée: ${this.annoncesToShow.length} annonces`);
    this.cdr.markForCheck();
    
    // Précharger les images des nouvelles annonces
    setTimeout(() => {
      this.preloadImages();
    }, 50);
  }

  private preloadImages(): void {
    // Précharger les images des 6 premières annonces pour un affichage plus rapide
    const annoncesToPreload = this.annoncesToShow.slice(0, 6);
    
    annoncesToPreload.forEach(annonce => {
      if (annonce.images && annonce.images.length > 0) {
        const imagePath = this.getImagePath(annonce.images[0]);
        if (!this.loadedImages.has(imagePath)) {
          this.preloadImage(imagePath);
        }
      }
    });
  }

  private preloadImage(imagePath: string): void {
    if (this.imageCache.has(imagePath)) {
      return;
    }

    const img = new Image();
    img.onload = () => {
      this.loadedImages.add(imagePath);
      this.imageCache.set(imagePath, imagePath);
      this.cdr.markForCheck();
    };
    img.onerror = () => {
      console.warn(`Erreur de chargement de l'image: ${imagePath}`);
    };
    img.src = imagePath;
  }

  // Méthodes de pagination classique
  goToPage(page: number): void {
    this.loadPage(page);
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.loadPage(this.currentPage + 1);
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.loadPage(this.currentPage - 1);
    }
  }

  goToFirstPage(): void {
    this.loadPage(1);
  }

  goToLastPage(): void {
    this.loadPage(this.totalPages);
  }

  // Générer les numéros de pages à afficher
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

  // Méthodes pour la virtualisation CDK
  onViewportChange(): void {
    // Cette méthode est appelée quand la vue change dans le virtual scroll
    this.cdr.markForCheck();
  }

  getItemSize(index: number): number {
    // Retourner la taille de l'élément à l'index donné
    return this.itemSize;
  }

  // Méthode optimisée pour obtenir le chemin de l'image avec cache
  getImagePath(imagePath: string): string {
    if (this.imageCache.has(imagePath)) {
      return this.imageCache.get(imagePath)!;
    }

    if (imagePath.startsWith('data:image/')) {
      this.imageCache.set(imagePath, imagePath);
      return imagePath;
    }
    
    if (imagePath.startsWith('C:\\') || imagePath.startsWith('D:\\')) {
      const convertedPath = `file:///${imagePath.replace(/\\/g, '/')}`;
      this.imageCache.set(imagePath, convertedPath);
      return convertedPath;
    }
    
    this.imageCache.set(imagePath, imagePath);
    return imagePath;
  }

  async chargerEtatFavoris(): Promise<void> {
    const userId = localStorage.getItem('locataireId') || localStorage.getItem('userId');
    if (!userId) return;

    try {
      // Récupérer tous les favoris du locataire d'un coup
      const favoris = await this.apiService.getAnnoncesFavoris(userId).toPromise();
      
      if (favoris && Array.isArray(favoris)) {
        // Créer un Set des IDs des favoris pour une recherche rapide
        const favorisIds = new Set(favoris.map(fav => fav.id));
        
        // Mettre à jour le map des favoris
        for (const annonce of this.annonces) {
          this.favorisMap[annonce.id] = favorisIds.has(annonce.id);
        }
      } else {
        // Si pas de favoris, initialiser tout à false
        for (const annonce of this.annonces) {
          this.favorisMap[annonce.id] = false;
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
      // En cas d'erreur, initialiser tout à false
      for (const annonce of this.annonces) {
        this.favorisMap[annonce.id] = false;
      }
    }
  }

  filterAnnonces(): void {
    // Debounce pour la recherche (éviter trop d'appels)
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchTimeout = setTimeout(() => {
      this.performFilter();
    }, 300); // 300ms de délai
  }

  private performFilter(): void {
    this.filteredAnnonces = this.annonces.filter(annonce => {
      const matchesSearch = !this.searchTerm || 
        annonce.titre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        annonce.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        annonce.adresse?.ville?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesType = !this.selectedType || annonce.typeMaison === this.selectedType;
      
      const matchesPrice = !this.selectedPrice || 
        (this.selectedPrice === '0-50' && annonce.prixParNuit <= 50) ||
        (this.selectedPrice === '51-100' && annonce.prixParNuit > 50 && annonce.prixParNuit <= 100) ||
        (this.selectedPrice === '101-200' && annonce.prixParNuit > 100 && annonce.prixParNuit <= 200) ||
        (this.selectedPrice === '200+' && annonce.prixParNuit > 200);

      const matchesCapacity = !this.selectedCapacity || 
        (this.selectedCapacity === '1-2' && annonce.capacite <= 2) ||
        (this.selectedCapacity === '3-4' && annonce.capacite > 2 && annonce.capacite <= 4) ||
        (this.selectedCapacity === '5-6' && annonce.capacite > 4 && annonce.capacite <= 6) ||
        (this.selectedCapacity === '7+' && annonce.capacite > 6);

      return matchesSearch && matchesType && matchesPrice && matchesCapacity;
    });
    
    // Recalculer le nombre total de pages
    this.totalPages = Math.ceil(this.filteredAnnonces.length / this.ITEMS_PER_PAGE);
    
    // Recharger la première page après filtrage
    this.currentPage = 1;
    this.loadPage(1);
    this.cdr.markForCheck();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedType = '';
    this.selectedPrice = '';
    this.selectedCapacity = '';
    this.filteredAnnonces = [...this.annonces];
    this.totalPages = Math.ceil(this.filteredAnnonces.length / this.ITEMS_PER_PAGE);
    this.currentPage = 1;
    this.loadPage(1);
  }

  // Statistiques pour les locataires
  getAverageRating(): string {
    if (this.annonces.length === 0) return '0.0';
    const totalRating = this.annonces.reduce((sum, annonce) => sum + (annonce.noteMoyenne || 0), 0);
    return (totalRating / this.annonces.length).toFixed(1);
  }

  getAveragePrice(): string {
    if (this.annonces.length === 0) return '0€';
    const totalPrice = this.annonces.reduce((sum, annonce) => sum + (annonce.prixParNuit || 0), 0);
    return Math.round(totalPrice / this.annonces.length) + '€';
  }

  getStadesCount(): number {
    return this.annonces.filter(annonce => annonce.stadePlusProche).length;
  }

  getFavorisCount(): number {
    return Object.values(this.favorisMap).filter(favori => favori).length;
  }

  // Méthodes utilitaires optimisées

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const placeholder = img.nextElementSibling as HTMLElement;
    if (placeholder && placeholder.classList.contains('image-placeholder')) {
      placeholder.style.display = 'flex';
    }
  }

  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.opacity = '1';
  }

  formaterPrix(prix: number): string {
    return prix.toLocaleString('fr-FR') + '€';
  }

  getTypeMaisonLabel(type: string): string {
    const types: { [key: string]: string } = {
      'APPARTEMENT': 'Appartement',
      'MAISON': 'Maison',
      'STUDIO': 'Studio',
      'LOFT': 'Loft',
      'VILLA': 'Villa',
      'CHALET': 'Chalet',
      'MANOIR': 'Manoir',
      'CHATEAU': 'Château',
      'BUNGALOW': 'Bungalow',
      'PENTHOUSE': 'Penthouse',
      'MAISON_DE_VACANCES': 'Maison de vacances',
      'GITE': 'Gîte',
      'CHAMBRE_HOTE': 'Chambre d\'hôte'
    };
    return types[type] || type;
  }

  getNoteEtoiles(note: number): string[] {
    const etoiles = [];
    const noteEntiere = Math.floor(note);
    const noteDecimale = note - noteEntiere;
    
    for (let i = 0; i < 5; i++) {
      if (i < noteEntiere) {
        etoiles.push('★');
      } else if (i === noteEntiere && noteDecimale > 0) {
        etoiles.push('★');
      } else {
        etoiles.push('☆');
      }
    }
    
    return etoiles;
  }

  trackByAnnonceId(index: number, annonce: any): string {
    return annonce.id;
  }

  // Navigation
  voirDetails(annonceId: string): void {
    this.router.navigate(['/detail-annonce', annonceId]);
  }

  reserverAnnonce(annonceId: string): void {
    this.router.navigate(['/reserver', annonceId]);
  }

  async ajouterFavori(annonceId: string): Promise<void> {
    const userId = localStorage.getItem('locataireId') || localStorage.getItem('userId');
    if (!userId) {
      console.error('Utilisateur non connecté');
      return;
    }

    // Éviter les appels multiples simultanés
    if (this.favorisLoading[annonceId]) {
      return;
    }

    try {
      this.favorisLoading[annonceId] = true;
      
      if (this.favorisMap[annonceId]) {
        // Retirer des favoris
        await this.apiService.retirerDesFavoris(userId, annonceId).toPromise();
        this.favorisMap[annonceId] = false;
        console.log(`Annonce ${annonceId} retirée des favoris`);
      } else {
        // Ajouter aux favoris
        await this.apiService.ajouterAuxFavoris(userId, annonceId).toPromise();
        this.favorisMap[annonceId] = true;
        console.log(`Annonce ${annonceId} ajoutée aux favoris`);
      }
    } catch (error) {
      console.error('Erreur lors de la gestion des favoris:', error);
      // En cas d'erreur, ne pas changer l'état visuel
    } finally {
      this.favorisLoading[annonceId] = false;
    }
  }

  voirAnnonces(): void {
    this.router.navigate(['/annonces']);
  }

  voirFavoris(): void {
    this.router.navigate(['/favoris']);
  }

  voirProfil(): void {
    this.router.navigate(['/profil']);
  }

  // Méthodes pour les popups
  getAuthorAvatar(locateur: any): string {
    if (!locateur) return '/assets/images/morocco-can2025/morocco-flag.png';
    
    if (locateur.avatar && locateur.avatar.startsWith('data:image/')) {
      return locateur.avatar;
    }
    
    return '/assets/images/morocco-can2025/morocco-flag.png';
  }

  getAuthorName(locateur: any): string {
    if (!locateur) return 'Propriétaire';
    
    const nom = locateur.nom || '';
    const prenom = locateur.prenom || '';
    
    if (nom && prenom) {
      return `${prenom} ${nom}`;
    } else if (nom) {
      return nom;
    } else if (prenom) {
      return prenom;
    }
    
    return 'Propriétaire';
  }

  voirProfilLocateur(locateurId: string): void {
    // TODO: Implémenter l'ouverture du popup locateur
    console.log('Voir profil locateur:', locateurId);
  }

  closeLocateurPopup(): void {
    // TODO: Implémenter la fermeture du popup locateur
    console.log('Fermer popup locateur');
  }

  contacterLocateur(annonceId: string): void {
    // TODO: Implémenter la logique de contact
    console.log('Contact du locateur pour l\'annonce:', annonceId);
  }

  getFavoriIcon(annonceId: string): string {
    return this.favorisMap[annonceId] ? 'fas fa-heart' : 'far fa-heart';
  }

  getFavoriClass(annonceId: string): string {
    return this.favorisMap[annonceId] ? 'favori-active' : 'favori-inactive';
  }

  isFavori(annonceId: string): boolean {
    return this.favorisMap[annonceId] || false;
  }

  // Déconnexion
  deconnexion(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
} 