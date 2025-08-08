import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Annonce } from '../../../models/annonce.model';

@Component({
  selector: 'app-annonce-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './annonce-popup.component.html',
  styleUrls: ['./annonce-popup.component.css']
})
export class AnnoncePopupComponent {
  @Input() annonce: Annonce | null = null;
  @Input() isVisible: boolean = false;
  @Output() closePopup = new EventEmitter<void>();

  constructor() {}

  onClose(): void {
    this.closePopup.emit();
  }

  onOverlayClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  getTypeMaisonLabel(type: string): string {
    const types = {
      'APPARTEMENT': 'Appartement',
      'MAISON': 'Maison',
      'STUDIO': 'Studio',
      'VILLA': 'Villa'
    };
    return types[type as keyof typeof types] || type;
  }

  getNoteEtoiles(note: number): string[] {
    const etoiles = [];
    const noteEntiere = Math.floor(note);
    const noteDecimale = note - noteEntiere;
    
    for (let i = 0; i < 5; i++) {
      if (i < noteEntiere) {
        etoiles.push('★');
      } else if (i === noteEntiere && noteDecimale > 0) {
        etoiles.push('☆');
      } else {
        etoiles.push('☆');
      }
    }
    
    return etoiles;
  }

  getStatutBadge(estActive: boolean): { text: string; class: string } {
    return estActive 
      ? { text: 'Active', class: 'badge-success' }
      : { text: 'Inactive', class: 'badge-warning' };
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatPrice(price: number): string {
    return price.toLocaleString('fr-FR') + '€';
  }
} 