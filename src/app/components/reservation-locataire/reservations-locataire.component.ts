import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, Observable, of } from 'rxjs';
import { catchError, finalize, map, timeout } from 'rxjs/operators';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule } from '@angular/material/paginator';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { TabViewModule } from 'primeng/tabview';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';

import { ReservationService } from '../../services/reservation.service';
import { Reservation } from '../../models/reservation.model';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';

// Interface pour une réservation simple
interface ReservationLocataire {
  id: string;
  dateArrivee: string;
  dateDepart: string;
  statut: 'EN_ATTENTE' | 'CONFIRMEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
  prixTotal: number;
  nombreNuits?: number;
  nombreVoyageurs?: number;
  modePaiement?: string;
  numeroTransaction?: string | null;
  datePaiement?: string | null;
  fraisService?: number;
  fraisNettoyage?: number;
  fraisDepot?: number;
  annonce: {
    id: string;
    titre: string;
    adresse: {
      numero?: string;
      rue?: string;
      codePostal?: string;
      ville: string;
      pays: string;
    };
    prixParNuit: number;
    images: string[];
  };
  locateur: {
    id: string;
    nom: string;
    prenom: string;
  };
  dateCreation: string;
  dateConfirmation?: string;
  dateAnnulation?: string;
}

// Interface pour les statistiques
interface Statistiques {
  total: number;
  enAttente: number;
  confirmees: number;
  enCours: number;
  terminees: number;
  annulees: number;
}

// Interface pour la création de réservation
interface CreationReservation {
  annonceId: string;
  dateArrivee: string;
  dateDepart: string;
  nombrePersonnes: number;
  commentaires?: string;
}

// Interface pour la vérification de disponibilité
interface Disponibilite {
  disponible: boolean;
  message?: string;
}

// Interface pour les favoris
interface Favori {
  id: string;
  annonceId: string;
  dateAjout: string;
}

@Component({
  selector: 'app-reservations-locataire',
  templateUrl: './reservations-locataire.component.html',
  styleUrls: ['./reservations-locataire.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    // Angular Material
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatPaginatorModule,
    // PrimeNG
    CardModule,
    ButtonModule,
    ChipModule,
    ProgressSpinnerModule,
    ToastModule,
    DialogModule,
    InputTextModule,
    DropdownModule,
    CalendarModule,
    TabViewModule,
    BadgeModule,
    TooltipModule,
    DividerModule,
    AvatarModule,
    TagModule
  ]
})
export class ReservationsLocataireComponent implements OnInit, OnDestroy {
  // Réservations
  reservations: ReservationLocataire[] = [];
  reservationsFutures: ReservationLocataire[] = [];
  reservationsPassees: ReservationLocataire[] = [];
  reservationsFiltrees: ReservationLocataire[] = [];
  reservationsAffichees: ReservationLocataire[] = [];
  totalReservations: number = 0;
  reservationSelectionnee: ReservationLocataire | null = null;
  favoris: Favori[] = [];
  
  // États de chargement
  loading = false;
  loadingReservations = false;
  loadingFavoris = false;
  loadingCreation = false;
  
  // Messages
  error = '';
  success = '';
  message: { type: 'success' | 'danger'; text: string } | null = null;
  
  // Filtres
  filtreStatut: string = '';
  filtrePeriode: string = '';
  recherche: string = '';
  ongletActif: string = 'toutes';
  
  // Pagination
  page = 1;
  reservationsParPage = 10;
  
  // Formulaires
  formulaireCreation: FormGroup;
  formulaireRecherche: FormGroup;
  
  // États des modals
  modalCreationOuverte = false;
  modalDetailsOuverte = false;
  
  // Statistiques
  statistiques: Statistiques = {
    total: 0,
    enAttente: 0,
    confirmees: 0,
    enCours: 0,
    terminees: 0,
    annulees: 0
  };
  statistiquesArray: Array<{ key: string; value: number; label: string; icon: string; class: string }> = [];
  
