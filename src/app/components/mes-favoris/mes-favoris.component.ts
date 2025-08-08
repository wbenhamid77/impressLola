import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import * as AOS from 'aos';

@Component({
  selector: 'app-mes-favoris',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mes-favoris.component.html',
  styleUrl: './mes-favoris.component.css'
})
export class MesFavorisComponent implements OnInit, AfterViewInit {
  annoncesFavoris: any[] = [];
  filteredAnnonces: any[] = [];
  isLoading = false;
  errorMessage = '';
  searchTerm = '';

  constructor(
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.chargerFavoris();
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

  async chargerFavoris(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      const userId = localStorage.getItem('locataireId') || localStorage.getItem('userId');
      if (!userId) {
        this.errorMessage = 'Utilisateur non connecté';
        return;
      }

      const response = await this.apiService.getAnnoncesFavoris(userId).toPromise();
      
      if (response) {
        this.annoncesFavoris = response;
        this.filteredAnnonces = [...this.annoncesFavoris];
      } else {
        this.annoncesFavoris = [];
        this.filteredAnnonces = [];
      }
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
      this.errorMessage = 'Erreur lors du chargement des favoris';
    } finally {
      this.isLoading = false;
    }
  }

  retourAccueil(): void {
    this.router.navigate(['/']);
  }

  voirDetails(annonceId: string): void {
    this.router.navigate(['/detail-annonce', annonceId]);
  }

  async retirerDesFavoris(annonceId: string): Promise<void> {
    if (confirm('Êtes-vous sûr de vouloir retirer cette annonce de vos favoris ?')) {
      try {
        const userId = localStorage.getItem('locataireId') || localStorage.getItem('userId');
        if (!userId) {
          alert('Utilisateur non connecté');
          return;
        }

        const response = await this.apiService.retirerDesFavoris(userId, annonceId).toPromise();
        console.log('Réponse de retrait des favoris:', response);
        this.annoncesFavoris = this.annoncesFavoris.filter(a => a.id !== annonceId);
        this.filterAnnonces();
        console.log('Annonce retirée des favoris avec succès');
      } catch (error) {
        console.error('Erreur lors du retrait des favoris:', error);
        alert('Erreur lors du retrait de l\'annonce des favoris');
      }
    }
  }

  // Méthodes de filtrage et recherche
  filterAnnonces(): void {
    let filtered = [...this.annoncesFavoris];

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

  // Méthode pour le trackBy de ngFor
  trackByAnnonceId(index: number, annonce: any): string {
    return annonce.id;
  }
} 