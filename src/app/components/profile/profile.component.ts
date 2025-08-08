import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService, Locataire, Locateur } from '../../services/api.service';
import { ChangePasswordModalComponent } from '../change-password-modal/change-password-modal.component';
import { EditProfileModalComponent } from '../edit-profile-modal/edit-profile-modal.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  imports: [CommonModule, ChangePasswordModalComponent, EditProfileModalComponent],
  standalone: true
})
export class ProfileComponent implements OnInit {
  isLoading = false;
  errorMessage = '';
  userRole = '';
  userId = '';
  
  // Profils utilisateurs
  userProfile: Locataire | Locateur | null = null;
  locataireProfile: Locataire | null = null;
  locateurProfile: Locateur | null = null;
  
  // Statistiques
  stats = {
    favoris: 0,
    annonces: 0,
    reservations: 0
  };

  // Modals
  showPasswordModal = false;
  showEditModal = false;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chargerProfil();
  }

  async chargerProfil(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      
      // Récupérer les informations de l'utilisateur connecté
      this.userRole = localStorage.getItem('userRole') || '';
      this.userId = localStorage.getItem('userId') || 
                    localStorage.getItem('locataireId') || 
                    localStorage.getItem('locateurId') || '';
      
      if (!this.userId) {
        this.errorMessage = 'Aucun utilisateur connecté';
        return;
      }

      // Charger le profil selon le rôle
      if (this.userRole === 'LOCATAIRE') {
        await this.chargerProfilLocataire();
      } else if (this.userRole === 'LOCATEUR') {
        await this.chargerProfilLocateur();
      } else {
        // Essayer de déterminer le rôle par les IDs stockés
        if (localStorage.getItem('locataireId')) {
          this.userRole = 'LOCATAIRE';
          await this.chargerProfilLocataire();
        } else if (localStorage.getItem('locateurId')) {
          this.userRole = 'LOCATEUR';
          await this.chargerProfilLocateur();
        } else {
          this.errorMessage = 'Impossible de déterminer le type d\'utilisateur';
        }
      }

      // Charger les statistiques
      await this.chargerStatistiques();
      
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      this.errorMessage = 'Erreur lors du chargement du profil';
    } finally {
      this.isLoading = false;
    }
  }

  async chargerProfilLocataire(): Promise<void> {
    try {
      const locataireId = localStorage.getItem('locataireId') || this.userId;
      const response = await this.apiService.getLocataireProfile(locataireId).toPromise();
      
      if (response) {
        this.locataireProfile = response;
        this.userProfile = response;
        console.log('Profil locataire chargé:', response);
      } else {
        throw new Error('Aucune donnée reçue');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil locataire:', error);
      throw error;
    }
  }

  async chargerProfilLocateur(): Promise<void> {
    try {
      const locateurId = localStorage.getItem('locateurId') || this.userId;
      const response = await this.apiService.getLocateurProfile(locateurId).toPromise();
      
      if (response) {
        this.locateurProfile = response;
        this.userProfile = response;
        console.log('Profil locateur chargé:', response);
      } else {
        throw new Error('Aucune donnée reçue');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil locateur:', error);
      throw error;
    }
  }

  async chargerStatistiques(): Promise<void> {
    try {
      // Charger les statistiques selon le rôle
      if (this.userRole === 'LOCATAIRE') {
        const locataireId = localStorage.getItem('locataireId') || this.userId;
        const favoris = await this.apiService.getAnnoncesFavoris(locataireId).toPromise();
        this.stats.favoris = favoris ? favoris.length : 0;
        this.stats.annonces = 0; // Visites pour les locataires
        this.stats.reservations = 0; // À implémenter
      } else if (this.userRole === 'LOCATEUR') {
        const locateurId = localStorage.getItem('locateurId') || this.userId;
        const annonces = await this.apiService.getAnnoncesLocateur(locateurId).toPromise();
        this.stats.annonces = annonces ? annonces.length : 0;
        this.stats.favoris = 0; // Pas de favoris pour les locateurs
        this.stats.reservations = 0; // À implémenter
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      // Ne pas afficher d'erreur pour les statistiques
    }
  }

  retourAccueil(): void {
    this.router.navigate(['/dashboard']);
  }

  modifierProfil(): void {
    this.showEditModal = true;
  }

  onEditModalClosed(): void {
    this.showEditModal = false;
  }

  onProfileUpdated(): void {
    console.log('Profil modifié avec succès');
    // Recharger le profil après modification
    this.chargerProfil();
  }

  changerMotDePasse(): void {
    this.showPasswordModal = true;
  }

  onPasswordModalClosed(): void {
    this.showPasswordModal = false;
  }

  onPasswordChanged(): void {
    console.log('Mot de passe modifié avec succès');
    // Optionnel : recharger le profil ou afficher un message
  }

  supprimerCompte(): void {
    // TODO: Implémenter la suppression du compte
    console.log('Supprimer le compte');
    if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
      alert('Fonctionnalité de suppression de compte à implémenter');
    }
  }

  formaterDate(date: string | null | undefined): string {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return date;
    }
  }

  formaterPrix(prix: number | null | undefined): string {
    if (!prix) return '';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(prix);
  }
}
