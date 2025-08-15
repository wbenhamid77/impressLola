import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ReservationService } from '../../services/reservation.service';
import { RecapitulatifRequest, RecapitulatifResponse, CreateReservationRequest } from '../../models/reservation.model';

@Component({
  selector: 'app-reservation-create',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './reservation-create.component.html',
  styleUrls: ['./reservation-create.component.css']
})
export class ReservationCreateComponent implements OnInit, OnDestroy {
  @Input() annonceId: string = '';
  @Input() locataireId: string = '';
  @Output() reservationCreee = new EventEmitter<any>();
  @Output() annulation = new EventEmitter<void>();

  // États du composant
  loading = false;
  error = '';
  success = '';
  
  // Formulaire
  creationForm: FormGroup;
  recapitulatif: RecapitulatifResponse | null = null;
  
  // Gestion de la destruction
  private destroy$ = new Subject<void>();

  constructor(
    private reservationService: ReservationService,
    private fb: FormBuilder
  ) {
    this.creationForm = this.fb.group({
      annonceId: ['', Validators.required],
      dateArrivee: ['', Validators.required],
      dateDepart: ['', Validators.required],
      nombreVoyageurs: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
      modePaiement: ['PAIEMENT_SUR_PLACE'],
      messageProprietaire: [''],
      fraisService: [0, [Validators.min(0)]],
      fraisNettoyage: [0, [Validators.min(0)]],
      fraisDepot: [0, [Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    // Pré-remplir l'ID de l'annonce si fourni
    if (this.annonceId) {
      this.creationForm.patchValue({ annonceId: this.annonceId });
    }
    
    // Définir les dates minimales
    this.setDatesMinimales();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== GESTION DES DATES =====

  private setDatesMinimales(): void {
    const aujourdhui = new Date();
    const demain = new Date(aujourdhui);
    demain.setDate(aujourdhui.getDate() + 1);
    
    const dateMin = demain.toISOString().split('T')[0];
    
    this.creationForm.patchValue({
      dateArrivee: dateMin
    });
  }

  onDateArriveeChange(): void {
    const dateArrivee = this.creationForm.get('dateArrivee')?.value;
    if (dateArrivee) {
      const arrivee = new Date(dateArrivee);
      const departMin = new Date(arrivee);
      departMin.setDate(arrivee.getDate() + 1);
      
      const dateDepartMin = departMin.toISOString().split('T')[0];
      this.creationForm.patchValue({
        dateDepart: dateDepartMin
      });
    }
  }

  // ===== VALIDATION =====

  validerFormulaire(): boolean {
    if (this.creationForm.invalid) {
      this.error = 'Veuillez remplir tous les champs obligatoires';
      return false;
    }

    const formData = this.creationForm.value;
    
    // Validation des dates
    const validation = this.reservationService.validerDates(formData.dateArrivee, formData.dateDepart);
    if (!validation.isValid) {
      this.error = validation.message || 'Dates invalides';
      return false;
    }

    // Validation du nombre de voyageurs
    if (formData.nombreVoyageurs < 1 || formData.nombreVoyageurs > 10) {
      this.error = 'Le nombre de voyageurs doit être entre 1 et 10';
      return false;
    }

    return true;
  }

  // ===== CRÉATION DE RÉSERVATION =====

  calculerRecapitulatif(): void {
    if (!this.validerFormulaire()) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.recapitulatif = null;

    const formData = this.creationForm.value;
    
    const recapitulatifRequest: RecapitulatifRequest = {
      annonceId: formData.annonceId,
      dateArrivee: formData.dateArrivee,
      dateDepart: formData.dateDepart,
      nombreVoyageurs: formData.nombreVoyageurs,
      modePaiement: formData.modePaiement,
      messageProprietaire: formData.messageProprietaire,
      fraisService: formData.fraisService,
      fraisNettoyage: formData.fraisNettoyage,
      fraisDepot: formData.fraisDepot
    };

    this.reservationService.creerRecapitulatif(recapitulatifRequest)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (recap) => {
          this.recapitulatif = recap;
          this.success = 'Récapitulatif calculé avec succès';
        },
        error: (error) => {
          this.error = `Erreur lors du calcul du récapitulatif : ${error.message}`;
        }
      });
  }

  confirmerReservation(): void {
    if (!this.recapitulatif || !this.validerFormulaire()) {
      this.error = 'Veuillez d\'abord calculer le récapitulatif';
      return;
    }

    if (!this.locataireId) {
      this.error = 'ID du locataire manquant';
      return;
    }

    this.loading = true;
    this.error = '';

    const reservationData = this.creationForm.value;
    
    this.reservationService.creerReservation(reservationData, this.locataireId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response) => {
          this.success = `Réservation créée avec succès ! ID: ${response.id}`;
          this.reservationCreee.emit(response);
          
          // Réinitialiser le formulaire après un délai
          setTimeout(() => {
            this.reinitialiserFormulaire();
          }, 2000);
        },
        error: (error) => {
          this.error = `Erreur lors de la création : ${error.message}`;
        }
      });
  }

  // ===== UTILITAIRES =====

  reinitialiserFormulaire(): void {
    this.creationForm.reset({
      nombreVoyageurs: 1,
      modePaiement: 'PAIEMENT_SUR_PLACE',
      fraisService: 0,
      fraisNettoyage: 0,
      fraisDepot: 0
    });
    
    if (this.annonceId) {
      this.creationForm.patchValue({ annonceId: this.annonceId });
    }
    
    this.setDatesMinimales();
    this.recapitulatif = null;
    this.error = '';
    this.success = '';
  }

  annuler(): void {
    this.annulation.emit();
  }

  // ===== GESTION DES ERREURS =====

  effacerErreur(): void {
    this.error = '';
  }

  effacerSucces(): void {
    this.success = '';
  }

  // ===== GETTERS =====

  get nombreVoyageursOptions(): number[] {
    return Array.from({length: 10}, (_, i) => i + 1);
  }

  get modePaiementOptions(): {value: string, label: string}[] {
    return [
      { value: 'PAIEMENT_SUR_PLACE', label: 'Paiement sur place' },
      { value: 'CARTE', label: 'Carte bancaire' },
      { value: 'VIREMENT', label: 'Virement bancaire' }
    ];
  }

  get isFormValid(): boolean {
    return this.creationForm.valid && this.recapitulatif !== null;
  }

  get dureeSejour(): number {
    const formData = this.creationForm.value;
    if (formData.dateArrivee && formData.dateDepart) {
      return this.reservationService.calculerDureeSejour(formData.dateArrivee, formData.dateDepart);
    }
    return 0;
  }
} 