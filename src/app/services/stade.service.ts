import { Injectable } from '@angular/core';
import { Stade, StadeAvecDistance, STADES_CAN_2025 } from '../models/stade.model';

@Injectable({
  providedIn: 'root'
})
export class StadeService {

  constructor() { }

  /**
   * Calcule la distance entre deux points géographiques en utilisant la formule de Haversine
   */
  private calculerDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en kilomètres
    const dLat = this.degToRad(lat2 - lat1);
    const dLon = this.degToRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Arrondir à 1 décimale
  }

  private degToRad(deg: number): number {
    return deg * (Math.PI/180);
  }

  /**
   * Obtient tous les stades avec leur distance par rapport à un point donné
   */
  getStadesAvecDistances(latitude: number, longitude: number): StadeAvecDistance[] {
    return STADES_CAN_2025.map(stade => ({
      ...stade,
      distance: this.calculerDistance(latitude, longitude, stade.latitude, stade.longitude)
    })).sort((a, b) => a.distance - b.distance);
  }

  /**
   * Trouve le stade le plus proche d'un point donné
   */
  getStadePlusProche(latitude: number, longitude: number): StadeAvecDistance {
    const stadesAvecDistances = this.getStadesAvecDistances(latitude, longitude);
    return stadesAvecDistances[0];
  }

  /**
   * Obtient un stade par son ID
   */
  getStadeParId(id: string): Stade | undefined {
    return STADES_CAN_2025.find(stade => stade.id === id);
  }

  /**
   * Obtient un stade par son nom
   */
  getStadeParNom(nom: string): Stade | undefined {
    return STADES_CAN_2025.find(stade => stade.nom === nom);
  }

  /**
   * Obtient tous les stades
   */
  getTousLesStades(): Stade[] {
    return STADES_CAN_2025;
  }

  /**
   * Met à jour les informations de stade dans une annonce
   */
  mettreAJourStadeAnnonce(latitude: number, longitude: number): {
    stadePlusProche: string;
    distanceStade: number;
    adresseStade: string;
  } {
    const stadePlusProche = this.getStadePlusProche(latitude, longitude);
    return {
      stadePlusProche: stadePlusProche.nom,
      distanceStade: stadePlusProche.distance,
      adresseStade: stadePlusProche.adresse
    };
  }
} 