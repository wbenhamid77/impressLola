import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Stade, StadeAvecDistance } from '../models/stade.model';

@Injectable({
  providedIn: 'root'
})
export class StadePopupService {
  private showPopupSubject = new BehaviorSubject<boolean>(false);
  private selectedStadeSubject = new BehaviorSubject<Stade | null>(null);
  
  // Pour la popup de tous les stades
  private showTousStadesPopupSubject = new BehaviorSubject<boolean>(false);
  private tousStadesDataSubject = new BehaviorSubject<{
    stades: StadeAvecDistance[];
    adresseLogement: string;
  } | null>(null);

  showPopup$ = this.showPopupSubject.asObservable();
  selectedStade$ = this.selectedStadeSubject.asObservable();
  
  // Observables pour tous les stades
  showTousStadesPopup$ = this.showTousStadesPopupSubject.asObservable();
  tousStadesData$ = this.tousStadesDataSubject.asObservable();

  constructor() { }

  ouvrirPopup(stade: Stade): void {
    this.selectedStadeSubject.next(stade);
    this.showPopupSubject.next(true);
  }

  fermerPopup(): void {
    this.showPopupSubject.next(false);
    // Délai pour l'animation de fermeture
    setTimeout(() => {
      this.selectedStadeSubject.next(null);
    }, 300);
  }

  // Méthodes pour tous les stades
  ouvrirTousStadesPopup(stades: StadeAvecDistance[], adresseLogement: string): void {
    this.tousStadesDataSubject.next({ stades, adresseLogement });
    this.showTousStadesPopupSubject.next(true);
  }

  fermerTousStadesPopup(): void {
    this.showTousStadesPopupSubject.next(false);
    // Délai pour l'animation de fermeture
    setTimeout(() => {
      this.tousStadesDataSubject.next(null);
    }, 300);
  }

  estOuvert(): boolean {
    return this.showPopupSubject.value;
  }

  estTousStadesOuvert(): boolean {
    return this.showTousStadesPopupSubject.value;
  }
} 