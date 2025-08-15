import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() currentPage: string = 'dashboard';
  @Output() navigationEvent = new EventEmitter<string>();

  username: string = '';
  isLocataire: boolean = false;
  connectionDate: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.initializeUserInfo();
  }

  initializeUserInfo(): void {
    this.username = this.authService.getUsername() || 'Utilisateur';
    this.isLocataire = this.authService.getUserType() === 'LOCATAIRE';
    this.connectionDate = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  navigateTo(page: string): void {
    this.currentPage = page;
    this.navigationEvent.emit(page);
    
    switch (page) {
      case 'dashboard':
        this.router.navigate(['/dashboard']);
        break;
      case 'mes-annonces':
        this.router.navigate(['/mes-annonces']);
        break;
      case 'ajouter-annonce':
        this.router.navigate(['/ajouter-annonce']);
        break;
      case 'annonces':
        this.router.navigate(['/annonces']);
        break;
      case 'mes-favoris':
        this.router.navigate(['/mes-favoris']);
        break;
      case 'profile':
        this.router.navigate(['/profile']);
        break;
      case 'mes-reservations':
        this.router.navigate(['/mes-reservations']);
        break;
      case 'reservations-locateur':
        this.router.navigate(['/reservations-locateur']);
        break;
      default:
        this.router.navigate(['/dashboard']);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isActive(page: string): boolean {
    return this.currentPage === page;
  }
} 