  // URL de base de l'API
  private apiUrl = 'http://localhost:8083';
  private destroy$ = new Subject<void>();
  // Suppression du cache d'annonces: on utilise les champs de l'API directement

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private fb: FormBuilder,
    private reservationService: ReservationService,
    private cdr: ChangeDetectorRef
  ) {
    this.formulaireCreation = this.fb.group({
      annonceId: ['', Validators.required],
      dateArrivee: ['', Validators.required],
      dateDepart: ['', Validators.required],
      nombrePersonnes: [1, [Validators.required, Validators.min(1)]],
      commentaires: ['']
    });
    
    this.formulaireRecherche = this.fb.group({
      recherche: [''],
      statut: ['TOUS'],
      periode: ['TOUTES']
    });
  }

  ngOnInit(): void {
    this.chargerReservations();
    this.chargerFavoris();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== CHARGEMENT DES DONNÉES =====

  chargerReservations(): void {
    const locataireId = this.authService.getLocataireId();
    if (!locataireId) {
      this.error = 'Aucun identifiant locataire trouvé. Veuillez vous reconnecter.';
      return;
    }

    this.loadingReservations = true;
    this.error = '';

    this.reservationService.getReservationsLocataire(locataireId)
      .pipe(
        timeout(10000),
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Erreur lors du chargement des réservations:', error);
          this.error = 'Erreur lors du chargement des réservations';
          return of<Reservation[]>([]);
        }),
        finalize(() => this.loadingReservations = false)
      )
      .subscribe((reservationsApi: any) => {
        const reservationsArray = this.normalizeReservationsResponse(reservationsApi);
        const mapped = reservationsArray.map(r => this.mapperReservation(r));
        this.reservations = mapped;
        this.reservationsFiltrees = [...mapped];
        this.calculerStatistiques();
        this.updateReservationsAffichees();
        this.chargerReservationsFutures();
        this.chargerReservationsPassees();
      });
  }

  chargerReservationsFutures(): void {
    const locataireId = this.authService.getLocataireId();
    if (!locataireId) return;

    this.reservationService.getReservationsFuturesLocataire(locataireId)
      .pipe(
        timeout(10000),
        takeUntil(this.destroy$),
        catchError(() => of<Reservation[]>([]))
      )
      .subscribe(reservations => {
        const arr = this.normalizeReservationsResponse(reservations);
        this.reservationsFutures = arr.map(r => this.mapperReservation(r));
      });
  }

  chargerReservationsPassees(): void {
    const locataireId = this.authService.getLocataireId();
    if (!locataireId) return;

    this.reservationService.getReservationsPasseesLocataire(locataireId)
      .pipe(
        timeout(10000),
        takeUntil(this.destroy$),
        catchError(() => of<Reservation[]>([]))
      )
      .subscribe(reservations => {
        const arr = this.normalizeReservationsResponse(reservations);
        this.reservationsPassees = arr.map(r => this.mapperReservation(r));
      });
  }

  chargerFavoris(): void {
    const locataireId = this.authService.getLocataireId();
    if (!locataireId) return;

    this.loadingFavoris = true;

    this.http.get<Favori[]>(`${this.apiUrl}/api/locataires/${locataireId}/favoris`)
      .pipe(
        timeout(10000),
        takeUntil(this.destroy$),
        catchError(() => of([])),
        finalize(() => this.loadingFavoris = false)
      )
      .subscribe(favoris => {
        this.favoris = favoris;
      });
  }

  // ===== CRÉATION DE RÉSERVATION =====

  ouvrirModalCreation(): void {
    this.modalCreationOuverte = true;
    this.formulaireCreation.reset();
  }

  fermerModalCreation(): void {
    this.modalCreationOuverte = false;
    this.cdr.markForCheck();
  }

  creerReservation(): void {
    if (this.formulaireCreation.valid) {
      this.loadingCreation = true;
      // Logique de création de réservation
      setTimeout(() => {
        this.loadingCreation = false;
        this.modalCreationOuverte = false;
        this.success = 'Réservation créée avec succès !';
      }, 2000);
    }
  }

  // ===== GESTION DES FAVORIS =====

  estFavori(annonceId: string): boolean {
    return this.favoris.some(f => f.annonceId === annonceId);
  }

  ajouterAuxFavoris(annonceId: string): void {
    if (!annonceId) return;
    
    const locataireId = this.authService.getLocataireId();
    if (!locataireId) return;
    
    this.http.post<any>(`${this.apiUrl}/api/locataires/${locataireId}/favoris/${annonceId}`, {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.success = 'Ajouté aux favoris avec succès';
          this.chargerFavoris();
        },
        error: (err) => {
          console.error('Erreur lors de l\'ajout aux favoris:', err);
          this.error = 'Erreur lors de l\'ajout aux favoris';
        }
      });
  }

  retirerDesFavoris(annonceId: string): void {
    if (!annonceId) return;
    
    const locataireId = this.authService.getLocataireId();
    if (!locataireId) return;
    
    this.http.delete<any>(`${this.apiUrl}/api/locataires/${locataireId}/favoris/${annonceId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.success = 'Retiré des favoris avec succès';
          this.chargerFavoris();
        },
        error: (err) => {
          console.error('Erreur lors du retrait des favoris:', err);
          this.error = 'Erreur lors du retrait des favoris';
        }
      });
  }

  // ===== FILTRAGE ET RECHERCHE =====

  appliquerFiltres(): void {
    this.page = 1;
    this.filtrerReservations();
    this.updateReservationsAffichees();
  }

  filtrerReservations(): void {
    let reservationsFiltrees = [...this.reservations];
    
    // Filtre par statut
    if (this.filtreStatut) {
      reservationsFiltrees = reservationsFiltrees.filter(r => r.statut === this.filtreStatut);
    }
    
    // Filtre par période
    if (this.filtrePeriode) {
      const maintenant = new Date();
      switch (this.filtrePeriode) {
        case 'FUTURES':
          reservationsFiltrees = reservationsFiltrees.filter(r => new Date(r.dateArrivee) > maintenant);
          break;
        case 'EN_COURS':
          reservationsFiltrees = reservationsFiltrees.filter(r => 
            new Date(r.dateArrivee) <= maintenant && new Date(r.dateDepart) >= maintenant
          );
          break;
        case 'PASSEES':
          reservationsFiltrees = reservationsFiltrees.filter(r => new Date(r.dateDepart) < maintenant);
          break;
      }
    }
    
    // Filtre par recherche
    if (this.recherche.trim()) {
      const rechercheLower = this.recherche.toLowerCase();
      reservationsFiltrees = reservationsFiltrees.filter(r => 
        r.annonce?.titre?.toLowerCase().includes(rechercheLower) ||
        this.getAdresseFormatee(r).toLowerCase().includes(rechercheLower) ||
        r.locateur?.nom?.toLowerCase().includes(rechercheLower) ||
        r.locateur?.prenom?.toLowerCase().includes(rechercheLower)
      );
    }
    
    this.reservationsFiltrees = reservationsFiltrees;
    this.page = 1;
    this.updateReservationsAffichees();
  }

  // ===== GESTION DES ONGLETS =====

  getOngletIndex(): number {
    const onglets = ['toutes', 'futures', 'passees'];
    return onglets.indexOf(this.ongletActif);
  }

  changerOnglet(index: number): void {
    const onglets = ['toutes', 'futures', 'passees'];
    this.ongletActif = onglets[index];
    this.page = 1;
    this.updateReservationsAffichees();
  }

  // ===== PAGINATION =====

  private updateReservationsAffichees(): void {
    const source = this.reservationsFiltrees.length > 0 ? this.reservationsFiltrees : this.reservations;
    this.totalReservations = source.length;
    const debut = (this.page - 1) * this.reservationsParPage;
    const fin = debut + this.reservationsParPage;
    this.reservationsAffichees = source.slice(debut, fin);
  }

  changerPage(event: any): void {
    if (event.pageIndex !== undefined) {
      this.page = event.pageIndex + 1;
      this.updateReservationsAffichees();
    }
  }

  // ===== MODALS =====

  voirDetails(reservation: ReservationLocataire): void {
    this.reservationSelectionnee = reservation;
    this.modalDetailsOuverte = true;
  }

  fermerModalDetails(): void {
    this.modalDetailsOuverte = false;
    this.reservationSelectionnee = null;
    this.cdr.markForCheck();
  }

  fermerModalOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.fermerModalDetails();
    }
  }

  // ===== UTILITAIRES =====

  private buildStatistiquesArray(): void {
    this.statistiquesArray = [
      { key: 'total', value: this.statistiques.total, label: 'Total', icon: 'list', class: 'stat-total' },
      { key: 'enAttente', value: this.statistiques.enAttente, label: 'En attente', icon: 'schedule', class: 'stat-attente' },
      { key: 'confirmees', value: this.statistiques.confirmees, label: 'Confirmées', icon: 'check_circle', class: 'stat-confirmee' },
      { key: 'enCours', value: this.statistiques.enCours, label: 'En cours', icon: 'play_circle', class: 'stat-encours' },
      { key: 'terminees', value: this.statistiques.terminees, label: 'Terminées', icon: 'flag', class: 'stat-terminee' },
      { key: 'annulees', value: this.statistiques.annulees, label: 'Annulées', icon: 'cancel', class: 'stat-annulee' }
    ];
  }

  getStatClass(key: string): string {
    return `stat-${key}`;
  }

  getCardClass(statut: string): string {
    return `card-${statut.toLowerCase().replace('_', '-')}`;
  }

  getStatutIcon(statut: string): string {
    const icones = {
      'EN_ATTENTE': 'schedule',
      'CONFIRMEE': 'check_circle',
      'EN_COURS': 'play_circle',
      'TERMINEE': 'flag',
      'ANNULEE': 'cancel'
    };
    return icones[statut as keyof typeof icones] || 'help';
  }

  getStatutClass(statut: string): string {
    const classes = {
      'EN_ATTENTE': 'bg-amber-100 border border-amber-300 text-amber-700',
      'CONFIRMEE': 'bg-green-100 border border-green-300 text-green-700',
      'EN_COURS': 'bg-blue-100 border border-blue-300 text-blue-700',
      'TERMINEE': 'bg-gray-100 border border-gray-300 text-gray-700',
      'ANNULEE': 'bg-red-100 border border-red-300 text-red-700'
    };
    return classes[statut as keyof typeof classes] || 'bg-gray-100 border border-gray-300 text-gray-700';
  }

  getStatutLabel(statut: string): string {
    return this.formaterStatut(statut);
  }

  getAdresseFormatee(reservation: ReservationLocataire): string {
    if (!reservation.annonce?.adresse) return 'Adresse non disponible';
    
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

  getMaxDisplayed(): number {
    return Math.min(this.page * this.reservationsParPage, this.totalReservations);
  }

  // ===== CALCULS ET FORMATAGE =====

  calculerStatistiques(): void {
    this.statistiques = {
      total: this.reservations.length,
      enAttente: this.reservations.filter(r => r.statut === 'EN_ATTENTE').length,
      confirmees: this.reservations.filter(r => r.statut === 'CONFIRMEE').length,
      enCours: this.reservations.filter(r => r.statut === 'EN_COURS').length,
      terminees: this.reservations.filter(r => r.statut === 'TERMINEE').length,
      annulees: this.reservations.filter(r => r.statut === 'ANNULEE').length
    };
    this.buildStatistiquesArray();
  }

  formaterDate(date: string): string {
    if (!date) return 'Date indisponible';
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return 'Date invalide';
    return parsed.toLocaleDateString('fr-FR');
  }

  formaterPrix(prix: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(prix || 0);
  }

  formaterStatut(statut: string): string {
    const statuts = {
      'EN_ATTENTE': 'En attente',
      'CONFIRMEE': 'Confirmée',
      'EN_COURS': 'En cours',
      'TERMINEE': 'Terminée',
      'ANNULEE': 'Annulée'
    };
    return statuts[statut as keyof typeof statuts] || statut;
  }

  // ===== GESTION DES MESSAGES =====

  effacerMessage(): void {
    this.message = null;
    this.error = '';
    this.success = '';
  }

  private mapperReservation(r: Reservation): ReservationLocataire {
    const anyR: any = r as any;
    const titreAnnonce: string = this.sanitizeTitle(anyR.titreAnnonce || '');
    const adresseAnnonce: string | undefined = anyR.adresseAnnonce;
    const nomLocateurComplet: string = anyR.nomLocateur || '';
    const { nom: nomLocateur, prenom: prenomLocateur } = this.parseNomComplet(nomLocateurComplet);

    return {
      id: r.id,
      dateArrivee: r.dateArrivee,
      dateDepart: r.dateDepart,
      statut: r.statut as ReservationLocataire['statut'],
      prixTotal: anyR.prixTotal ?? r.montantTotal ?? 0,
      nombreNuits: anyR.nombreNuits ?? undefined,
      nombreVoyageurs: anyR.nombreVoyageurs ?? r.nombreVoyageurs ?? undefined,
      modePaiement: anyR.modePaiement ?? undefined,
      numeroTransaction: anyR.numeroTransaction ?? null,
      datePaiement: anyR.datePaiement ?? null,
      fraisService: anyR.fraisService ?? undefined,
      fraisNettoyage: anyR.fraisNettoyage ?? undefined,
      fraisDepot: anyR.fraisDepot ?? undefined,
      annonce: {
        id: r.annonceId,
        titre: titreAnnonce,
        adresse: this.parseAdresseString(adresseAnnonce),
        prixParNuit: 0,
        images: []
      },
      locateur: {
        id: r.locateurId || '',
        nom: nomLocateur,
        prenom: prenomLocateur
      },
      dateCreation: r.dateCreation || ''
    };
  }

  private normalizeReservationsResponse(response: any): Reservation[] {
    if (Array.isArray(response)) return response as Reservation[];
    if (response && Array.isArray(response.content)) return response.content as Reservation[];
    if (response && Array.isArray(response.data)) return response.data as Reservation[];
    return [];
  }

  private parseAdresseString(adresse: string | undefined | null): { numero?: string; rue?: string; codePostal?: string; ville: string; pays: string } {
    const base = { ville: '', pays: '' } as { numero?: string; rue?: string; codePostal?: string; ville: string; pays: string };
    if (!adresse) return base;
    const parts = adresse.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length === 1) {
      base.rue = parts[0];
      return base;
    }
    if (parts.length >= 2) {
      base.pays = parts[parts.length - 1] || '';
      const villeEtCp = parts[parts.length - 2] || '';
      const match = villeEtCp.match(/^(\d{4,6})\s+(.*)$/);
      if (match) {
        base.codePostal = match[1];
        base.ville = match[2];
      } else {
        base.ville = villeEtCp;
      }
      base.rue = parts.slice(0, parts.length - 2).join(', ');
      return base;
    }
    return base;
  }

  private parseNomComplet(nomComplet: string): { nom: string; prenom: string } {
    if (!nomComplet) return { nom: '', prenom: '' };
    const tokens = nomComplet.trim().split(/\s+/);
    if (tokens.length === 1) return { nom: tokens[0], prenom: '' };
    const prenom = tokens[tokens.length - 1];
    const nom = tokens.slice(0, -1).join(' ');
    return { nom, prenom };
  }

  private sanitizeTitle(title: string): string {
    if (!title) return '';
    // Supprimer tout UUID (ex: 5c513425-8c37-4571-80dd-2b220cfdb0c3)
    const withoutUuid = title.replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '').trim();
    // Supprimer paires de crochets/parenthèses résiduelles autour de vide
    return withoutUuid.replace(/[()\[\]]/g, '').replace(/\s{2,}/g, ' ').trim();
  }

  formaterModePaiement(mode?: string): string {
    if (!mode) return '—';
    return mode.toString().replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (t) => t.toUpperCase());
  }

  // Suppression: plus d'enrichissement d'annonces, on s'appuie sur les champs titreAnnonce/adresseAnnonce de l'API

  // ===== TRACKBY POUR NGFOR =====
  trackByReservationId(index: number, item: ReservationLocataire): string {
    return item.id;
  }
} 