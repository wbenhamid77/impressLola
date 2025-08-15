import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationsLocataireComponent } from '../reservation-locataire/reservations-locataire.component';
import { ReservationsLocateurComponent } from '../reservation-locateur/reservations-locateur.component';
import { ReservationCreateComponent } from './reservation-create.component';

@Component({
  selector: 'app-demo-reservation',
  standalone: true,
  imports: [
    CommonModule,
    ReservationsLocataireComponent,
    ReservationsLocateurComponent,
    ReservationCreateComponent
  ],
  template: `
    <div class="demo-container">
      <h1>Démonstration des Composants de Réservation</h1>
      
      <div class="demo-section">
        <h2>1. Composant Locataire</h2>
        <app-reservations-locataire></app-reservations-locataire>
      </div>
      
      <div class="demo-section">
        <h2>2. Composant Locateur</h2>
        <app-reservations-locateur></app-reservations-locateur>
      </div>
      
      <div class="demo-section">
        <h2>3. Composant de Création</h2>
        <app-reservation-create
          [annonceId]="'demo-123'"
          [locataireId]="'user-456'"
          (reservationCreee)="onReservationCreee($event)"
          (annulation)="onAnnulation()"
        ></app-reservation-create>
      </div>
    </div>
  `,
  styles: [`
    .demo-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .demo-section {
      margin-bottom: 40px;
      padding: 20px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      background: #f8fafc;
    }
    
    .demo-section h2 {
      color: #2d3748;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    h1 {
      text-align: center;
      color: #2d3748;
      margin-bottom: 30px;
      font-size: 2.5rem;
    }
  `]
})
export class DemoReservationComponent {
  
  onReservationCreee(reservation: any): void {
    console.log('Nouvelle réservation créée:', reservation);
    alert(`Réservation créée avec succès ! ID: ${reservation.id}`);
  }
  
  onAnnulation(): void {
    console.log('Création de réservation annulée');
    alert('Création de réservation annulée');
  }
} 