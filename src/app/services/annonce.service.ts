import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface AnnonceInfo {
  id: string;
  titre: string;
  adresse: string;
  prix: number;
  type: string;
  description: string;
  imageUrl?: string;
  superficie: number;
  nombreChambres: number;
  nombreSallesDeBain: number;
  equipements: string[];
  proprietaire: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    avatarUrl?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AnnonceService {
  private readonly API_BASE_URL = 'http://localhost:8083';

  constructor(private http: HttpClient) {}

  /**
   * Récupère une annonce par son ID
   */
  getAnnonceById(id: string): Observable<AnnonceInfo> {
    // Simulation d'un appel API (remplacer par votre vraie API)
    const annonce: AnnonceInfo = {
      id: id,
      titre: `Appartement moderne ${id}`,
      adresse: `123 Rue de la Paix, 75001 Paris`,
      prix: Math.floor(Math.random() * 200) + 50,
      type: 'Appartement',
      description: 'Magnifique appartement moderne avec vue sur la ville. Idéal pour un séjour confortable.',
      imageUrl: `https://picsum.photos/400/300?random=${id}`,
      superficie: Math.floor(Math.random() * 100) + 30,
      nombreChambres: Math.floor(Math.random() * 3) + 1,
      nombreSallesDeBain: Math.floor(Math.random() * 2) + 1,
      equipements: ['WiFi', 'Cuisine équipée', 'Climatisation', 'Balcon'],
      proprietaire: {
        id: `prop-${id}`,
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@example.com',
        telephone: '+33 6 12 34 56 78',
        avatarUrl: `https://picsum.photos/100/100?random=prop-${id}`
      }
    };

    // Simulation d'un délai réseau
    return of(annonce).pipe(delay(300));
  }

  /**
   * Récupère plusieurs annonces par leurs IDs
   */
  getAnnoncesByIds(ids: string[]): Observable<AnnonceInfo[]> {
    if (ids.length === 0) {
      return of([]);
    }

    // Création d'observables pour chaque ID
    const observables = ids.map(id => this.getAnnonceById(id));
    
    // Utilisation de forkJoin pour combiner tous les observables
    return forkJoin(observables);
  }

  /**
   * Recherche des annonces par critères
   */
  rechercherAnnonces(criteres: {
    ville?: string;
    type?: string;
    prixMin?: number;
    prixMax?: number;
    nombreChambres?: number;
  }): Observable<AnnonceInfo[]> {
    // Simulation de recherche
    const annonces: AnnonceInfo[] = [];
    
    for (let i = 1; i <= 10; i++) {
      annonces.push({
        id: `annonce-${i}`,
        titre: `Annonce ${i}`,
        adresse: `${criteres.ville || 'Paris'}, France`,
        prix: Math.floor(Math.random() * 200) + 50,
        type: criteres.type || 'Appartement',
        description: 'Description de l\'annonce',
        imageUrl: `https://picsum.photos/400/300?random=${i}`,
        superficie: Math.floor(Math.random() * 100) + 30,
        nombreChambres: criteres.nombreChambres || Math.floor(Math.random() * 3) + 1,
        nombreSallesDeBain: Math.floor(Math.random() * 2) + 1,
        equipements: ['WiFi', 'Cuisine équipée'],
        proprietaire: {
          id: `prop-${i}`,
          nom: `Nom${i}`,
          prenom: `Prénom${i}`,
          email: `proprietaire${i}@example.com`,
          telephone: `+33 6 ${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
          avatarUrl: `https://picsum.photos/100/100?random=prop-${i}`
        }
      });
    }

    return of(annonces).pipe(delay(500));
  }

  /**
   * Met à jour une annonce
   */
  mettreAJourAnnonce(id: string, annonce: Partial<AnnonceInfo>): Observable<AnnonceInfo> {
    // Simulation de mise à jour
    return this.getAnnonceById(id).pipe(
      delay(400)
    );
  }

  /**
   * Supprime une annonce
   */
  supprimerAnnonce(id: string): Observable<boolean> {
    // Simulation de suppression
    return of(true).pipe(delay(300));
  }
} 