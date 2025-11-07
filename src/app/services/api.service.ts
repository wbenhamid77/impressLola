import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Annonce, CreateAnnonceRequest } from '../models/annonce.model';
import { RibDTO, CreateRibRequest } from '../models/rib.model';
import { TransactionInstructionDTO } from '../models/transaction-instruction.model';

export interface SoldeResponse {
  entrees: number; // total des montants reçus (EXECUTED) vers les RIBs du sujet
  sorties: number; // total des montants envoyés (EXECUTED) depuis les RIBs du sujet
  net: number;     // entrees - sorties
}

export interface Stade {
  id: string;
  nom: string;
  ville: string;
  latitude: number;
  longitude: number;
  capacite: number;
  description: string;
  adresseComplete?: string;
  images?: string[];
  estActif?: boolean;
  dateCreation?: string;
  dateModification?: string | null;
  surfaceMetresCarres?: number;
  categories?: string[];
  categoriesPlaces?: any[];
  prixMin?: number;
  prixMax?: number;
  imagesBlob?: any[];
  surfaceType?: string | null;
  dimensions?: string | null;
  siteWeb?: string | null;
}

export interface AnnonceStadeDistance {
  id: string;
  stade: {
    id: string;
    nom: string;
    ville: string;
    adresseComplete?: string;
    latitude: number;
    longitude: number;
    capacite?: number;
    description?: string;
    images?: string[];
    // Champs supplémentaires renvoyés par l'API
    estActif?: boolean;
    dateCreation?: string;
    dateModification?: string | null;
    surfaceMetresCarres?: number;
    categories?: string[];
    categoriesPlaces?: any[];
    prixMin?: number;
    prixMax?: number;
    imagesBlob?: any[];
    surfaceType?: string | null;
    dimensions?: string | null;
    siteWeb?: string | null;
    telephone?: string | null;
  };
  distance: number;
  tempsTrajetMinutes?: number;
  modeTransport?: string;
  estLePlusProche?: boolean;
  dateCreation?: string;
  dateModification?: string;
  tempsTrajetFormate?: string;
}

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

  private getOptionalAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    const headers: { [key: string]: string } = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return new HttpHeaders(headers);
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

  connexion(email: string, password: string, verificationToken?: string): Observable<LoginResponse> {
    const body: any = {
      email: email,
      password: password
    };
    if (verificationToken && verificationToken.trim().length > 0) {
      body.verificationToken = verificationToken.trim();
    }
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, body);
  }

  // Demander la réexpédition du token de vérification par email
  resendVerificationToken(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/resend-verification-token`, { email }, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      responseType: 'text'
    });
  }

  // Récupérer toutes les annonces
  getAnnonces(): Observable<Annonce[]> {
    return this.http.get<Annonce[]>(`${this.baseUrl}/annonces`, {
      headers: this.getAuthHeaders()
    });
  }

  // Récupérer tous les stades
  getStades(): Observable<Stade[]> {
    return this.http.get<Stade[]>(`${this.baseUrl}/stades`, {
      headers: this.getAuthHeaders()
    });
  }

  // Méthode pour récupérer une annonce par ID avec en-têtes facultatifs
  getAnnonceById(id: string): Observable<Annonce> {
    console.log('Appel API getAnnonceById:', `${this.baseUrl}/annonces/${id}`);
    return this.http.get<Annonce>(`${this.baseUrl}/annonces/${id}`, {
      headers: this.getOptionalAuthHeaders()
    });
  }

  // Distances des stades pour une annonce donnée
  getAnnonceDistances(id: string): Observable<AnnonceStadeDistance[]> {
    return this.http.get<AnnonceStadeDistance[]>(`${this.baseUrl}/annonces/${id}/distances`, {
      headers: this.getOptionalAuthHeaders()
    });
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

  // ===== RIBS =====

  creerRib(request: CreateRibRequest): Observable<RibDTO> {
    return this.http.post<RibDTO>(`${this.baseUrl}/ribs`, request, {
      headers: this.getAuthHeaders()
    });
  }

  definirRibDefaut(ribId: string): Observable<RibDTO> {
    return this.http.post<RibDTO>(`${this.baseUrl}/ribs/${ribId}/defaut`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  getRibPlateformeDefaut(): Observable<RibDTO> {
    return this.http.get<RibDTO>(`${this.baseUrl}/ribs/platform/default`, {
      headers: this.getAuthHeaders()
    });
  }

  getRibsLocateur(locateurId: string): Observable<RibDTO[]> {
    return this.http.get<RibDTO[]>(`${this.baseUrl}/ribs/locateur/${locateurId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getRibsLocataire(locataireId: string): Observable<RibDTO[]> {
    return this.http.get<RibDTO[]>(`${this.baseUrl}/ribs/locataire/${locataireId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // ===== PAIEMENTS =====

  creerPaiement(request: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/paiements`, request, {
      headers: this.getAuthHeaders()
    });
  }

  confirmerPaiement(paiementId: string, request: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/paiements/${paiementId}/confirmer`, request, {
      headers: this.getAuthHeaders()
    });
  }

  getPaiementById(paiementId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/paiements/${paiementId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getPaiementsByReservation(reservationId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/paiements/reservation/${reservationId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // ===== INSTRUCTIONS DE TRANSACTION (PAYOUTS/REMBOURSEMENTS) =====

  genererSplitPaiement(paiementId: string): Observable<TransactionInstructionDTO[]> {
    return this.http.post<TransactionInstructionDTO[]>(`${this.baseUrl}/payouts/generate/split/${paiementId}`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  getInstructionsByPaiement(paiementId: string): Observable<TransactionInstructionDTO[]> {
    return this.http.get<TransactionInstructionDTO[]>(`${this.baseUrl}/payouts/paiement/${paiementId}`, {
      headers: this.getAuthHeaders()
    });
  }

  genererRemboursementReservation(reservationId: string, raisonRemboursement?: string): Observable<TransactionInstructionDTO[]> {
    const body = raisonRemboursement && raisonRemboursement.trim().length > 0
      ? { raisonRemboursement: raisonRemboursement.trim() }
      : {};
    return this.http.post<TransactionInstructionDTO[]>(`${this.baseUrl}/payouts/generate/remboursement/${reservationId}`, body, {
      headers: this.getAuthHeaders()
    });
  }

  listerInstructionsEnAttente(): Observable<TransactionInstructionDTO[]> {
    return this.http.get<TransactionInstructionDTO[]>(`${this.baseUrl}/payouts/pending`, {
      headers: this.getAuthHeaders()
    });
  }

  executerInstruction(instructionId: string, reference: string): Observable<TransactionInstructionDTO> {
    return this.http.post<TransactionInstructionDTO>(`${this.baseUrl}/payouts/${instructionId}/executer`, { reference }, {
      headers: this.getAuthHeaders()
    });
  }

  annulerInstruction(instructionId: string, notes: string): Observable<TransactionInstructionDTO> {
    return this.http.post<TransactionInstructionDTO>(`${this.baseUrl}/payouts/${instructionId}/annuler`, { notes }, {
      headers: this.getAuthHeaders()
    });
  }

  // ===== ENCAISSEMENTS (EXECUTED reçus par les RIBs) =====

  getEncaissementsLocataire(locataireId: string): Observable<TransactionInstructionDTO[]> {
    return this.http.get<TransactionInstructionDTO[]>(`${this.baseUrl}/payouts/encaissements/locataire/${locataireId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getEncaissementsLocateur(locateurId: string): Observable<TransactionInstructionDTO[]> {
    return this.http.get<TransactionInstructionDTO[]>(`${this.baseUrl}/payouts/encaissements/locateur/${locateurId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getEncaissementsPlateforme(): Observable<TransactionInstructionDTO[]> {
    return this.http.get<TransactionInstructionDTO[]>(`${this.baseUrl}/payouts/encaissements/plateforme`, {
      headers: this.getAuthHeaders()
    });
  }

  // ===== SOLDES (entrées, sorties, net) =====

  getSoldeLocataire(locataireId: string): Observable<SoldeResponse> {
    return this.http.get<SoldeResponse>(`${this.baseUrl}/payouts/solde/locataire/${locataireId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getSoldeLocateur(locateurId: string): Observable<SoldeResponse> {
    return this.http.get<SoldeResponse>(`${this.baseUrl}/payouts/solde/locateur/${locateurId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getSoldePlateforme(): Observable<SoldeResponse> {
    return this.http.get<SoldeResponse>(`${this.baseUrl}/payouts/solde/plateforme`, {
      headers: this.getAuthHeaders()
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

  // ===== API MOT DE PASSE OUBLIÉ =====
  
  // Envoyer le code de réinitialisation (6 chiffres)
  envoyerCodeReinitialisation(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/password/send-code`, { email }, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      responseType: 'text'
    });
  }

  // Vérifier le code de réinitialisation
  verifierCodeReinitialisation(email: string, code: string): Observable<{ valid: boolean }> {
    return this.http.post<{ valid: boolean }>(`${this.baseUrl}/auth/password/verify-code`, { email, code }, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  // Réinitialiser le mot de passe
  reinitialiserMotDePasse(email: string, code: string, nouveauMotDePasse: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/password/reset`, { email, code, nouveauMotDePasse }, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      responseType: 'text'
    });
  }
} 