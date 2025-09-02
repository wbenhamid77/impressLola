import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import * as AOS from 'aos';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, AfterViewInit {
  email: string = '';
  password: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  showPassword: boolean = false;
  formPosition: 'left' | 'right' | 'center' = 'center';
  // URL optionnelle d'une image CAN 2025 à afficher dans la page login
  canImageUrl: string = 'assets/images/afcon/can.png';
  canImageAlt: string = 'CAF Africa Cup of Nations Morocco 2025';

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

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

  onImageError(): void {
    // Si l'image distante échoue, on masque en vidant l'URL
    this.canImageUrl = '';
  }

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      console.log('Tentative de connexion avec:', this.email);
      
      // Appel à l'API de connexion
      const response = await this.apiService.connexion(this.email, this.password).toPromise();
      
      console.log('Réponse de l\'API:', response);
      
      if (response && response.token) {
        // Stockage du token et connexion
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userEmail', response.email);
        localStorage.setItem('userType', response.role);
        localStorage.setItem('userNom', response.nom);
        localStorage.setItem('userPrenom', response.prenom);
        
        // Stocker l'userId selon le rôle
        if (response.role === 'LOCATEUR') {
          localStorage.setItem('locateurId', response.userId);
        } else if (response.role === 'LOCATAIRE') {
          localStorage.setItem('locataireId', response.userId);
        }
        
        console.log('Données stockées dans localStorage:');
        console.log('- Token:', localStorage.getItem('authToken'));
        console.log('- Email:', localStorage.getItem('userEmail'));
        console.log('- Role:', localStorage.getItem('userType'));
        console.log('- User ID:', response.userId);
        console.log('- Locateur ID:', localStorage.getItem('locateurId'));
        console.log('- Locataire ID:', localStorage.getItem('locataireId'));
        
        this.authService.setAuthenticated(true);
        
        // Redirection selon le type d'utilisateur
        if (response.role === 'LOCATAIRE') {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      } else {
        this.errorMessage = 'Email ou mot de passe incorrect';
      }
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      if (error.status === 401) {
        this.errorMessage = 'Email ou mot de passe incorrect';
      } else if (error.status === 0) {
        this.errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion.';
      } else {
        this.errorMessage = error.error?.message || 'Une erreur est survenue lors de la connexion';
      }
    } finally {
      this.isLoading = false;
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  navigateToInscription(): void {
    this.router.navigate(['/register']);
  }

  navigateExplore(): void {
    this.router.navigate(['/explore']);
  }

  navigateSupport(): void {
    this.router.navigate(['/support']);
  }
} 