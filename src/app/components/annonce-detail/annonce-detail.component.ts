import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Annonce } from '../../models/annonce.model';

@Component({
  selector: 'app-annonce-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './annonce-detail.component.html',
  styleUrls: ['./annonce-detail.component.css']
})
export class AnnonceDetailComponent implements OnInit {
  annonce: Annonce | null = null;
  loading = true;
  error = '';
  isLocataire = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.verifierTypeUtilisateur();
  }

  verifierTypeUtilisateur(): void {
    const userType = this.authService.getUserType();
    if (userType === 'LOCATAIRE') {
      this.isLocataire = true;
      const annonceId = this.route.snapshot.paramMap.get('id');
      if (annonceId) {
        this.chargerAnnonce(annonceId);
      } else {
        this.error = 'ID d\'annonce manquant';
        this.loading = false;
      }
    } else {
      this.isLocataire = false;
      this.loading = false;
      this.error = 'Accès réservé aux locataires uniquement';
    }
  }

  chargerAnnonce(id: string): void {
    this.loading = true;
    this.apiService.getAnnonceById(id).subscribe({
      next: (annonce) => {
        this.annonce = annonce;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'annonce:', error);
        this.error = 'Erreur lors du chargement de l\'annonce';
        this.loading = false;
      }
    });
  }

  retourListe(): void {
    this.router.navigate(['/annonces']);
  }

  retourDashboard(): void {
    this.router.navigate(['/dashboard']);
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

  formaterDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
} 