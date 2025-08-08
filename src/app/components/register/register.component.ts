import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  error = '';
  success = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
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

  updateValidation(type: string): void {
    if (type === 'LOCATEUR') {
      // Valider les champs locateur
      this.registerForm.get('description')?.setValidators([Validators.required, Validators.minLength(20)]);
      this.registerForm.get('adresseProfessionnelle')?.setValidators([Validators.required]);
      
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
    }
    
    // Mettre à jour la validation
    this.registerForm.get('description')?.updateValueAndValidity();
    this.registerForm.get('adresseProfessionnelle')?.updateValueAndValidity();
    this.registerForm.get('profession')?.updateValueAndValidity();
    this.registerForm.get('revenuAnnuel')?.updateValueAndValidity();
    this.registerForm.get('employeur')?.updateValueAndValidity();
    this.registerForm.get('dateEmbauche')?.updateValueAndValidity();
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('motDePasse')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  async onSubmit(): Promise<void> {
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
          await this.apiService.inscrireLocateur(locateurData).toPromise();
          
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

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
} 