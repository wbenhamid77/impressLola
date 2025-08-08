import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService, UpdateProfileRequest, Locataire, Locateur } from '../../services/api.service';

@Component({
  selector: 'app-edit-profile-modal',
  templateUrl: './edit-profile-modal.component.html',
  styleUrls: ['./edit-profile-modal.component.css'],
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true
})
export class EditProfileModalComponent implements OnInit {
  @Input() userProfile: Locataire | Locateur | null = null;
  @Input() userRole: string = '';
  @Output() modalClosed = new EventEmitter<void>();
  @Output() profileUpdated = new EventEmitter<void>();

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Formulaire
  profileForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.profileForm = this.fb.group({
      nom: ['', [Validators.required]],
      prenom: ['', [Validators.required]],
      telephone: ['', [Validators.required]],
      // Champs optionnels pour locataire
      profession: [''],
      revenuAnnuel: [null],
      employeur: [''],
      // Champs optionnels pour locateur
      description: [''],
      numeroSiret: [''],
      raisonSociale: [''],
      adresseProfessionnelle: ['']
    });
  }

  ngOnInit(): void {
    this.initialiserFormulaire();
  }

  // Initialiser le formulaire avec les données existantes
  initialiserFormulaire(): void {
    if (this.userProfile) {
      const formData: any = {
        nom: this.userProfile.nom || '',
        prenom: this.userProfile.prenom || '',
        telephone: this.userProfile.telephone || ''
      };

      // Ajouter les champs spécifiques selon le type d'utilisateur
      if (this.isLocataire(this.userProfile)) {
        formData.profession = this.userProfile.profession || '';
        formData.revenuAnnuel = this.userProfile.revenuAnnuel || null;
        formData.employeur = this.userProfile.employeur || '';
      } else if (this.isLocateur(this.userProfile)) {
        formData.description = this.userProfile.description || '';
        formData.numeroSiret = this.userProfile.numeroSiret || '';
        formData.raisonSociale = this.userProfile.raisonSociale || '';
        formData.adresseProfessionnelle = this.userProfile.adresseProfessionnelle || '';
      }

      this.profileForm.patchValue(formData);
    }
  }

  // Type guards pour vérifier le type d'utilisateur
  isLocataire(user: Locataire | Locateur): user is Locataire {
    return 'profession' in user && 'revenuAnnuel' in user && 'employeur' in user;
  }

  isLocateur(user: Locataire | Locateur): user is Locateur {
    return 'description' in user && 'numeroSiret' in user && 'raisonSociale' in user;
  }

  // Fermer le modal
  fermerModal(): void {
    this.modalClosed.emit();
  }

  // Modifier le profil
  async modifierProfil(): Promise<void> {
    if (this.profileForm.invalid) {
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

      const formValue = this.profileForm.value;
      
      // Créer l'objet de requête selon le rôle
      const request: UpdateProfileRequest = {
        nom: formValue.nom,
        prenom: formValue.prenom,
        telephone: formValue.telephone
      };

      // Ajouter les champs spécifiques selon le rôle
      if (this.userRole === 'LOCATAIRE') {
        request.profession = formValue.profession;
        request.revenuAnnuel = formValue.revenuAnnuel;
        request.employeur = formValue.employeur;
      } else if (this.userRole === 'LOCATEUR') {
        request.description = formValue.description;
        request.numeroSiret = formValue.numeroSiret;
        request.raisonSociale = formValue.raisonSociale;
        request.adresseProfessionnelle = formValue.adresseProfessionnelle;
      }

      console.log('Envoi de la requête de modification de profil:', request);

      await this.apiService.modifierProfil(userId, request).toPromise();
      
      this.successMessage = 'Profil modifié avec succès !';
      
      // Émettre l'événement de succès
      this.profileUpdated.emit();
      
      // Fermer le modal après 2 secondes
      setTimeout(() => {
        this.fermerModal();
      }, 2000);

    } catch (error: any) {
      console.error('Erreur lors de la modification du profil:', error);
      
      if (error.status === 400) {
        this.errorMessage = 'Données invalides. Veuillez vérifier vos informations.';
      } else if (error.status === 404) {
        this.errorMessage = 'Utilisateur non trouvé';
      } else if (error.status === 500) {
        this.errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      } else {
        this.errorMessage = 'Une erreur est survenue lors de la modification du profil';
      }
    } finally {
      this.isLoading = false;
    }
  }

  // Marquer tous les champs comme touchés pour afficher les erreurs
  markFormGroupTouched(): void {
    Object.keys(this.profileForm.controls).forEach(key => {
      const control = this.profileForm.get(key);
      control?.markAsTouched();
    });
  }
}
