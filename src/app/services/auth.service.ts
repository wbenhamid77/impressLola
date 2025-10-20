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

  getCurrentUser(): { id: string; type: string } | null {
    const userId = localStorage.getItem('userId') || localStorage.getItem('locataireId') || localStorage.getItem('locateurId');
    const userType = localStorage.getItem('userType');
    
    if (userId && userType) {
      return { id: userId, type: userType };
    }
    return null;
  }

  getLocataireId(): string | null {
    // 🔍 DEBUG : Vérifier toutes les sources possibles
    const locataireId = localStorage.getItem('locataireId');
    const userId = localStorage.getItem('userId');
    const userType = localStorage.getItem('userType');
    
    console.log('🔍 === DEBUG getLocataireId ===');
    console.log('🏠 locataireId direct:', locataireId);
    console.log('🆔 userId:', userId);
    console.log('👤 userType:', userType);
    
    // Si on a directement l'ID du locataire
    if (locataireId) {
      console.log('✅ ID locataire trouvé directement:', locataireId);
      return locataireId;
    }
    
    // Si on a un userId et que le type est LOCATAIRE
    if (userId && userType === 'LOCATAIRE') {
      console.log('✅ ID locataire déduit de userId:', userId);
      // Sauvegarder pour la prochaine fois
      localStorage.setItem('locataireId', userId);
      return userId;
    }
    
    // Si on a juste un userId, essayer de le récupérer
    if (userId) {
      console.log('⚠️ userId trouvé mais type non défini, tentative de récupération...');
      // Essayer de récupérer le type depuis l'API ou le localStorage
      return this.tryToRecoverLocataireId(userId);
    }
    
    console.log('❌ Aucun ID de locataire trouvé');
    return null;
  }

  // 🔍 Méthode de récupération d'urgence
  private tryToRecoverLocataireId(userId: string): string | null {
    console.log('🔄 Tentative de récupération de l\'ID locataire...');
    
    // Vérifier si on peut déduire le type d'utilisateur
    const userEmail = localStorage.getItem('userEmail');
    const userNom = localStorage.getItem('userNom');
    
    // Si on a des informations utilisateur, essayer de deviner le type
    if (userEmail || userNom) {
      // Par défaut, considérer comme locataire si pas d'autre indication
      console.log('💡 Type non défini, considération par défaut comme LOCATAIRE');
      localStorage.setItem('userType', 'LOCATAIRE');
      localStorage.setItem('locataireId', userId);
      return userId;
    }
    
    return null;
  }

  // 🔍 Méthode de diagnostic complet
  debugAuthentication(): void {
    console.log('🔍 === DIAGNOSTIC COMPLET AUTHENTIFICATION ===');
    console.log('🔑 authToken:', localStorage.getItem('authToken'));
    console.log('👤 userType:', localStorage.getItem('userType'));
    console.log('📧 userEmail:', localStorage.getItem('userEmail'));
    console.log('🆔 userId:', localStorage.getItem('userId'));
    console.log('🏠 locataireId:', localStorage.getItem('locataireId'));
    console.log('🏢 locateurId:', localStorage.getItem('locateurId'));
    console.log('👨‍💼 userNom:', localStorage.getItem('userNom'));
    console.log('👩‍💼 userPrenom:', localStorage.getItem('userPrenom'));
    
    // Test des méthodes
    console.log('🔍 Test getLocataireId():', this.getLocataireId());
    console.log('🔍 Test getLocateurId():', this.getLocateurId());
    console.log('🔍 Test isAuthenticated():', this.isAuthenticated());
    console.log('🔍 === FIN DIAGNOSTIC ===');
  }
} 