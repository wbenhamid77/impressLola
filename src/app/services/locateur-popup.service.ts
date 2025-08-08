import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Locateur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  photoProfil: string | null;
  description: string;
  noteMoyenne: number;
  nombreAnnonces: number;
  estVerifie: boolean;
  raisonSociale: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocateurPopupService {
  private showPopupSubject = new BehaviorSubject<boolean>(false);
  private selectedLocateurSubject = new BehaviorSubject<Locateur | null>(null);

  showPopup$ = this.showPopupSubject.asObservable();
  selectedLocateur$ = this.selectedLocateurSubject.asObservable();

  constructor() { }

  openPopup(locateur: Locateur): void {
    this.selectedLocateurSubject.next(locateur);
    this.showPopupSubject.next(true);
  }

  closePopup(): void {
    this.showPopupSubject.next(false);
    this.selectedLocateurSubject.next(null);
  }

  getSelectedLocateur(): Locateur | null {
    return this.selectedLocateurSubject.value;
  }

  isPopupOpen(): boolean {
    return this.showPopupSubject.value;
  }
} 