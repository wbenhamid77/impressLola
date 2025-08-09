import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { StadePopupService } from '../../services/stade-popup.service';
import { Stade } from '../../models/stade.model';

@Component({
  selector: 'app-stade-popup',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Popup Informations Stade -->
    <div class="stade-popup-overlay" *ngIf="showPopup" (click)="closePopup()">
      <div class="stade-popup" (click)="$event.stopPropagation()">
        <div class="popup-header">
          <h3>{{ selectedStade?.nom }}</h3>
          <button class="popup-close" (click)="closePopup()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="popup-content" *ngIf="selectedStade">
          <!-- Galerie d'images -->
          <div class="image-gallery">
            <div class="main-image">
              <img 
                [src]="getCurrentImage()" 
                [alt]="selectedStade.nom"
                (error)="onImageError($event)"
                class="stadium-image"
              >
              <div class="image-overlay">
                <div class="capacity-badge">
                  <i class="fas fa-users"></i>
                  {{ formatNumber(selectedStade.capacite) }} places
                </div>
              </div>
            </div>
            
            <div class="image-thumbnails" *ngIf="selectedStade.images && selectedStade.images.length > 1">
              <button 
                *ngFor="let image of selectedStade.images; let i = index"
                class="thumbnail-btn"
                [class.active]="currentImageIndex === i"
                (click)="setCurrentImage(i)"
              >
                <img [src]="image" [alt]="'Image ' + (i + 1)" (error)="onImageError($event)">
              </button>
            </div>
          </div>

          <!-- Informations principales -->
          <div class="stadium-info">
            <div class="info-header">
              <div class="location">
                <i class="fas fa-map-marker-alt"></i>
                <span>{{ selectedStade.ville }}, Maroc</span>
              </div>
              <div class="year-built">
                <i class="fas fa-calendar"></i>
                <span>Construit en {{ selectedStade.dateConstruction }}</span>
              </div>
            </div>

            <div class="description">
              <p>{{ selectedStade.description }}</p>
            </div>

            <!-- Localisation -->
            <div class="location-section">
              <h4>
                <i class="fas fa-map-pin"></i>
                Localisation
              </h4>
              <div class="location-details">
                <div class="location-item">
                  <i class="fas fa-map-marker-alt"></i>
                  <div class="location-text">
                    <strong>Adresse :</strong>
                    <span>{{ selectedStade.adresse }}</span>
                  </div>
                </div>
                <div class="location-item">
                  <i class="fas fa-crosshairs"></i>
                  <div class="location-text">
                    <strong>Coordonnées GPS :</strong>
                    <span>{{ selectedStade.latitude }}, {{ selectedStade.longitude }}</span>
                  </div>
                </div>
              </div>
              
              <!-- Boutons de navigation -->
              <div class="navigation-buttons">
                <button class="nav-btn google-maps-btn" (click)="ouvrirGoogleMaps()" title="Ouvrir dans Google Maps">
                  <i class="fab fa-google"></i>
                  <span>Google Maps</span>
                </button>
                <button class="nav-btn waze-btn" (click)="ouvrirWaze()" title="Ouvrir dans Waze">
                  <i class="fas fa-car"></i>
                  <span>Waze</span>
                </button>
              </div>
            </div>

            <!-- Statistiques rapides -->
            <div class="quick-stats">
              <div class="stat-item">
                <div class="stat-icon">
                  <i class="fas fa-expand-arrows-alt"></i>
                </div>
                <div class="stat-content">
                  <span class="stat-label">Surface de jeu</span>
                  <span class="stat-value">{{ selectedStade.surfaceJeu }}</span>
                </div>
              </div>
              
              <div class="stat-item" *ngIf="selectedStade.equipeResident">
                <div class="stat-icon">
                  <i class="fas fa-home"></i>
                </div>
                <div class="stat-content">
                  <span class="stat-label">Équipe résidente</span>
                  <span class="stat-value">{{ selectedStade.equipeResident }}</span>
                </div>
              </div>
            </div>

            <!-- Équipements -->
            <div class="equipment-section" *ngIf="selectedStade.equipements && selectedStade.equipements.length > 0">
              <h4>
                <i class="fas fa-cogs"></i>
                Équipements et services
              </h4>
              <div class="equipment-grid">
                <div 
                  *ngFor="let equipement of selectedStade.equipements"
                  class="equipment-item"
                >
                  <i class="fas fa-check-circle"></i>
                  <span>{{ equipement }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="popup-actions">
            <button class="btn btn-secondary" (click)="closePopup()">
              <i class="fas fa-times"></i>
              Fermer
            </button>
            <button class="btn btn-primary" (click)="voirSurCarte()">
              <i class="fas fa-map"></i>
              Voir sur la carte
            </button>
            <button class="btn btn-info" (click)="obtenirDirections()">
              <i class="fas fa-directions"></i>
              Itinéraire
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./stade-popup.component.css']
})
export class StadePopupComponent implements OnInit, OnDestroy {
  showPopup = false;
  selectedStade: Stade | null = null;
  currentImageIndex = 0;
  private subscriptions: Subscription[] = [];

  constructor(private stadePopupService: StadePopupService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.stadePopupService.showPopup$.subscribe(show => {
        this.showPopup = show;
        if (show) {
          this.currentImageIndex = 0;
        }
      }),
      this.stadePopupService.selectedStade$.subscribe(stade => {
        this.selectedStade = stade;
        this.currentImageIndex = 0;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  closePopup(): void {
    this.stadePopupService.fermerPopup();
  }

  getCurrentImage(): string {
    if (!this.selectedStade?.images || this.selectedStade.images.length === 0) {
      return '/assets/images/stades/default-stadium.jpg';
    }
    return this.selectedStade.images[this.currentImageIndex] || '/assets/images/stades/default-stadium.jpg';
  }

  setCurrentImage(index: number): void {
    this.currentImageIndex = index;
  }

  onImageError(event: any): void {
    event.target.src = '/assets/images/stades/default-stadium.jpg';
  }

  formatNumber(num: number): string {
    return num.toLocaleString('fr-FR');
  }

  voirSurCarte(): void {
    if (this.selectedStade) {
      // Ouvrir Google Maps avec les coordonnées du stade
      const url = `https://www.google.com/maps?q=${this.selectedStade.latitude},${this.selectedStade.longitude}`;
      window.open(url, '_blank');
    }
  }

  obtenirDirections(): void {
    if (this.selectedStade) {
      // Ouvrir Google Maps avec directions vers le stade
      const url = `https://www.google.com/maps/dir/?api=1&destination=${this.selectedStade.latitude},${this.selectedStade.longitude}`;
      window.open(url, '_blank');
    }
  }

  ouvrirGoogleMaps(): void {
    if (this.selectedStade) {
      const url = `https://www.google.com/maps?q=${this.selectedStade.latitude},${this.selectedStade.longitude}`;
      window.open(url, '_blank');
    }
  }

  ouvrirWaze(): void {
    if (this.selectedStade) {
      const lat = this.selectedStade.latitude;
      const lng = this.selectedStade.longitude;
      const address = `${this.selectedStade.nom}, ${this.selectedStade.adresse}`;
      
      const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes&address=${encodeURIComponent(address)}`;
      window.open(wazeUrl, '_blank');
    }
  }
} 