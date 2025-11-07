import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm: FormGroup;
  loading = false;
  error = '';
  success = '';
  step = 1;

  private sidebarState = {
    bodyHadWithSidebar: false,
    bodyHadCompact: false,
    appRootHadWithSidebar: false,
    appRootHadCompact: false,
    sidebarDisplays: [] as Array<{ el: HTMLElement; display: string }>
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.registerForm = this.fb.group({
      // Informations de base
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()\.]+$/)]],
      motDePasse: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      typeUtilisateur: ['LOCATAIRE', [Validators.required]],
      
      // Champs communs
      photoProfil: [''],
      
      // Champs spécifiques au locateur
      description: [''],
      numeroSiret: [''],
      raisonSociale: [''],
      adresseProfessionnelle: [''],
      iban: [''],
      bic: [''],
      titulaireNom: [''],
      banque: [''],
      ribDefaut: [true],
      
      // Champs spécifiques au locataire
      profession: [''],
      revenuAnnuel: [''],
      employeur: [''],
      dateEmbauche: [''],
      
      // Anciens champs pour compatibilité (à supprimer plus tard)
      adresseRue: [''],
      adresseNumero: [''],
      adresseCodePostal: [''],
      adresseVille: [''],
      adressePays: [''],
      adresseComplement: [''],
      villePreference: [''],
      budgetMax: [''],
      nombrePersonnes: [''],
      typeLogement: [''],
      password: ['']
    }, { validators: this.passwordMatchValidator });

    // Écouter les changements du type d'utilisateur pour valider les champs
    this.registerForm.get('typeUtilisateur')?.valueChanges.subscribe(type => {
      this.updateValidation(type);
    });
  }

  ngOnInit(): void {
    const body = this.document.body;
    const appRoot = this.document.querySelector('app-root') as HTMLElement | null;

    this.sidebarState.bodyHadWithSidebar = body.classList.contains('with-sidebar');
    this.sidebarState.bodyHadCompact = body.classList.contains('compact');
    if (appRoot) {
      this.sidebarState.appRootHadWithSidebar = appRoot.classList.contains('with-sidebar');
      this.sidebarState.appRootHadCompact = appRoot.classList.contains('compact');
    }

    body.classList.remove('with-sidebar');
    body.classList.remove('compact');
    if (appRoot) {
      appRoot.classList.remove('with-sidebar');
      appRoot.classList.remove('compact');
    }

    const sidebars = this.document.querySelectorAll('.sidebar, .app-sidebar, [data-sidebar]');
    sidebars.forEach((el) => {
      const htmlEl = el as HTMLElement;
      this.sidebarState.sidebarDisplays.push({ el: htmlEl, display: htmlEl.style.display });
      htmlEl.style.display = 'none';
    });
  }

  ngOnDestroy(): void {
    const body = this.document.body;
    const appRoot = this.document.querySelector('app-root') as HTMLElement | null;

    if (this.sidebarState.bodyHadWithSidebar) body.classList.add('with-sidebar');
    if (this.sidebarState.bodyHadCompact) body.classList.add('compact');
    if (appRoot) {
      if (this.sidebarState.appRootHadWithSidebar) appRoot.classList.add('with-sidebar');
      if (this.sidebarState.appRootHadCompact) appRoot.classList.add('compact');
    }

    this.sidebarState.sidebarDisplays.forEach(({ el, display }) => {
      el.style.display = display;
    });
  }

  private markTouched(controlNames: string[]): void {
    for (const name of controlNames) {
      this.registerForm.get(name)?.markAsTouched();
    }
  }

  private isStepValid(step: number): boolean {
    const type = this.registerForm.get('typeUtilisateur')?.value;
    switch (step) {
      case 1: {
        const controls = ['nom', 'prenom', 'email', 'telephone'];
        this.markTouched(controls);
        return controls.every(n => this.registerForm.get(n)?.valid);
      }
      case 2: {
        const controls = ['typeUtilisateur'];
        this.markTouched(controls);
        return controls.every(n => this.registerForm.get(n)?.valid);
      }
      case 3: {
        if (type === 'LOCATEUR') {
          const controls = ['description', 'adresseProfessionnelle'];
          this.markTouched(controls);
          return controls.every(n => this.registerForm.get(n)?.valid);
        } else {
          const controls = ['profession', 'revenuAnnuel', 'employeur', 'dateEmbauche'];
          this.markTouched(controls);
          return controls.every(n => this.registerForm.get(n)?.valid);
        }
      }
      case 4: {
        const controls = ['motDePasse', 'confirmPassword'];
        this.markTouched(controls);
        return controls.every(n => this.registerForm.get(n)?.valid) && !this.registerForm.errors?.['passwordMismatch'];
      }
      default:
        return true;
    }
  }

  goNext(): void {
    if (this.step < 4 && this.isStepValid(this.step)) {
      this.step += 1;
    }
  }

  goPrev(): void {
    if (this.step > 1) {
      this.step -= 1;
    }
  }

  updateValidation(type: string): void {
    if (type === 'LOCATEUR') {
      // Valider les champs locateur
      this.registerForm.get('description')?.setValidators([Validators.required, Validators.minLength(20)]);
      this.registerForm.get('adresseProfessionnelle')?.setValidators([Validators.required]);
      this.registerForm.get('iban')?.setValidators([Validators.required, this.ibanValidator()]);
      this.registerForm.get('bic')?.setValidators([Validators.required, this.bicValidator()]);
      this.registerForm.get('titulaireNom')?.setValidators([Validators.required]);
      this.registerForm.get('banque')?.setValidators([Validators.required]);
      
      // Supprimer la validation des champs locataire
      this.registerForm.get('profession')?.clearValidators();
      this.registerForm.get('revenuAnnuel')?.clearValidators();
      this.registerForm.get('employeur')?.clearValidators();
      this.registerForm.get('dateEmbauche')?.clearValidators();
    } else {
      // Valider les champs locataire
      this.registerForm.get('profession')?.setValidators([Validators.required]);
      this.registerForm.get('revenuAnnuel')?.setValidators([Validators.required, Validators.min(0)]);
      this.registerForm.get('employeur')?.setValidators([Validators.required]);
      this.registerForm.get('dateEmbauche')?.setValidators([Validators.required]);
      
      // Supprimer la validation des champs locateur
      this.registerForm.get('description')?.clearValidators();
      this.registerForm.get('adresseProfessionnelle')?.clearValidators();
      this.registerForm.get('iban')?.clearValidators();
      this.registerForm.get('bic')?.clearValidators();
      this.registerForm.get('titulaireNom')?.clearValidators();
      this.registerForm.get('banque')?.clearValidators();
    }
    
    // Mettre à jour la validation
    this.registerForm.get('description')?.updateValueAndValidity();
    this.registerForm.get('adresseProfessionnelle')?.updateValueAndValidity();
    this.registerForm.get('profession')?.updateValueAndValidity();
    this.registerForm.get('revenuAnnuel')?.updateValueAndValidity();
    this.registerForm.get('employeur')?.updateValueAndValidity();
    this.registerForm.get('dateEmbauche')?.updateValueAndValidity();
    this.registerForm.get('iban')?.updateValueAndValidity();
    this.registerForm.get('bic')?.updateValueAndValidity();
    this.registerForm.get('titulaireNom')?.updateValueAndValidity();
    this.registerForm.get('banque')?.updateValueAndValidity();
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('motDePasse')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  hasUppercase(): boolean {
    const password = this.registerForm.get('motDePasse')?.value;
    return password ? /[A-Z]/.test(password) : false;
  }

  hasLowercase(): boolean {
    const password = this.registerForm.get('motDePasse')?.value;
    return password ? /[a-z]/.test(password) : false;
  }

  hasNumber(): boolean {
    const password = this.registerForm.get('motDePasse')?.value;
    return password ? /[0-9]/.test(password) : false;
  }

  async onSubmit(): Promise<void> {
    if (!this.isStepValid(4)) {
      return;
    }
    if (this.registerForm.valid) {
      // Validation supplémentaire selon le type d'utilisateur
      const formData = this.registerForm.value;
      const typeUtilisateur = formData.typeUtilisateur;
      
      if (typeUtilisateur === 'LOCATEUR') {
        if (!formData.description || formData.description.length < 20) {
          this.error = 'La description professionnelle est requise et doit contenir au moins 20 caractères.';
          return;
        }
        if (!formData.adresseProfessionnelle) {
          this.error = 'L\'adresse professionnelle est requise.';
          return;
        }
      } else {
        if (!formData.profession) {
          this.error = 'La profession est requise.';
          return;
        }
        if (!formData.revenuAnnuel || formData.revenuAnnuel <= 0) {
          this.error = 'Le revenu annuel est requis et doit être positif.';
          return;
        }
        if (!formData.employeur) {
          this.error = 'L\'employeur est requis.';
          return;
        }
        if (!formData.dateEmbauche) {
          this.error = 'La date d\'embauche est requise.';
          return;
        }
      }

      this.loading = true;
      this.error = '';
      this.success = '';

      try {
        if (typeUtilisateur === 'LOCATEUR') {
          // Création d'un locateur
          const locateurData = {
            nom: formData.nom,
            prenom: formData.prenom,
            email: formData.email,
            motDePasse: formData.motDePasse,
            telephone: formData.telephone,
            photoProfil: formData.photoProfil || null,
            description: formData.description,
            numeroSiret: formData.numeroSiret || null,
            raisonSociale: formData.raisonSociale || null,
            adresseProfessionnelle: formData.adresseProfessionnelle
          };

          console.log('Création locateur:', locateurData);
          const createdLocateur: any = await this.apiService.inscrireLocateur(locateurData).toPromise();
          try {
            // Créer le RIB par défaut du locateur si présent
            if (createdLocateur && createdLocateur.id && formData.iban && formData.bic && formData.titulaireNom && formData.banque) {
              await this.apiService.creerRib({
                type: 'LOCATEUR',
                locateurId: createdLocateur.id,
                iban: String(formData.iban).replace(/\s+/g, '').toUpperCase(),
                bic: String(formData.bic).toUpperCase(),
                titulaireNom: formData.titulaireNom,
                banque: formData.banque,
                defautCompte: !!formData.ribDefaut
              }).toPromise();
            }
          } catch (ribErr) {
            console.warn('RIB locateur non créé lors de l\'inscription', ribErr);
          }
          
        } else {
          // Création d'un locataire
          const locataireData = {
            nom: formData.nom,
            prenom: formData.prenom,
            email: formData.email,
            motDePasse: formData.motDePasse,
            telephone: formData.telephone,
            photoProfil: formData.photoProfil || null,
            profession: formData.profession,
            revenuAnnuel: parseFloat(formData.revenuAnnuel),
            employeur: formData.employeur,
            dateEmbauche: formData.dateEmbauche
          };

          console.log('Création locataire:', locataireData);
          await this.apiService.inscrireLocataire(locataireData).toPromise();
        }

        this.success = `Compte ${typeUtilisateur.toLowerCase()} créé avec succès ! Redirection vers la page de connexion...`;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);

      } catch (error: any) {
        console.error('Erreur lors de la création du compte:', error);
        
        if (error.status === 0) {
          this.error = 'Impossible de se connecter au serveur. Vérifiez que le serveur backend est démarré sur http://localhost:8083';
        } else if (error.status === 400) {
          this.error = error.error?.message || 'Données invalides. Vérifiez les informations saisies.';
        } else if (error.status === 409) {
          this.error = 'Un compte avec cet email existe déjà.';
        } else if (error.status === 500) {
          this.error = 'Erreur serveur. Veuillez réessayer plus tard.';
        } else {
          this.error = error.error?.message || 'Une erreur est survenue lors de la création du compte.';
        }
        
        console.error('Détails de l\'erreur:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          message: error.message
        });
      } finally {
        this.loading = false;
      }
    } else {
      this.error = 'Veuillez corriger les erreurs dans le formulaire.';
    }
  }

  // ===== Validators RIB =====
  private ibanValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const value = (control.value || '').toString().replace(/\s+/g, '').toUpperCase();
      if (!value) return null;
      const basicPattern = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/;
      return basicPattern.test(value) ? null : { ibanInvalid: true };
    };
  }

  private bicValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const value = (control.value || '').toString().toUpperCase();
      if (!value) return null;
      const pattern = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
      return pattern.test(value) ? null : { bicInvalid: true };
    };
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  selectUserType(type: string): void {
    this.registerForm.patchValue({typeUtilisateur: type});
    // Trigger validation update for the new type
    this.updateValidation(type);
  }
} 