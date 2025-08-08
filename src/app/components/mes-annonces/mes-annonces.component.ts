import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import * as AOS from 'aos';

@Component({
  selector: 'app-mes-annonces',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mes-annonces.component.html',
  styleUrl: './mes-annonces.component.css'
})
export class MesAnnoncesComponent implements OnInit, AfterViewInit {
  annonces: any[] = [];
  filteredAnnonces: any[] = [];
  isLoading = false;
  errorMessage = '';
  searchTerm = '';
  activeFilter = 'all';

  constructor(
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
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

  async chargerAnnonces(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      const userId = localStorage.getItem('locateurId') || localStorage.getItem('userId');
      if (!userId) {
        this.errorMessage = 'Utilisateur non connecté';
        return;
      }

      const response = await this.apiService.getAnnoncesLocateur(userId).toPromise();
      
      if (response) {
        this.annonces = response;
        this.filteredAnnonces = [...this.annonces];
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

  retourAccueil(): void {
    this.router.navigate(['/']);
  }

  ajouterAnnonce(): void {
    this.router.navigate(['/ajouter-annonce']);
  }

  voirDetails(annonceId: string): void {
    this.router.navigate(['/detail-annonce', annonceId]);
  }

  modifierAnnonce(annonceId: string): void {
    this.router.navigate(['/modifier-annonce', annonceId]);
  }

  supprimerAnnonce(annonceId: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
      this.apiService.supprimerAnnonce(annonceId).subscribe({
        next: (response) => {
          console.log('Réponse de suppression:', response);
          
          // Vérifier si la suppression a réussi (statut 200 ou 204)
          if (response && (response.status === 200 || response.status === 204)) {
            // Supprimer l'annonce de la liste locale
            this.annonces = this.annonces.filter(a => a.id !== annonceId);
            this.filterAnnonces();
            console.log('Annonce supprimée avec succès');
          } else {
            console.error('La suppression a échoué - statut:', response?.status);
            alert('Erreur lors de la suppression de l\'annonce. Veuillez réessayer.');
          }
        },
        error: (error) => {
          console.error('Erreur lors de la suppression:', error);
          alert('Erreur lors de la suppression de l\'annonce. Veuillez réessayer.');
        }
      });
    }
  }

  // Méthodes de filtrage et recherche
  filterAnnonces(): void {
    let filtered = [...this.annonces];

    // Filtre par statut
    if (this.activeFilter === 'active') {
      filtered = filtered.filter(annonce => annonce.estActive);
    } else if (this.activeFilter === 'inactive') {
      filtered = filtered.filter(annonce => !annonce.estActive);
    }

    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(annonce => 
        annonce.titre?.toLowerCase().includes(search) ||
        annonce.description?.toLowerCase().includes(search) ||
        annonce.adresse?.ville?.toLowerCase().includes(search) ||
        annonce.stadePlusProche?.toLowerCase().includes(search)
      );
    }

    this.filteredAnnonces = filtered;
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.filterAnnonces();
  }

  // Méthodes de statistiques
  getActiveAnnoncesCount(): number {
    return this.annonces.filter(annonce => annonce.estActive).length;
  }

  getInactiveAnnoncesCount(): number {
    return this.annonces.filter(annonce => !annonce.estActive).length;
  }

  getAverageRating(): string {
    const annoncesWithRating = this.annonces.filter(annonce => annonce.noteMoyenne > 0);
    if (annoncesWithRating.length === 0) return '0.0';
    
    const totalRating = annoncesWithRating.reduce((sum, annonce) => sum + annonce.noteMoyenne, 0);
    const average = totalRating / annoncesWithRating.length;
    return average.toFixed(1);
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

  // Méthode pour formater les dates
  formaterDate(date: string): string {
    if (!date) return 'Non spécifiée';
    return new Date(date).toLocaleDateString('fr-FR');
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
} 