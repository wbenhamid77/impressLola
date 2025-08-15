import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ReservationService, Reservation, PeriodeReservee } from '../../services/reservation.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.css']
})
export class ReservationComponent implements OnInit {
  @Input() annonceId: string = ''; // ID de l'annonce reçu en paramètre
  
  reservationForm: FormGroup;
  periodesReservees: PeriodeReservee[] = [];
  joursReserves: string[] = [];
  isLoading = false;
  messageSucces = '';
  messageErreur = '';
  
  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {
    this.reservationForm = this.fb.group({
      annonceId: ['', [Validators.required]], // Sera rempli dynamiquement
      dateArrivee: ['', [Validators.required]],
      dateDepart: ['', [Validators.required]],
      nombreVoyageurs: [1, [Validators.required, Validators.min(1), Validators.max(10)]]
    });
  }

  ngOnInit(): void {
    // Récupérer l'ID de l'annonce depuis les paramètres de route
    this.route.queryParams.subscribe(params => {
      const annonceIdFromRoute = params['annonceId'];
      if (annonceIdFromRoute) {
        this.annonceId = annonceIdFromRoute;
        this.reservationForm.patchValue({ annonceId: this.annonceId });
        console.log('🏠 ID de l\'annonce récupéré depuis la route:', this.annonceId);
      }
    });

    // Mettre à jour l'ID de l'annonce dans le formulaire si reçu en paramètre Input
    if (this.annonceId) {
      this.reservationForm.patchValue({ annonceId: this.annonceId });
    }
    
    this.chargerPeriodesReservees();
    this.chargerJoursReserves();
  }

  chargerPeriodesReservees(): void {
    const annonceId = this.reservationForm.get('annonceId')?.value;
    
    this.reservationService.getPeriodesFuturesReservees(annonceId).subscribe({
      next: (data: PeriodeReservee[]) => {
        this.periodesReservees = data;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des périodes réservées:', error);
        this.messageErreur = 'Impossible de charger les périodes réservées';
      }
    });
  }

  chargerJoursReserves(): void {
    const annonceId = this.reservationForm.get('annonceId')?.value;
    
    this.reservationService.getJoursReserves(annonceId).subscribe({
      next: (data: string[]) => {
        this.joursReserves = data;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des jours réservés:', error);
      }
    });
  }

  onSubmit(): void {
    console.log('🔄 Début de onSubmit()');
    console.log('📋 Formulaire valide:', this.reservationForm.valid);
    console.log('📋 Valeurs du formulaire:', this.reservationForm.value);
    
    if (this.reservationForm.valid) {
      this.isLoading = true;
      this.messageSucces = '';
      this.messageErreur = '';

      const reservation: Reservation = this.reservationForm.value;
      const locataireId = this.authService.getLocataireId();
      
      console.log('👤 Locataire ID récupéré:', locataireId);
      console.log('📝 Données de réservation:', reservation);
      
      if (!locataireId) {
        this.messageErreur = 'Session locataire introuvable. Veuillez vous connecter.';
        this.isLoading = false;
        console.error('❌ Aucun ID de locataire trouvé');
        return;
      }

      console.log('🚀 Appel de l\'API de création de réservation...');
      this.reservationService.creerReservation(reservation, locataireId).subscribe({
        next: (response) => {
          console.log('✅ Réservation créée avec succès:', response);
          this.messageSucces = 'Réservation créée avec succès !';
          this.reservationForm.reset({
            annonceId: this.annonceId || '',
            nombreVoyageurs: 1
          });
          this.chargerPeriodesReservees();
          this.chargerJoursReserves();
        },
        error: (error) => {
          console.error('❌ Erreur lors de la création de la réservation:', error);
          this.messageErreur = `Erreur lors de la création de la réservation: ${error.message || 'Erreur inconnue'}`;
        },
        complete: () => {
          console.log('🏁 Appel API terminé');
          this.isLoading = false;
        }
      });
    } else {
      console.log('❌ Formulaire invalide');
      console.log('📋 Erreurs de validation:', this.reservationForm.errors);
      console.log('📋 État des contrôles:', this.reservationForm.controls);
    }
  }

  estDateReservee(date: string): boolean {
    return this.joursReserves.includes(date);
  }

  getStatutColor(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE': return '#FFA500';
      case 'CONFIRMEE': return '#28a745';
      case 'EN_COURS': return '#007bff';
      default: return '#6c757d';
    }
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE': return 'En attente';
      case 'CONFIRMEE': return 'Confirmée';
      case 'EN_COURS': return 'En cours';
      default: return statut;
    }
  }

  incrementVoyageurs(): void {
    const currentValue = this.reservationForm.get('nombreVoyageurs')?.value || 1;
    if (currentValue < 10) {
      this.reservationForm.patchValue({ nombreVoyageurs: currentValue + 1 });
    }
  }

  decrementVoyageurs(): void {
    const currentValue = this.reservationForm.get('nombreVoyageurs')?.value || 1;
    if (currentValue > 1) {
      this.reservationForm.patchValue({ nombreVoyageurs: currentValue - 1 });
    }
  }

  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
} 