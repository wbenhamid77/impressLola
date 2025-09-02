import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() currentPage: string = 'dashboard';
  @Output() navigationEvent = new EventEmitter<string>();

  username: string = '';
  isLocataire: boolean = false;
  connectionDate: string = '';
  isCollapsed: boolean = true;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.initializeUserInfo();
    const stored = localStorage.getItem('sidebarCollapsed');
    this.isCollapsed = stored ? stored === '1' : true;
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

  // Navigation via RouterLink/RouterLinkActive côté template désormais

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isActive(page: string): boolean {
    return this.currentPage === page;
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    localStorage.setItem('sidebarCollapsed', this.isCollapsed ? '1' : '0');
    window.dispatchEvent(new Event('sidebar:toggle'));
  }

  onMouseEnter(): void {
    this.isCollapsed = false;
    localStorage.setItem('sidebarCollapsed', '0');
    window.dispatchEvent(new Event('sidebar:toggle'));
  }

  onMouseLeave(): void {
    this.isCollapsed = true;
    localStorage.setItem('sidebarCollapsed', '1');
    window.dispatchEvent(new Event('sidebar:toggle'));
  }
} 