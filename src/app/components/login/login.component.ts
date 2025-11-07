import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';
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
  verificationToken: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  infoMessage: string = '';
  showPassword: boolean = false;
  formPosition: 'left' | 'right' | 'center' = 'center';
  resendInProgress: boolean = false;
  promptResend: boolean = false;
  // URLs des images professionnelles
  moroccoFlagUrl: string = 'assets/images/morocco-can2025/morocco-flag.png';
  canLogoUrl: string = 'assets/images/afcon/can.png';
  backgroundImageUrl: string = 'assets/design/backgrounds/afcon-morocco.webp';
  can2025LogoUrl: string = 'assets/design/backgrounds/CAN-2025_logo.webp';

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Pré-remplir le token depuis l'URL si présent (?verifyToken=... ou ?verificationToken=...)
    const qp = this.route.snapshot.queryParamMap;
    const tokenFromUrl = qp.get('verifyToken') || qp.get('verificationToken');
    if (tokenFromUrl) {
      this.verificationToken = this.cleanToken(tokenFromUrl);
      // On conserve l'URL telle quelle, sans la nettoyer
    }
  }

  ngAfterViewInit(): void {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
      mirror: false,
      offset: 100,
    });
    
    // Initialiser l'indicateur de scroll
    this.initScrollIndicator();
  }

  private initScrollIndicator(): void {
    const scrollContainer = document.getElementById('scrollContainer');
    const scrollIndicator = document.getElementById('scrollIndicator');
    
    if (scrollContainer && scrollIndicator) {
      scrollContainer.addEventListener('scroll', () => {
        const scrollTop = scrollContainer.scrollTop;
        const scrollHeight = scrollContainer.scrollHeight - scrollContainer.clientHeight;
        const scrollPercentage = (scrollTop / scrollHeight) * 100;
        
        scrollIndicator.style.height = `${scrollPercentage}%`;
      });
    }
  }

  onImageError(imageType: string): void {
    console.warn(`Erreur de chargement de l'image: ${imageType}`);
    // Les images ont des fallbacks CSS, donc pas besoin de masquer
  }

  private cleanToken(token?: string | null): string {
    if (!token) return '';
    let t = token.toString().trim();
    // Supprime les quotes encadrantes éventuelles
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
      t = t.slice(1, -1);
    }
    // Supprime le préfixe Bearer s'il existe
    if (t.toLowerCase().startsWith('bearer ')) {
      t = t.slice(7).trim();
    }
    return t;
  }

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.infoMessage = '';

    try {
      console.log('Tentative de connexion avec:', this.email);

      // Utilise firstValueFrom au lieu de toPromise()
      const tokenToSend = this.cleanToken(this.verificationToken);
      const response = await firstValueFrom(this.apiService.connexion(this.email, this.password, tokenToSend || undefined));

      console.log('Réponse de l\'API:', response);

      if (response && response.token) {
        // Nettoyage du token pour s'assurer que la valeur stockée est exacte
        const token = this.cleanToken(response.token);
        const refreshToken = this.cleanToken(response.refreshToken ?? '');

        // Stockage du token et autres infos
        localStorage.setItem('authToken', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('userEmail', response.email ?? '');
        localStorage.setItem('userType', response.role ?? '');
        localStorage.setItem('userNom', response.nom ?? '');
        localStorage.setItem('userPrenom', response.prenom ?? '');
        localStorage.setItem('expirationDate', response.expirationDate ? String(response.expirationDate) : '');

        // Stocker l'userId selon le rôle
        if (response.role === 'LOCATEUR') {
          localStorage.setItem('locateurId', response.userId ?? '');
        } else if (response.role === 'LOCATAIRE') {
          localStorage.setItem('locataireId', response.userId ?? '');
        }

        console.log('Données stockées dans localStorage:');
        console.log('- Token:', localStorage.getItem('authToken'));
        console.log('- RefreshToken:', localStorage.getItem('refreshToken'));
        console.log('- Email:', localStorage.getItem('userEmail'));
        console.log('- Role:', localStorage.getItem('userType'));
        console.log('- User ID:', response.userId);
        console.log('- Locateur ID:', localStorage.getItem('locateurId'));
        console.log('- Locataire ID:', localStorage.getItem('locataireId'));

        this.authService.setAuthenticated(true);

        // Redirection
        this.router.navigate(['/dashboard']);
        // Réinitialiser l'état de vérification
        this.promptResend = false;
      } else {
        this.errorMessage = 'Email ou mot de passe incorrect';
      }
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      if (error?.status === 401) {
        this.errorMessage = 'Email ou mot de passe incorrect';
      } else if (error?.status === 0) {
        this.errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion.';
      } else {
        const message: string = error?.error?.message || 'Une erreur est survenue lors de la connexion';
        this.errorMessage = message;
        // Gestion des cas d'email non vérifié et token invalide/expiré
        const lower = message.toLowerCase();
        if (lower.includes('email non vérifié')) {
          this.promptResend = true;
          this.infoMessage = 'Votre email n\'est pas vérifié. Ouvrez le lien de vérification reçu par email ou renvoyez un nouveau lien.';
        }
        if (lower.includes('token de vérification invalide') || lower.includes('expiré')) {
          this.promptResend = true;
          this.infoMessage = 'Le lien de vérification est invalide ou expiré. Renvoyez un nouveau lien.';
        }
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

  navigateForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  async resendVerification(): Promise<void> {
    if (!this.email) {
      this.errorMessage = 'Veuillez saisir votre email pour renvoyer le token.';
      return;
    }
    this.resendInProgress = true;
    this.errorMessage = '';
    this.infoMessage = '';
    try {
      await firstValueFrom(this.apiService.resendVerificationToken(this.email));
      this.infoMessage = 'Un nouveau token de vérification a été envoyé à votre email.';
    } catch (e: any) {
      this.errorMessage = e?.error?.message || 'Impossible de renvoyer le token. Réessayez plus tard.';
    } finally {
      this.resendInProgress = false;
    }
  }

}