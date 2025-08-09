import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { StadePopupService } from '../../services/stade-popup.service';
import { StadeAvecDistance } from '../../models/stade.model';

@Component({
  selector: 'app-tous-stades-popup',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Popup Tous les Stades -->
    <div class="tous-stades-popup-overlay" *ngIf="showPopup" (click)="closePopup()">
      <div class="tous-stades-popup" (click)="$event.stopPropagation()">
        <div class="popup-header">
          <h3>
            <i class="fas fa-futbol"></i>
            Toutes les distances vers les stades
          </h3>
          <button class="popup-close" (click)="closePopup()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="popup-content" *ngIf="stadesAvecDistances.length > 0">
          <!-- Informations de localisation -->
          <div class="location-info">
            <div class="location-header">
              <i class="fas fa-map-marker-alt"></i>
              <span>Depuis votre logement</span>
            </div>
            <p class="location-details">{{ adresseLogement }}</p>
          </div>

          <!-- Liste des stades -->
          <div class="stades-list">
            <div 
              *ngFor="let stade of stadesAvecDistances; let i = index" 
              class="stade-card"
              [class.closest]="i === 0"
              (click)="ouvrirPopupStade(stade)"
            >
              <div class="stade-rank">
                <span class="rank-number">{{ i + 1 }}</span>
                <div class="rank-badge" *ngIf="i === 0">
                  <i class="fas fa-trophy"></i>
                  Plus proche
                </div>
              </div>
              
              <div class="stade-info">
                <div class="stade-main">
                  <h4>{{ stade.nom }}</h4>
                  <p class="stade-ville">{{ stade.ville }}</p>
                  <div class="stade-capacity">
                    <i class="fas fa-users"></i>
                    <span>{{ stade.capacite.toLocaleString('fr-FR') }} places</span>
                  </div>
                </div>
                
                <div class="stade-distance-info">
                  <div class="distance-item">
                    <i class="fas fa-ruler"></i>
                    <span class="distance-value">{{ formatDistance(stade.distance) }}</span>
                  </div>
                  <div class="time-item">
                    <i class="fas fa-clock"></i>
                    <span class="time-value">{{ calculerTempsTrajet(stade.distance) }}</span>
                  </div>
                </div>
              </div>
              
              <div class="stade-actions">
                <button class="btn-stade-details" (click)="ouvrirPopupStade(stade)">
                  <i class="fas fa-info-circle"></i>
                  Détails
                </button>
                <button class="btn-stade-directions" (click)="obtenirDirections(stade)">
                  <i class="fas fa-directions"></i>
                  Itinéraire
                </button>
              </div>
            </div>
          </div>

          <!-- Légende -->
          <div class="legend">
            <div class="legend-item">
              <div class="legend-icon closest"></div>
              <span>Stade le plus proche</span>
            </div>
            <div class="legend-item">
              <i class="fas fa-clock"></i>
              <span>Temps estimé en voiture</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="popup-actions">
          <button class="btn btn-secondary" (click)="closePopup()">
            <i class="fas fa-times"></i>
            Fermer
          </button>
          <button class="btn btn-primary" (click)="ouvrirGoogleMaps()">
            <i class="fas fa-map"></i>
            Voir sur la carte
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./tous-stades-popup.component.css']
})
export class TousStadesPopupComponent implements OnInit, OnDestroy {
  showPopup = false;
  stadesAvecDistances: StadeAvecDistance[] = [];
  adresseLogement = '';
  private subscriptions: Subscription[] = [];

  constructor(private stadePopupService: StadePopupService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.stadePopupService.showTousStadesPopup$.subscribe(show => {
        this.showPopup = show;
      }),
      this.stadePopupService.tousStadesData$.subscribe(data => {
        if (data) {
          this.stadesAvecDistances = data.stades;
          this.adresseLogement = data.adresseLogement;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  closePopup(): void {
    this.stadePopupService.fermerTousStadesPopup();
  }

  formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance}km`;
  }

  calculerTempsTrajet(distance: number): string {
    // Estimation : 60 km/h en moyenne en ville
    const vitesseMoyenne = 60; // km/h
    const tempsMinutes = Math.round((distance / vitesseMoyenne) * 60);
    
    if (tempsMinutes < 60) {
      return `${tempsMinutes} min`;
    } else {
      const heures = Math.floor(tempsMinutes / 60);
      const minutes = tempsMinutes % 60;
      if (minutes === 0) {
        return `${heures}h`;
      } else {
        return `${heures}h${minutes}`;
      }
    }
  }

  ouvrirPopupStade(stade: StadeAvecDistance): void {
    this.stadePopupService.ouvrirPopup(stade);
  }

  obtenirDirections(stade: StadeAvecDistance): void {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${stade.latitude},${stade.longitude}`;
    window.open(url, '_blank');
  }

  ouvrirGoogleMaps(): void {
    // Ouvrir Google Maps avec tous les stades marqués
    const stades = this.stadesAvecDistances.map(stade => 
      `${stade.latitude},${stade.longitude}`
    ).join('|');
    
    const url = `https://www.google.com/maps/dir/${stades}`;
    window.open(url, '_blank');
  }
} 