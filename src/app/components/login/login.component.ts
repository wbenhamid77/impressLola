import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit(): Promise<void> {
    if (!this.username || !this.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const success = await this.authService.login(this.username, this.password);
      
      if (success) {
        this.router.navigate(['/dashboard']);
      } else {
        this.errorMessage = 'Nom d\'utilisateur ou mot de passe incorrect';
      }
    } catch (error) {
      this.errorMessage = 'Une erreur est survenue lors de la connexion';
    } finally {
      this.isLoading = false;
    }
  }
} 