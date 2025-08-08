import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { LocateurPopupService, Locateur } from '../../services/locateur-popup.service';

@Component({
  selector: 'app-locateur-popup',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Popup Informations Locateur -->
    <div class="locateur-popup-overlay" *ngIf="showPopup" (click)="closePopup()">
      <div class="locateur-popup" (click)="$event.stopPropagation()">
        <div class="popup-header">
          <h3>Profil du Propriétaire</h3>
          <button class="popup-close" (click)="closePopup()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="popup-content" *ngIf="selectedLocateur">
          <!-- Avatar et nom -->
          <div class="locateur-profile">
            <div class="locateur-avatar">
              <img 
                [src]="getAuthorAvatar(selectedLocateur)" 
                [alt]="getAuthorName(selectedLocateur)"
                (error)="onAvatarError($event)"
                class="avatar-image"
              >
            </div>
            <div class="locateur-info">
              <h4 class="locateur-name">{{ getAuthorName(selectedLocateur) }}</h4>
              <div class="locateur-badges">
                <span class="badge verified" *ngIf="selectedLocateur.estVerifie">
                  <i class="fas fa-check-circle"></i>
                  Vérifié
                </span>
                <span class="badge rating" *ngIf="selectedLocateur.noteMoyenne > 0">
                  <i class="fas fa-star"></i>
                  {{ selectedLocateur.noteMoyenne }}/5
                </span>
              </div>
            </div>
          </div>

          <!-- Informations détaillées -->
          <div class="locateur-details">
            <div class="detail-section">
              <h5>Informations de contact</h5>
              <div class="detail-item" *ngIf="selectedLocateur.email">
                <i class="fas fa-envelope"></i>
                <span>{{ selectedLocateur.email }}</span>
              </div>
              <div class="detail-item" *ngIf="selectedLocateur.telephone">
                <i class="fas fa-phone"></i>
                <span>{{ selectedLocateur.telephone }}</span>
              </div>
            </div>

            <div class="detail-section" *ngIf="selectedLocateur.description">
              <h5>À propos</h5>
              <p class="locateur-description">{{ selectedLocateur.description }}</p>
            </div>

            <div class="detail-section" *ngIf="selectedLocateur.raisonSociale">
              <h5>Raison sociale</h5>
              <p class="raison-sociale">{{ selectedLocateur.raisonSociale }}</p>
            </div>

            <div class="detail-section">
              <h5>Statistiques</h5>
              <div class="stats-grid">
                <div class="stat-item">
                  <i class="fas fa-home"></i>
                  <span class="stat-value">{{ selectedLocateur.nombreAnnonces }}</span>
                  <span class="stat-label">Annonces</span>
                </div>
                <div class="stat-item" *ngIf="selectedLocateur.noteMoyenne > 0">
                  <i class="fas fa-star"></i>
                  <span class="stat-value">{{ selectedLocateur.noteMoyenne }}/5</span>
                  <span class="stat-label">Note moyenne</span>
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
            <button class="btn btn-primary" (click)="contacterLocateur(selectedLocateur)">
              <i class="fas fa-comment"></i>
              Contacter
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./locateur-popup.component.css']
})
export class LocateurPopupComponent implements OnInit, OnDestroy {
  showPopup = false;
  selectedLocateur: Locateur | null = null;
  private subscriptions: Subscription[] = [];

  constructor(private locateurPopupService: LocateurPopupService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.locateurPopupService.showPopup$.subscribe(show => {
        this.showPopup = show;
      }),
      this.locateurPopupService.selectedLocateur$.subscribe(locateur => {
        this.selectedLocateur = locateur;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  closePopup(): void {
    this.locateurPopupService.closePopup();
  }

  contacterLocateur(locateur: Locateur): void {
    // TODO: Implémenter la logique de contact
    console.log('Contact du locateur:', locateur);
    alert(`Contact de ${this.getAuthorName(locateur)} - Fonctionnalité à implémenter`);
  }

  // Méthodes utilitaires
  getAuthorAvatar(locateur: Locateur): string {
    if (locateur.photoProfil) {
      return this.getImagePath(locateur.photoProfil);
    }
    return '/assets/images/morocco-can2025/morocco-flag.png';
  }

  getAuthorName(locateur: Locateur): string {
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

  getImagePath(imagePath: string): string {
    if (!imagePath) {
      return '/assets/images/morocco-can2025/morocco-flag.png';
    }
    
    if (imagePath.startsWith('data:image/')) {
      return imagePath;
    }
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    if (imagePath.startsWith('/')) {
      return imagePath;
    }
    
    if (imagePath.startsWith('C:\\') || imagePath.startsWith('D:\\')) {
      return `file:///${imagePath.replace(/\\/g, '/')}`;
    }
    
    if (imagePath.includes('.')) {
      return `/assets/images/${imagePath}`;
    }
    
    return '/assets/images/morocco-can2025/morocco-flag.png';
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/images/morocco-can2025/morocco-flag.png';
  }
} 