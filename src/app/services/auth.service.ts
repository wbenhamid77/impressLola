import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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

  login(username: string, password: string): Promise<boolean> {
    // Simulation d'une authentification
    // Dans un vrai projet, vous feriez un appel API ici
    return new Promise((resolve) => {
      setTimeout(() => {
        if (username === 'admin' && password === 'password') {
          localStorage.setItem('authToken', 'fake-jwt-token');
          localStorage.setItem('username', username);
          this.isAuthenticatedSubject.next(true);
          resolve(true);
        } else {
          resolve(false);
        }
      }, 1000); // Simulation d'un délai réseau
    });
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    this.isAuthenticatedSubject.next(false);
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }
} 