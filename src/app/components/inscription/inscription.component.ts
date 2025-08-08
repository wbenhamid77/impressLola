import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, Locataire, Locateur } from '../../services/api.service';
import * as AOS from 'aos';

@Component({
  selector: 'app-inscription',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './inscription.component.html',
  styleUrl: './inscription.component.css'
})
export class InscriptionComponent implements OnInit, AfterViewInit {
  userType: 'locataire' | 'locateur' = 'locataire';
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Formulaires
  locataireForm!: FormGroup;
  locateurForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.initializeLocataireForm();
    this.initializeLocateurForm();
  }

  ngOnInit(): void {
    // Initialisation si nécessaire
  }

  ngAfterViewInit(): void {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
      mirror: false,
      offset: 100,
    });
  }

  private initializeLocataireForm(): void {
    this.locataireForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]],
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      telephone: ['', Validators.required],
      profession: ['', Validators.required],
      revenuAnnuel: ['', [Validators.required, Validators.min(0)]],
      employeur: ['', Validators.required],
      dateEmbauche: ['', Validators.required]
    });
  }

  private initializeLocateurForm(): void {
    this.locateurForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.required, Validators.minLength(6)]],
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      telephone: ['', Validators.required],
      description: ['', Validators.required],
      numeroSiret: ['', [Validators.required, Validators.pattern(/^\d{14}$/)]],
      raisonSociale: ['', Validators.required],
      adresseProfessionnelle: ['', Validators.required]
    });
  }

  setUserType(type: 'locataire' | 'locateur'): void {
    this.userType = type;
    this.errorMessage = '';
    this.successMessage = '';
  }

  async onSubmit(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      if (this.userType === 'locataire') {
        if (this.locataireForm.valid) {
          const locataireData: Locataire = this.locataireForm.value;
          await this.apiService.inscrireLocataire(locataireData).toPromise();
          this.successMessage = 'Inscription réussie ! Vous pouvez maintenant vous connecter.';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.errorMessage = 'Veuillez remplir tous les champs obligatoires correctement.';
        }
      } else {
        if (this.locateurForm.valid) {
          const locateurData: Locateur = this.locateurForm.value;
          await this.apiService.inscrireLocateur(locateurData).toPromise();
          this.successMessage = 'Inscription réussie ! Vous pouvez maintenant vous connecter.';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.errorMessage = 'Veuillez remplir tous les champs obligatoires correctement.';
        }
      }
    } catch (error: any) {
      this.errorMessage = error.error?.message || 'Une erreur est survenue lors de l\'inscription.';
    } finally {
      this.isLoading = false;
    }
  }

  getCurrentForm(): FormGroup {
    return this.userType === 'locataire' ? this.locataireForm : this.locateurForm;
  }

  isFieldInvalid(fieldName: string): boolean {
    const form = this.getCurrentForm();
    const field = form.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }
} 