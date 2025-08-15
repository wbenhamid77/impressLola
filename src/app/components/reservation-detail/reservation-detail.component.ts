import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { EntityDetailsService, ReservationDetails } from '../../services/entity-details.service';

@Component({
  selector: 'app-reservation-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservation-detail.component.html',
  styleUrls: ['./reservation-detail.component.css']
})
export class ReservationDetailComponent implements OnInit {
  reservation: ReservationDetails | null = null;
  loading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private entityDetailsService: EntityDetailsService
  ) {}

  ngOnInit(): void {
    const reservationId = this.route.snapshot.paramMap.get('id');
    if (reservationId) {
      this.chargerReservation(reservationId);
    }
  }

  chargerReservation(id: string): void {
    this.loading = true;
    this.error = '';

    // Pour l'instant, on simule le chargement
    // Vous devrez implémenter une méthode getReservationById dans votre service
    setTimeout(() => {
      this.loading = false;
      // Simulation d'une réservation
      this.reservation = {
        id: id,
        annonce: {
          id: 'annonce-1',
          titre: 'Appartement moderne',
          description: 'Magnifique appartement avec vue sur la ville',
          adresse: {
            id: 'adresse-1',
            rue: 'Rue de la Paix',
            numero: '123',
            codePostal: '75001',
            ville: 'Paris',
            pays: 'France',
            complement: 'Appartement 4ème étage',
            surface: 75,
            locateurId: 'locateur-1',
            nomLocateur: 'Dupont',
            dateCreation: '2025-01-01T00:00:00Z',
            dateModification: '2025-01-01T00:00:00Z',
            estActive: true
          },
          prixParNuit: 150,
          prixParSemaine: 900,
          prixParMois: 3000,
          capacite: 4,
          nombreChambres: 2,
          nombreSallesDeBain: 1,
          typeMaison: 'APPARTEMENT',
          estActive: true,
          dateCreation: '2025-01-01T00:00:00Z',
          dateModification: '2025-01-01T00:00:00Z',
          equipements: ['WiFi', 'Cuisine équipée', 'Climatisation'],
          regles: ['Pas de fumeur', 'Pas d\'animaux'],
          images: [],
          imagesBlob: [],
          noteMoyenne: 4.5,
          nombreAvis: 12,
          locateur: {
            id: 'locateur-1',
            nom: 'Dupont',
            prenom: 'Jean',
            email: 'jean.dupont@example.com',
            telephone: '+33 6 12 34 56 78',
            photoProfil: null,
            description: 'Propriétaire expérimenté',
            noteMoyenne: 4.8,
            nombreAnnonces: 5,
            estVerifie: true,
            raisonSociale: null
          },
          latitude: 48.8566,
          longitude: 2.3522,
          distancesStades: null,
          stadeLePlusProche: null
        },
        locataire: {
          id: 'locataire-1',
          role: 'LOCATAIRE',
          nom: 'Martin',
          prenom: 'Sophie',
          email: 'sophie.martin@example.com',
          telephone: '+33 6 98 76 54 32',
          statutKyc: 'VERIFIE',
          dateInscription: '2025-01-01T00:00:00Z',
          derniereConnexion: '2025-01-01T00:00:00Z',
          estActif: true,
          photoProfil: null,
          dateModification: '2025-01-01T00:00:00Z'
        },
        dateArrivee: '2025-02-01',
        dateDepart: '2025-02-05',
        nombreNuits: 4,
        nombreVoyageurs: 2,
        prixParNuit: 150,
        prixTotal: 600,
        fraisService: 30,
        fraisNettoyage: 50,
        fraisDepot: 200,
        montantTotal: 880,
        statut: 'CONFIRMEE',
        libelleStatut: 'Confirmée',
        messageProprietaire: 'Arrivée prévue vers 15h',
        dateCreation: '2025-01-15T00:00:00Z',
        dateModification: '2025-01-15T00:00:00Z',
        dateConfirmation: '2025-01-15T00:00:00Z',
        dateAnnulation: null,
        raisonAnnulation: null
      };
    }, 1000);
  }

  formaterDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  formaterPrix(prix: number): string {
    return `${prix.toFixed(2)} €`;
  }

  getStatutBadgeClass(): string {
    if (!this.reservation) return '';
    return this.entityDetailsService.getStatusBadgeClassForReservation(this.reservation);
  }

  getAdresseComplete(): string {
    if (!this.reservation) return '';
    return this.entityDetailsService.getFormattedAddressFromReservation(this.reservation);
  }
} 