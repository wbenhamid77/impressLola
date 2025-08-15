import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Annonce {
  id: string;
  titre: string;
  prix: number;
  localisation: string;
  description: string;
}

@Component({
  selector: 'app-annonce-liste',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="annonce-liste-container">
      <h2>🏠 Annonces Disponibles</h2>
      
      <div class="annonces-grid">
        <div *ngFor="let annonce of annonces" class="annonce-card">
          <h3>{{ annonce.titre }}</h3>
          <p><strong>Prix:</strong> {{ annonce.prix }}€/nuit</p>
          <p><strong>Localisation:</strong> {{ annonce.localisation }}</p>
          <p>{{ annonce.description }}</p>
          
          <div class="annonce-actions">
            <button 
              class="btn-reserver" 
              (click)="reserverAnnonce(annonce.id)"
            >
              📅 Réserver cette annonce
            </button>
            
            <button 
              class="btn-details" 
              (click)="voirDetails(annonce.id)"
            >
              👁️ Voir les détails
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .annonce-liste-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .annonces-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    
    .annonce-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }
    
    .annonce-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    
    .annonce-card h3 {
      color: #333;
      margin-bottom: 10px;
    }
    
    .annonce-actions {
      margin-top: 15px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    
    .btn-reserver {
      background: #28a745;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
      transition: background 0.2s;
    }
    
    .btn-reserver:hover {
      background: #218838;
    }
    
    .btn-details {
      background: #007bff;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
      transition: background 0.2s;
    }
    
    .btn-details:hover {
      background: #0056b3;
    }
  `]
})
export class AnnonceListeComponent {
  annonces: Annonce[] = [
    {
      id: '1E8447B6-62C6-40E1-BB9A-2228627D2572',
      titre: '🏖️ Villa avec vue mer',
      prix: 150,
      localisation: 'Nice, Côte d\'Azur',
      description: 'Magnifique villa avec vue panoramique sur la Méditerranée'
    },
    {
      id: '2F9558C7-73D7-51F2-CC0B-3339738E2583',
      titre: '🏔️ Chalet en montagne',
      prix: 120,
      localisation: 'Chamonix, Alpes',
      description: 'Chalet traditionnel au pied des pistes de ski'
    },
    {
      id: '3G0669D8-84E8-62G3-DD1C-4440849F2594',
      titre: '🏰 Appartement en ville',
      prix: 80,
      localisation: 'Paris, Île-de-France',
      description: 'Appartement moderne au cœur de la capitale'
    }
  ];

  constructor(private router: Router) {}

  /**
   * Redirige vers le composant de réservation avec l'ID de l'annonce
   */
  reserverAnnonce(annonceId: string): void {
    console.log('🏠 Réservation de l\'annonce:', annonceId);
    
    // Option 1: Navigation avec query parameters
    this.router.navigate(['/reservation'], { 
      queryParams: { annonceId: annonceId } 
    });
    
    // Option 2: Navigation avec paramètre de route
    // this.router.navigate(['/reservation', annonceId]);
  }

  /**
   * Redirige vers les détails de l'annonce
   */
  voirDetails(annonceId: string): void {
    console.log('👁️ Voir détails de l\'annonce:', annonceId);
    this.router.navigate(['/annonce', annonceId]);
  }
} 