import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

import { ReservationService, StatistiquesReservation } from '../../services/reservation.service';
import { Reservation } from '../../models/reservation.model';
import { AuthService } from '../../services/auth.service';
import { AnnonceService, AnnonceInfo } from '../../services/annonce.service';
import { EntityDetailsService, ReservationDetails } from '../../services/entity-details.service';

// Interface pour les informations d'annonce simplifiée
interface AnnonceInfoSimple {
  id: string;
  titre: string;
  adresse: string;
  prix: number;
  type: string;
  imageUrl?: string;
}

// Interface pour les informations de locataire simplifiée
interface LocataireInfoSimple {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  avatarUrl?: string;
}

// Interface pour les informations complètes du locataire
interface LocataireInfoComplet {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  avatarUrl?: string;
  dateInscription: string;
  nombreReservations: number;
  noteMoyenne: number;
  adresse: string;
  bio?: string;
}

@Component({
  selector: 'app-reservations-locateur',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './reservations-locateur.component.html',
  styleUrls: ['./reservations-locateur.component.css']
})
export class ReservationsLocateurComponent implements OnInit, OnDestroy {
  // États du composant
  loading = false;
  error = '';
  success = '';
  
  // Données des réservations - maintenant utilisant ReservationDetails
  toutes: ReservationDetails[] = [];
  enAttente: ReservationDetails[] = [];
  confirmees: ReservationDetails[] = [];
  enCours: ReservationDetails[] = [];
  terminees: ReservationDetails[] = [];
  annulees: ReservationDetails[] = [];
  
  // Statistiques
  statistiques: StatistiquesReservation | null = null;
  
  // Informations des annonces et locataires
  annoncesInfo: Map<string, AnnonceInfoSimple> = new Map();
  locatairesInfo: Map<string, LocataireInfoSimple> = new Map();
  
  // Popups
  showAnnoncePopup = false;
  showLocatairePopup = false;
  annonceSelectionnee: AnnonceInfo | null = null;
  locataireSelectionne: LocataireInfoComplet | null = null;
  
  // Filtres et recherche
  filtreStatut = 'TOUS';
  recherche = '';
  filtrePeriode = 'TOUTES';
  
  // Formulaire de modification de statut
  showStatutForm = false;
  reservationSelectionnee: ReservationDetails | null = null;
  statutForm: FormGroup;
  
  // Pagination
  page = 1;
  itemsPerPage = 10;
  
  // Gestion de la destruction
  private destroy$ = new Subject<void>();

  constructor(
    private reservationService: ReservationService,
    private authService: AuthService,
    private annonceService: AnnonceService,
    private entityDetailsService: EntityDetailsService,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.statutForm = this.fb.group({
      nouveauStatut: ['', Validators.required],
      raison: [''],
      commentaire: ['']
    });
  }

  ngOnInit(): void {
    this.chargerReservations();
    this.chargerStatistiques();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== CHARGEMENT DES DONNÉES =====
  
  chargerReservations(): void {
    this.loading = true;
    this.error = '';
    
    const locateurId = this.authService.getLocateurId();
    if (!locateurId) {
      this.error = 'ID du locateur non trouvé';
      this.loading = false;
      return;
    }

    this.entityDetailsService.getReservationsLocateur(locateurId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (reservations) => {
          this.toutes = reservations;
          this.categoriserReservations();
          this.chargerInformationsSupplementaires();
        },
        error: (err) => {
          console.error('Erreur lors du chargement des réservations:', err);
          this.error = 'Erreur lors du chargement des réservations';
        }
      });
  }

  chargerStatistiques(): void {
    const locateurId = this.authService.getLocateurId();
    if (!locateurId) return;

    // Calculer les statistiques localement
    this.calculerStatistiques();
  }

  calculerStatistiques(): void {
    if (this.toutes.length === 0) {
      this.statistiques = null;
      return;
    }

    const total = this.toutes.length;
    const enAttente = this.enAttente.length;
    const confirmees = this.confirmees.length;
    const enCours = this.enCours.length;
    const terminees = this.terminees.length;
    const annulees = this.annulees.length;

    const revenus = this.toutes
      .filter(r => r.statut === 'CONFIRMEE' || r.statut === 'EN_COURS' || r.statut === 'TERMINEE')
      .reduce((sum, r) => sum + (r.montantTotal || 0), 0);

    this.statistiques = {
      total,
      enAttente,
      confirmees,
      enCours,
      terminees,
      annulees,
      revenus
    };
  }

  // ===== CATÉGORISATION DES RÉSERVATIONS =====
  
  categoriserReservations(): void {
    this.enAttente = this.toutes.filter(r => r.statut === 'EN_ATTENTE');
    this.confirmees = this.toutes.filter(r => r.statut === 'CONFIRMEE');
    this.enCours = this.toutes.filter(r => r.statut === 'EN_COURS');
    this.terminees = this.toutes.filter(r => r.statut === 'TERMINEE');
    this.annulees = this.toutes.filter(r => r.statut === 'ANNULEE');
  }

