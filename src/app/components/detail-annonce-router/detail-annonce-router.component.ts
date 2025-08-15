import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { DetailAnnonceLocataireComponent } from '../detail-annonce-locataire/detail-annonce-locataire.component';
import { DetailAnnonceLocateurComponent } from '../detail-annonce-locateur/detail-annonce-locateur.component';

@Component({
  selector: 'app-detail-annonce-router',
  standalone: true,
  imports: [CommonModule, DetailAnnonceLocataireComponent, DetailAnnonceLocateurComponent],
  template: `
    <ng-container [ngSwitch]="userType">
      <app-detail-annonce-locataire 
        *ngSwitchCase="'LOCATAIRE'">
      </app-detail-annonce-locataire>
      
      <app-detail-annonce-locateur 
        *ngSwitchCase="'LOCATEUR'">
      </app-detail-annonce-locateur>
      
      <div *ngSwitchDefault class="loading-state">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Détermination du type d'utilisateur...</p>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    .loading-state {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }
    
    .loading-spinner {
      text-align: center;
      color: #667eea;
    }
    
    .loading-spinner i {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    .loading-spinner p {
      font-size: 18px;
      margin: 0;
    }
  `]
})
export class DetailAnnonceRouterComponent implements OnInit {
  userType: string | null = null;
  annonceId: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Récupérer l'ID de l'annonce depuis l'URL
    this.annonceId = this.route.snapshot.paramMap.get('id');
    
    // Déterminer le type d'utilisateur
    this.userType = localStorage.getItem('userType');
    
    console.log('🔀 Routage vers la page appropriée:', {
      userType: this.userType,
      annonceId: this.annonceId
    });
    
    // Si pas de type d'utilisateur, rediriger vers la connexion
    if (!this.userType) {
      console.log('⚠️ Aucun type d\'utilisateur détecté, redirection vers la connexion');
      this.router.navigate(['/login']);
      return;
    }
    
    // Si pas d'ID d'annonce, rediriger vers la liste
    if (!this.annonceId) {
      console.log('⚠️ Aucun ID d\'annonce détecté, redirection vers la liste');
      this.router.navigate(['/annonces']);
      return;
    }
  }
} 