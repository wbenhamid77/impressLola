import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Annonce, CreateAnnonceRequest } from '../models/annonce.model';

export interface Locataire {
  email: string;
  motDePasse: string;
  nom: string;
  prenom: string;
  telephone: string;
  profession: string;
  revenuAnnuel: number;
  employeur: string;
  dateEmbauche: string;
}

export interface Locateur {
  email: string;
  motDePasse: string;
  nom: string;
  prenom: string;
  telephone: string;
  description: string;
  numeroSiret: string;
  raisonSociale: string;
  adresseProfessionnelle: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  userId: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  expirationDate: string;
  message: string;
}

export interface ChangePasswordRequest {
  utilisateurId: string;
  ancienMotDePasse: string;
  nouveauMotDePasse: string;
}

export interface UpdateProfileRequest {
  nom: string;
  prenom: string;
  telephone: string;
  profession?: string;
  revenuAnnuel?: number;
  employeur?: string;
  description?: string;
  numeroSiret?: string;
  raisonSociale?: string;
  adresseProfessionnelle?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8083/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Inscription locataire
  inscrireLocataire(locataire: Locataire): Observable<any> {
    return this.http.post(`${this.baseUrl}/locataires`, locataire, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }

  // Inscription locateur
  inscrireLocateur(locateur: Locateur): Observable<any> {
    return this.http.post(`${this.baseUrl}/locateurs`, locateur, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }

  connexion(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, {
      email: email,
      password: password
    });
  }

  // Récupérer toutes les annonces
  getAnnonces(): Observable<Annonce[]> {
    return this.http.get<Annonce[]>(`${this.baseUrl}/annonces`, {
      headers: this.getAuthHeaders()
    });
  }

  // Méthode pour récupérer une annonce par ID sans token automatique
  getAnnonceById(id: string): Observable<Annonce> {
    console.log('Appel API getAnnonceById:', `${this.baseUrl}/annonces/${id}`);
    return this.http.get<Annonce>(`${this.baseUrl}/annonces/${id}`);
  }

  creerAnnonce(annonce: CreateAnnonceRequest): Observable<Annonce> {
    return this.http.post<Annonce>(`${this.baseUrl}/annonces`, annonce, {
      headers: this.getAuthHeaders()
    });
  }

  // Méthode pour modifier une annonce sans token automatique
  modifierAnnonce(id: string, annonce: Annonce): Observable<Annonce> {
    console.log('Appel API modifierAnnonce:', `${this.baseUrl}/annonces/${id}`, annonce);
    return this.http.put<Annonce>(`${this.baseUrl}/annonces/${id}`, annonce);
  }

  // Méthode pour supprimer une annonce sans token automatique
  supprimerAnnonce(id: string): Observable<any> {
    console.log('Appel API supprimerAnnonce:', `${this.baseUrl}/annonces/${id}`);
    return this.http.delete(`${this.baseUrl}/annonces/${id}`, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      }),
      observe: 'response'
    });
  }

  // Récupérer les annonces d'un locateur spécifique
  getAnnoncesLocateur(locateurId: string): Observable<Annonce[]> {
    return this.http.get<Annonce[]>(`${this.baseUrl}/annonces/locateur/${locateurId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // ===== API FAVORIS POUR LOCATAIRES =====
  
  // Récupérer les annonces favorites d'un locataire
  getAnnoncesFavoris(locataireId: string): Observable<Annonce[]> {
    return this.http.get<Annonce[]>(`${this.baseUrl}/locataires/${locataireId}/favoris`, {
      headers: this.getAuthHeaders()
    });
  }

  // Ajouter une annonce aux favoris
  ajouterAuxFavoris(locataireId: string, annonceId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/locataires/${locataireId}/favoris/${annonceId}`, {}, {
      headers: this.getAuthHeaders(),
      responseType: 'text'
    });
  }

  // Retirer une annonce des favoris
  retirerDesFavoris(locataireId: string, annonceId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/locataires/${locataireId}/favoris/${annonceId}`, {
      headers: this.getAuthHeaders(),
      responseType: 'text'
    });
  }

  // Vérifier si une annonce est dans les favoris
  verifierFavoris(locataireId: string, annonceId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/locataires/${locataireId}/favoris/${annonceId}/check`, {
      headers: this.getAuthHeaders()
    });
  }

  // ===== API PROFILS UTILISATEURS =====
  
  // Récupérer les informations d'un locataire
  getLocataireProfile(locataireId: string): Observable<Locataire> {
    return this.http.get<Locataire>(`${this.baseUrl}/locataires/${locataireId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Récupérer les informations d'un locateur
  getLocateurProfile(locateurId: string): Observable<Locateur> {
    return this.http.get<Locateur>(`${this.baseUrl}/locateurs/${locateurId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Mettre à jour le profil d'un locataire
  updateLocataireProfile(locataireId: string, locataire: Locataire): Observable<Locataire> {
    return this.http.put<Locataire>(`${this.baseUrl}/locataires/${locataireId}`, locataire, {
      headers: this.getAuthHeaders()
    });
  }

  // Mettre à jour le profil d'un locateur
  updateLocateurProfile(locateurId: string, locateur: Locateur): Observable<Locateur> {
    return this.http.put<Locateur>(`${this.baseUrl}/locateurs/${locateurId}`, locateur, {
      headers: this.getAuthHeaders()
    });
  }

  // ===== API CHANGEMENT MOT DE PASSE =====
  
  // Changer le mot de passe
  changerMotDePasse(request: ChangePasswordRequest): Observable<any> {
    return this.http.put(`${this.baseUrl}/auth/modifier-mot-de-passe`, request, {
      headers: this.getAuthHeaders(),
      responseType: 'text'
    });
  }

  // ===== API MODIFICATION PROFIL =====
  
  // Modifier le profil utilisateur
  modifierProfil(utilisateurId: string, profileData: UpdateProfileRequest): Observable<any> {
    return this.http.put(`${this.baseUrl}/profil/${utilisateurId}`, profileData, {
      headers: this.getAuthHeaders(),
      responseType: 'text'
    });
  }
} 