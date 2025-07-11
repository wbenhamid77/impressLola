import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  username: string | null = null;
  connectionDate: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername();
    this.connectionDate = new Date().toLocaleString('fr-FR');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
} 