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
  selector: 'app-dashboard-locataire',
  standalone: true,
  imports: [CommonModule, FormsModule, LocateurPopupComponent],
  templateUrl: './dashboard-locataire.component.html',
  styleUrl: './dashboard-locataire.component.css'
})
export class DashboardLocataireComponent implements OnInit, AfterViewInit {
  username = '';
  connectionDate = '';
  
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
    this.chargerAnnonces();
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

  filterAnnonces(): void {
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
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedType = '';
    this.selectedPrice = '';
    this.selectedCapacity = '';
    this.filteredAnnonces = [...this.annonces];
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

  // Méthodes utilitaires
  getImagePath(imagePath: string): string {
    if (imagePath.startsWith('data:image/')) {
      return imagePath;
    }
    
    if (imagePath.startsWith('C:\\') || imagePath.startsWith('D:\\')) {
      return `file:///${imagePath.replace(/\\/g, '/')}`;
    }
    
    return imagePath;
  }

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
    // TODO: Implémenter la logique de réservation
    console.log('Réservation de l\'annonce:', annonceId);
  }

  async ajouterFavori(annonceId: string): Promise<void> {
    const userId = localStorage.getItem('locataireId') || localStorage.getItem('userId');
    if (!userId) {
      console.error('Utilisateur non connecté');
      return;
    }

    try {
      if (this.favorisMap[annonceId]) {
        // Retirer des favoris
        await this.apiService.retirerDesFavoris(userId, annonceId).toPromise();
        this.favorisMap[annonceId] = false;
      } else {
        // Ajouter aux favoris
        await this.apiService.ajouterAuxFavoris(userId, annonceId).toPromise();
        this.favorisMap[annonceId] = true;
      }
    } catch (error) {
      console.error('Erreur lors de la gestion des favoris:', error);
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