  // ===== CHARGEMENT DES INFORMATIONS SUPPLÉMENTAIRES =====
  
  chargerInformationsSupplementaires(): void {
    const annonceIds = [...new Set(this.toutes.map(r => r.annonce?.id).filter(Boolean))];
    const locataireIds = [...new Set(this.toutes.map(r => r.locataire?.id).filter(Boolean))];

    // Charger les informations des annonces
    if (annonceIds.length > 0) {
      forkJoin(
        annonceIds.map(id => 
          this.annonceService.getAnnonceById(id).pipe(
            catchError(() => of(null))
          )
        )
      ).pipe(takeUntil(this.destroy$))
      .subscribe(annonces => {
        annonces.forEach(annonce => {
          if (annonce) {
            this.annoncesInfo.set(annonce.id, {
              id: annonce.id,
              titre: annonce.titre,
              adresse: annonce.adresse,
              prix: annonce.prix,
              type: annonce.type,
              imageUrl: annonce.imageUrl
            });
          }
        });
      });
    }

    // Charger les informations des locataires
    if (locataireIds.length > 0) {
      forkJoin(
        locataireIds.map(id => 
          this.http.get<any>(`http://localhost:8083/api/locataires/${id}`).pipe(
            catchError(() => of(null))
          )
        )
      ).pipe(takeUntil(this.destroy$))
      .subscribe(locataires => {
        locataires.forEach(locataire => {
          if (locataire) {
            this.locatairesInfo.set(locataire.id, {
              id: locataire.id,
              nom: locataire.nom,
              prenom: locataire.prenom,
              email: locataire.email,
              telephone: locataire.telephone,
              avatarUrl: locataire.avatarUrl
            });
          }
        });
      });
    }
  }

  // ===== GESTION DES STATUTS =====
  
  ouvrirFormulaireStatut(reservation: ReservationDetails): void {
    this.reservationSelectionnee = reservation;
    this.statutForm.patchValue({
      nouveauStatut: reservation.statut,
      raison: '',
      commentaire: ''
    });
    this.showStatutForm = true;
  }

  changerStatutReservation(): void {
    if (!this.reservationSelectionnee || !this.statutForm.valid) return;

    const { nouveauStatut, raison, commentaire } = this.statutForm.value;
    
    this.loading = true;
    this.error = '';
    this.success = '';

    // Appel API pour changer le statut
    this.http.put<any>(`http://localhost:8083/api/reservations/${this.reservationSelectionnee.id}/statut`, {
      statut: nouveauStatut,
      raison: raison,
      commentaire: commentaire
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading = false)
    ).subscribe({
      next: (response) => {
        this.success = `Statut de la réservation modifié avec succès en "${nouveauStatut}"`;
        this.showStatutForm = false;
        this.chargerReservations(); // Recharger pour mettre à jour l'affichage
      },
      error: (err) => {
        console.error('Erreur lors du changement de statut:', err);
        this.error = 'Erreur lors du changement de statut';
      }
    });
  }

  // ===== ACTIONS SUR LES RÉSERVATIONS =====
  
