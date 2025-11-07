import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  step: 'email' | 'code' | 'reset' = 'email';
  isLoading: boolean = false;
  infoMessage: string = '';
  errorMessage: string = '';

  email: string = '';
  code: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  constructor(private api: ApiService, private router: Router) {}

  private resetMessages(): void {
    this.infoMessage = '';
    this.errorMessage = '';
  }

  async onSendCode(): Promise<void> {
    if (!this.email) {
      this.errorMessage = 'Veuillez saisir votre adresse email.';
      return;
    }
    this.isLoading = true;
    this.resetMessages();
    try {
      await firstValueFrom(this.api.envoyerCodeReinitialisation(this.email));
      this.infoMessage = 'Si un compte existe, un code a été envoyé.';
      this.step = 'code';
    } catch (e: any) {
      // Ne révèle pas l'existence du compte
      this.infoMessage = 'Si un compte existe, un code a été envoyé.';
      this.step = 'code';
    } finally {
      this.isLoading = false;
    }
  }

  async onVerifyCode(): Promise<void> {
    if (!this.email || !this.code || this.code.trim().length !== 6) {
      this.errorMessage = 'Entrez le code à 6 chiffres.';
      return;
    }
    this.isLoading = true;
    this.resetMessages();
    try {
      const res = await firstValueFrom(this.api.verifierCodeReinitialisation(this.email, this.code.trim()));
      if (res?.valid) {
        this.step = 'reset';
      } else {
        this.errorMessage = 'Code invalide ou expiré.';
      }
    } catch (e: any) {
      this.errorMessage = e?.error?.message || 'Code invalide ou expiré.';
    } finally {
      this.isLoading = false;
    }
  }

  async onResetPassword(): Promise<void> {
    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Veuillez saisir et confirmer le nouveau mot de passe.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }
    this.isLoading = true;
    this.resetMessages();
    try {
      await firstValueFrom(this.api.reinitialiserMotDePasse(this.email, this.code.trim(), this.newPassword));
      this.infoMessage = 'Mot de passe réinitialisé avec succès.';
      // Retour à la page de login après une petite pause
      setTimeout(() => {
        this.router.navigate(['/login'], { queryParams: { reset: 'success' } });
      }, 800);
    } catch (e: any) {
      this.errorMessage = e?.error?.message || 'Impossible de réinitialiser le mot de passe.';
    } finally {
      this.isLoading = false;
    }
  }

  async onResend(): Promise<void> {
    if (!this.email) return;
    this.isLoading = true;
    this.resetMessages();
    try {
      await firstValueFrom(this.api.envoyerCodeReinitialisation(this.email));
      this.infoMessage = 'Nouveau code envoyé (si le compte existe).';
    } catch {
      this.infoMessage = 'Nouveau code envoyé (si le compte existe).';
    } finally {
      this.isLoading = false;
    }
  }

  goBackToEmail(): void {
    this.step = 'email';
    this.code = '';
    this.resetMessages();
  }
}


