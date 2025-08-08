import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService, ChangePasswordRequest } from '../../services/api.service';

@Component({
  selector: 'app-change-password-modal',
  templateUrl: './change-password-modal.component.html',
  styleUrls: ['./change-password-modal.component.css'],
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true
})
export class ChangePasswordModalComponent {
  @Output() modalClosed = new EventEmitter<void>();
  @Output() passwordChanged = new EventEmitter<void>();

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  // États de visibilité des mots de passe
  showAncienPassword = false;
  showNouveauPassword = false;
  showConfirmerPassword = false;

  // Formulaire
  passwordForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.passwordForm = this.fb.group({
      ancienMotDePasse: ['', [Validators.required]],
      nouveauMotDePasse: ['', [Validators.required, Validators.minLength(8)]],
      confirmerMotDePasse: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  // Validateur personnalisé pour vérifier que les mots de passe correspondent
  passwordMatchValidator(form: FormGroup) {
    const nouveauMotDePasse = form.get('nouveauMotDePasse')?.value;
    const confirmerMotDePasse = form.get('confirmerMotDePasse')?.value;
    
    if (nouveauMotDePasse && confirmerMotDePasse && nouveauMotDePasse !== confirmerMotDePasse) {
      form.get('confirmerMotDePasse')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    form.get('confirmerMotDePasse')?.setErrors(null);
    return null;
  }

  // Fermer le modal
  fermerModal(): void {
    this.modalClosed.emit();
  }

  // Basculer la visibilité d'un mot de passe
  togglePasswordVisibility(field: string): void {
    switch (field) {
      case 'ancienMotDePasse':
        this.showAncienPassword = !this.showAncienPassword;
        break;
      case 'nouveauMotDePasse':
        this.showNouveauPassword = !this.showNouveauPassword;
        break;
      case 'confirmerMotDePasse':
        this.showConfirmerPassword = !this.showConfirmerPassword;
        break;
    }
  }

  // Changer le mot de passe
  async changerMotDePasse(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      // Récupérer l'ID de l'utilisateur connecté
      const userId = localStorage.getItem('userId') || 
                    localStorage.getItem('locataireId') || 
                    localStorage.getItem('locateurId');

      if (!userId) {
        this.errorMessage = 'Aucun utilisateur connecté';
        return;
      }

      const formValue = this.passwordForm.value;
      const request: ChangePasswordRequest = {
        utilisateurId: userId,
        ancienMotDePasse: formValue.ancienMotDePasse,
        nouveauMotDePasse: formValue.nouveauMotDePasse
      };

      console.log('Envoi de la requête de changement de mot de passe:', request);

      await this.apiService.changerMotDePasse(request).toPromise();
      
      this.successMessage = 'Mot de passe modifié avec succès !';
      this.passwordForm.reset();
      
      // Émettre l'événement de succès
      this.passwordChanged.emit();
      
      // Fermer le modal après 2 secondes
      setTimeout(() => {
        this.fermerModal();
      }, 2000);

    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error);
      
      if (error.status === 400) {
        this.errorMessage = 'L\'ancien mot de passe est incorrect';
      } else if (error.status === 404) {
        this.errorMessage = 'Utilisateur non trouvé';
      } else if (error.status === 500) {
        this.errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      } else {
        this.errorMessage = 'Une erreur est survenue lors du changement de mot de passe';
      }
    } finally {
      this.isLoading = false;
    }
  }

  // Marquer tous les champs comme touchés pour afficher les erreurs
  markFormGroupTouched(): void {
    Object.keys(this.passwordForm.controls).forEach(key => {
      const control = this.passwordForm.get(key);
      control?.markAsTouched();
    });
  }

  // Calculer la force du mot de passe
  getPasswordStrength(): number {
    const password = this.passwordForm.get('nouveauMotDePasse')?.value;
    if (!password) return 0;

    let strength = 0;
    
    // Longueur
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // Complexité
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    return Math.min(strength, 3);
  }

  // Obtenir la classe CSS pour la force du mot de passe
  getPasswordStrengthClass(): string {
    const strength = this.getPasswordStrength();
    if (strength <= 1) return 'weak';
    if (strength <= 2) return 'medium';
    return 'strong';
  }

  // Obtenir le texte pour la force du mot de passe
  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    if (strength <= 1) return 'Faible';
    if (strength <= 2) return 'Moyen';
    return 'Fort';
  }
}
