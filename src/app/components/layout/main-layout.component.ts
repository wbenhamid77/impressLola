import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit {
  currentPage: string = 'dashboard';
  isAuthenticated: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkAuthentication();
    this.updateCurrentPage();
  }

  checkAuthentication(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    if (!this.isAuthenticated) {
      this.router.navigate(['/login']);
    }
  }

  updateCurrentPage(): void {
    const url = this.router.url;
    if (url.includes('dashboard')) {
      this.currentPage = 'dashboard';
    } else if (url.includes('mes-annonces')) {
      this.currentPage = 'mes-annonces';
    } else if (url.includes('ajouter-annonce')) {
      this.currentPage = 'ajouter-annonce';
    } else if (url.includes('annonces')) {
      this.currentPage = 'annonces';
    } else if (url.includes('modifier-annonce')) {
      this.currentPage = 'mes-annonces';
    } else if (url.includes('detail-annonce')) {
      this.currentPage = 'annonces';
    } else if (url.includes('mes-favoris')) {
      this.currentPage = 'mes-favoris';
    } else {
      this.currentPage = 'dashboard';
    }
  }

  onNavigation(page: string): void {
    this.currentPage = page;
    console.log('Navigation vers:', page);
  }
} 