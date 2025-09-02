import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { StadePopupService } from '../../services/stade-popup.service';
import { Stade } from '../../models/stade.model';
import * as L from 'leaflet';

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
                <span>
                  <ng-container *ngIf="selectedStade.dateConstruction && selectedStade.dateConstruction > 0; else yearUnknown">
                    Construit en {{ selectedStade.dateConstruction }}
                  </ng-container>
                  <ng-template #yearUnknown>
                    Construit en {{ selectedStade.dateCreation ? (selectedStade.dateCreation | date:'yyyy') : '—' }}
                  </ng-template>
                </span>
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
                    <span>{{ selectedStade.adresseComplete || selectedStade.adresse }}</span>
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
              <div class="map-wrapper">
                <div id="stade-map" class="stade-map" aria-label="Carte du stade"></div>
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
                  <span class="stat-value">{{ selectedStade.surfaceJeu || selectedStade.surfaceType || '—' }}</span>
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
              <div class="stat-item" *ngIf="selectedStade.dimensions">
                <div class="stat-icon">
                  <i class="fas fa-ruler-combined"></i>
                </div>
                <div class="stat-content">
                  <span class="stat-label">Dimensions</span>
                  <span class="stat-value">{{ selectedStade.dimensions }}</span>
                </div>
              </div>
              <div class="stat-item" *ngIf="selectedStade.surfaceMetresCarres">
                <div class="stat-icon">
                  <i class="fas fa-border-all"></i>
                </div>
                <div class="stat-content">
                  <span class="stat-label">Surface</span>
                  <span class="stat-value">{{ selectedStade.surfaceMetresCarres }} m²</span>
                </div>
              </div>
              <div class="stat-item" *ngIf="selectedStade.distance !== undefined">
                <div class="stat-icon">
                  <i class="fas fa-route"></i>
                </div>
                <div class="stat-content">
                  <span class="stat-label">Distance</span>
                  <span class="stat-value">{{ selectedStade.distance }} km</span>
                </div>
              </div>
              <div class="stat-item" *ngIf="selectedStade.tempsTrajetFormate || selectedStade.tempsTrajetMinutes">
                <div class="stat-icon">
                  <i class="fas fa-clock"></i>
                </div>
                <div class="stat-content">
                  <span class="stat-label">Temps de trajet</span>
                  <span class="stat-value">{{ selectedStade.tempsTrajetFormate || (selectedStade.tempsTrajetMinutes + ' min') }}</span>
                </div>
              </div>
              <div class="stat-item" *ngIf="selectedStade.modeTransport">
                <div class="stat-icon">
                  <i class="fas fa-car-side"></i>
                </div>
                <div class="stat-content">
                  <span class="stat-label">Transport</span>
                  <span class="stat-value">{{ selectedStade.modeTransport }}</span>
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
            
            <!-- Informations supplémentaires -->
            <div class="extra-info">
              <div class="extra-row" *ngIf="selectedStade.categories?.length">
                <i class="fas fa-layer-group"></i>
                <div>
                  <strong>Catégories</strong>
                  <div>{{ selectedStade.categories?.join(', ') }}</div>
                </div>
              </div>
              <div class="extra-row" *ngIf="selectedStade.prixMin !== undefined">
                <i class="fas fa-tag"></i>
                <div>
                  <strong>Prix</strong>
                  <div>{{ selectedStade.prixMin }} - {{ selectedStade.prixMax }} MAD</div>
                </div>
              </div>
              <div class="extra-row" *ngIf="selectedStade.siteWeb">
                <i class="fas fa-globe"></i>
                <div>
                  <strong>Site Web</strong>
                  <div><a [href]="selectedStade.siteWeb || ''" target="_blank" rel="noopener">{{ selectedStade.siteWeb }}</a></div>
                </div>
              </div>
              <div class="extra-row" *ngIf="selectedStade.telephone">
                <i class="fas fa-phone"></i>
                <div>
                  <strong>Téléphone</strong>
                  <div><a [href]="'tel:' + selectedStade.telephone">{{ selectedStade.telephone }}</a></div>
                </div>
              </div>
              <div class="extra-row" *ngIf="selectedStade.estActif !== undefined">
                <i class="fas" [ngClass]="selectedStade.estActif ? 'fa-check-circle text-emerald-600' : 'fa-times-circle text-rose-600'"></i>
                <div>
                  <strong>Statut</strong>
                  <div>{{ selectedStade.estActif ? 'Actif' : 'Inactif' }}</div>
                </div>
              </div>
              <div class="extra-row" *ngIf="selectedStade.dateCreation">
                <i class="fas fa-calendar-plus"></i>
                <div>
                  <strong>Créé le</strong>
                  <div>{{ selectedStade.dateCreation | date:'dd/MM/yyyy HH:mm' }}</div>
                </div>
              </div>
              <div class="extra-row" *ngIf="selectedStade.dateModification">
                <i class="fas fa-calendar-check"></i>
                <div>
                  <strong>Modifié le</strong>
                  <div>{{ selectedStade.dateModification | date:'dd/MM/yyyy HH:mm' }}</div>
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
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  constructor(private stadePopupService: StadePopupService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.stadePopupService.showPopup$.subscribe(show => {
        this.showPopup = show;
        if (show) {
          this.currentImageIndex = 0;
          // Initialiser la carte légèrement après l'ouverture pour garantir le rendu
          setTimeout(() => this.initMap(), 150);
        } else {
          this.destroyMap();
        }
      }),
      this.stadePopupService.selectedStade$.subscribe(stade => {
        this.selectedStade = stade;
        this.currentImageIndex = 0;
        // Rafraîchir la carte si déjà ouverte
        setTimeout(() => this.initMap(), 150);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.destroyMap();
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

  private initMap(): void {
    if (!this.showPopup || !this.selectedStade) return;
    const container = document.getElementById('stade-map');
    if (!container) return;

    // Si le container a déjà une carte, la détruire
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    const lat = Number(this.selectedStade.latitude);
    const lng = Number(this.selectedStade.longitude);
    if (isNaN(lat) || isNaN(lng)) return;

    this.map = L.map('stade-map', {
      center: [lat, lng],
      zoom: 15,
      scrollWheelZoom: true,
      attributionControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    this.marker = L.marker([lat, lng]).addTo(this.map);

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);
  }

  private destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }
} 