  confirmerReservation(reservation: ReservationDetails): void {
    if (!confirm('Êtes-vous sûr de vouloir confirmer cette réservation ?')) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    this.http.put<any>(`http://localhost:8083/api/reservations/${reservation.id}/confirmer`, {})
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response) => {
          this.success = 'Réservation confirmée avec succès';
          this.chargerReservations();
        },
        error: (err) => {
          console.error('Erreur lors de la confirmation:', err);
          this.error = 'Erreur lors de la confirmation';
        }
      });
  }

  annulerReservation(reservation: ReservationDetails): void {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    this.http.put<any>(`http://localhost:8083/api/reservations/${reservation.id}/annuler`, {
      raison: 'Annulation par le locateur'
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading = false)
    ).subscribe({
      next: (response) => {
        this.success = 'Réservation annulée avec succès';
        this.chargerReservations();
      },
      error: (err) => {
        console.error('Erreur lors de l\'annulation:', err);
        this.error = 'Erreur lors de l\'annulation';
      }
    });
  }

  // ===== GESTION DES POPUPS =====
  
  ouvrirPopupAnnonce(annonceId: string): void {
    this.annonceService.getAnnonceById(annonceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (annonce) => {
          this.annonceSelectionnee = annonce;
          this.showAnnoncePopup = true;
        },
        error: (err) => {
          console.error('Erreur lors du chargement de l\'annonce:', err);
          this.error = 'Erreur lors du chargement de l\'annonce';
        }
      });
  }

  ouvrirPopupLocataire(locataireId: string): void {
    this.http.get<any>(`http://localhost:8083/api/locataires/${locataireId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (locataire) => {
          this.locataireSelectionne = locataire;
          this.showLocatairePopup = true;
        },
        error: (err) => {
          console.error('Erreur lors du chargement du locataire:', err);
          this.error = 'Erreur lors du chargement du locataire';
        }
      });
  }

  fermerPopupAnnonce(): void {
    this.showAnnoncePopup = false;
    this.annonceSelectionnee = null;
  }

  fermerPopupLocataire(): void {
    this.showLocatairePopup = false;
    this.locataireSelectionne = null;
  }

  fermerFormulaireStatut(): void {
    this.showStatutForm = false;
    this.reservationSelectionnee = null;
    this.statutForm.reset();
  }

  // ===== FILTRAGE ET RECHERCHE =====
  
  filtrerReservations(): ReservationDetails[] {
    let reservationsFiltrees = this.toutes;

    // Filtre par statut
    if (this.filtreStatut !== 'TOUS') {
      reservationsFiltrees = reservationsFiltrees.filter(r => r.statut === this.filtreStatut);
    }

    // Filtre par période
    if (this.filtrePeriode !== 'TOUTES') {
      const maintenant = new Date();
      const aujourdhui = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
      
      switch (this.filtrePeriode) {
        case 'FUTURES':
          reservationsFiltrees = reservationsFiltrees.filter(r => 
            new Date(r.dateArrivee) > aujourdhui
          );
          break;
        case 'EN_COURS':
          reservationsFiltrees = reservationsFiltrees.filter(r => {
            const arrivee = new Date(r.dateArrivee);
            const depart = new Date(r.dateDepart);
            return arrivee <= aujourdhui && depart >= aujourdhui;
          });
          break;
        case 'PASSEES':
          reservationsFiltrees = reservationsFiltrees.filter(r => 
            new Date(r.dateDepart) < aujourdhui
          );
          break;
      }
    }

    // Filtre par recherche
    if (this.recherche.trim()) {
      const rechercheLower = this.recherche.toLowerCase();
      reservationsFiltrees = reservationsFiltrees.filter(r => 
        r.annonce?.titre?.toLowerCase().includes(rechercheLower) ||
        this.getAdresseFormatee(r)?.toLowerCase().includes(rechercheLower) ||
        r.locataire?.nom?.toLowerCase().includes(rechercheLower) ||
        r.locataire?.prenom?.toLowerCase().includes(rechercheLower) ||
        r.id?.toLowerCase().includes(rechercheLower)
      );
    }

    return reservationsFiltrees;
  }

  // ===== PAGINATION =====
  
  getReservationsPaginees(): ReservationDetails[] {
    const reservationsFiltrees = this.filtrerReservations();
    const debut = (this.page - 1) * this.itemsPerPage;
    const fin = debut + this.itemsPerPage;
    return reservationsFiltrees.slice(debut, fin);
  }

  getNombrePages(): number {
    const reservationsFiltrees = this.filtrerReservations();
    return Math.ceil(reservationsFiltrees.length / this.itemsPerPage);
  }

  changerPage(page: number): void {
    if (page >= 1 && page <= this.getNombrePages()) {
      this.page = page;
    }
  }

  // ===== UTILITAIRES =====
  
  formaterPrix(prix: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(prix);
  }

  formaterDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formaterStatut(statut: string): string {
    const statuts: { [key: string]: string } = {
      'EN_ATTENTE': 'En attente',
      'CONFIRMEE': 'Confirmée',
      'EN_COURS': 'En cours',
      'TERMINEE': 'Terminée',
      'ANNULEE': 'Annulée'
    };
    return statuts[statut] || statut;
  }

  getClasseStatut(statut: string): string {
    const classes: { [key: string]: string } = {
      'EN_ATTENTE': 'status-en-attente',
      'CONFIRMEE': 'status-confirmee',
      'EN_COURS': 'status-en-cours',
      'TERMINEE': 'status-terminee',
      'ANNULEE': 'status-annulee'
    };
    return classes[statut] || '';
  }

  getIconeStatut(statut: string): string {
    const icones: { [key: string]: string } = {
      'EN_ATTENTE': '⏳',
      'CONFIRMEE': '✅',
      'EN_COURS': '🏃',
      'TERMINEE': '🏁',
      'ANNULEE': '❌'
    };
    return icones[statut] || '❓';
  }

  // ===== UTILITAIRES SUPPLÉMENTAIRES =====
  
  getAdresseFormatee(reservation: ReservationDetails): string {
    if (!reservation.annonce?.adresse) return '';
    
    const adresse = reservation.annonce.adresse;
    const parts = [
      adresse.numero,
      adresse.rue,
      adresse.codePostal,
      adresse.ville,
      adresse.pays
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  // ===== GESTION DES ERREURS =====
  
  effacerMessage(): void {
    this.error = '';
    this.success = '';
  }
} 