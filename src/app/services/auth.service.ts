import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService, LoginResponse } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    // Vérifier si l'utilisateur est déjà connecté au démarrage
    const token = localStorage.getItem('authToken');
    if (token) {
      this.isAuthenticatedSubject.next(true);
    }
  }

  login(email: string, password: string): Promise<boolean> {
    // Simulation d'une authentification
    // Dans un vrai projet, vous feriez un appel API ici
    return new Promise((resolve) => {
      setTimeout(() => {
        if (email === 'admin' && password === 'password') {
          localStorage.setItem('authToken', 'fake-jwt-token');
          localStorage.setItem('username', email);
          this.isAuthenticatedSubject.next(true);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 1000); // Simulation d'un délai réseau
    });
  }

  setAuthenticated(value: boolean): void {
    this.isAuthenticatedSubject.next(value);
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userType');
    localStorage.removeItem('locateurId');
    localStorage.removeItem('locataireId');
    localStorage.removeItem('userNom');
    localStorage.removeItem('userPrenom');
    this.isAuthenticatedSubject.next(false);
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  getUserEmail(): string | null {
    return localStorage.getItem('userEmail');
  }

  getUserType(): string | null {
    return localStorage.getItem('userType');
  }

  getLocateurId(): string | null {
    return localStorage.getItem('locateurId');
  }

  getLocataireId(): string | null {
    return localStorage.getItem('locataireId');
  }

  getUserNom(): string | null {
    return localStorage.getItem('userNom');
  }

  getUserPrenom(): string | null {
    return localStorage.getItem('userPrenom');
  }
} 