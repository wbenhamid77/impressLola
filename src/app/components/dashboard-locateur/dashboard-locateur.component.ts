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
  selector: 'app-dashboard-locateur',
  standalone: true,
  imports: [CommonModule, FormsModule, LocateurPopupComponent],
  templateUrl: './dashboard-locateur.component.html',
  styleUrl: './dashboard-locateur.component.css'
})
export class DashboardLocateurComponent implements OnInit, AfterViewInit {
  username = '';
  connectionDate = '';
  
  // Propriétés pour les annonces du locateur
  mesAnnonces: any[] = [];
  filteredAnnonces: any[] = [];
  isLoading = false;
  errorMessage = '';
  
  // Propriétés pour la recherche et filtres
  searchTerm = '';
  selectedStatus = '';
  selectedType = '';
  showFilters = false;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService,
    private locateurPopupService: LocateurPopupService
  ) {}

  ngOnInit(): void {
    this.initializeDashboard();
    this.chargerMesAnnonces();
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
    const userNom = localStorage.getItem('userNom') || 'Locateur';
    const userPrenom = localStorage.getItem('userPrenom') || '';
    this.username = `${userPrenom} ${userNom}`.trim() || 'Locateur';
    this.connectionDate = new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR');
  }

  async chargerMesAnnonces(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      const locateurId = localStorage.getItem('locateurId') || localStorage.getItem('userId');
      if (!locateurId) {
        this.errorMessage = 'ID du locateur manquant';
        return;
      }

      const response = await this.apiService.getAnnoncesLocateur(locateurId).toPromise();
      
      if (response) {
        this.mesAnnonces = response;
        this.filteredAnnonces = [...this.mesAnnonces];
      } else {
        this.mesAnnonces = [];
        this.filteredAnnonces = [];
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement de mes annonces:', error);
      // Si le backend renvoie 404/204 pour "aucune annonce", on traite comme état vide, sans erreur visible
      const status = error?.status;
      if (status === 404 || status === 204) {
        this.mesAnnonces = [];
        this.filteredAnnonces = [];
        this.errorMessage = '';
      } else {
        this.errorMessage = 'Erreur lors du chargement de mes annonces';
      }
    } finally {
      this.isLoading = false;
    }
  }

  filterAnnonces(): void {
    this.filteredAnnonces = this.mesAnnonces.filter(annonce => {
      const matchesSearch = !this.searchTerm || 
        annonce.titre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        annonce.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        annonce.adresse?.ville?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus = !this.selectedStatus || annonce.estActive === (this.selectedStatus === 'active');
      const matchesType = !this.selectedType || annonce.typeMaison === this.selectedType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedType = '';
    this.filteredAnnonces = [...this.mesAnnonces];
  }

  // Statistiques pour les locateurs
  getTotalAnnonces(): number {
    return this.mesAnnonces.length;
  }

  getAnnoncesActives(): number {
    return this.mesAnnonces.filter(annonce => annonce.estActive).length;
  }

  getAnnoncesInactives(): number {
    return this.mesAnnonces.filter(annonce => !annonce.estActive).length;
  }

  getTotalRevenus(): string {
    const total = this.mesAnnonces.reduce((sum, annonce) => {
      return sum + (annonce.prixParNuit || 0);
    }, 0);
    return total.toLocaleString('fr-FR') + '€';
  }

  getNoteMoyenne(): string {
    if (this.mesAnnonces.length === 0) return '0.0';
    const totalRating = this.mesAnnonces.reduce((sum, annonce) => sum + (annonce.noteMoyenne || 0), 0);
    return (totalRating / this.mesAnnonces.length).toFixed(1);
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

  modifierAnnonce(annonceId: string): void {
    this.router.navigate(['/modifier-annonce', annonceId]);
  }

  async supprimerAnnonce(annonceId: string): Promise<void> {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
      try {
        await this.apiService.supprimerAnnonce(annonceId).toPromise();
        this.chargerMesAnnonces(); // Recharger la liste
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de l\'annonce');
      }
    }
  }

  // Actions du dashboard
  ajouterAnnonce(): void {
    this.router.navigate(['/ajouter-annonce']);
  }

  voirToutesAnnonces(): void {
    this.router.navigate(['/annonces']);
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

  getStatusClass(estActive: boolean): string {
    return estActive ? 'status-active' : 'status-inactive';
  }

  getStatusIcon(estActive: boolean): string {
    return estActive ? 'fas fa-check-circle' : 'fas fa-times-circle';
  }

  getStatusText(estActive: boolean): string {
    return estActive ? 'Active' : 'Inactive';
  }

  formaterDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Déconnexion
  deconnexion(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
 