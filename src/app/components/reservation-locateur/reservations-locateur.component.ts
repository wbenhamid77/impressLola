import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

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
    private auth: AuthService,
    private annonceService: AnnonceService,
    private entityDetailsService: EntityDetailsService,
    private fb: FormBuilder
  ) {
    this.statutForm = this.fb.group({
      nouveauStatut: ['', Validators.required],
      message: ['']
    });
  }

  ngOnInit(): void {
    this.chargerReservations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== CHARGEMENT DES DONNÉES =====
  chargerReservations(): void {
    this.loading = true;
    this.error = '';
    
    const userId = this.auth.getLocateurId();
    if (!userId) {
      this.error = 'Utilisateur non connecté';
      this.loading = false;
      return;
    }

    // Utiliser la nouvelle API
    this.entityDetailsService.getReservationsLocateur(userId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (reservations: ReservationDetails[]) => {
          this.toutes = reservations;
          this.categoriserReservations();
          this.calculerStatistiques();
          this.extraireInfosAnnoncesEtLocataires();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des réservations:', error);
          this.error = 'Erreur lors du chargement des réservations';
        }
      });
  }

  // ===== CATÉGORISATION DES RÉSERVATIONS =====
  categoriserReservations(): void {
    this.enAttente = this.toutes.filter(r => r.statut === 'EN_ATTENTE');
    this.confirmees = this.toutes.filter(r => r.statut === 'CONFIRMEE');
    this.enCours = this.toutes.filter(r => r.statut === 'EN_COURS');
    this.terminees = this.toutes.filter(r => r.statut === 'TERMINEE');
    this.annulees = this.toutes.filter(r => r.statut === 'ANNULEE');
  }

  // ===== CALCUL DES STATISTIQUES =====
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
      .reduce((sum, r) => sum + r.montantTotal, 0);

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



  // ===== EXTRACTION DES INFORMATIONS =====
  extraireInfosAnnoncesEtLocataires(): void {
    this.toutes.forEach(reservation => {
      // Informations de l'annonce
      const annonceInfo: AnnonceInfoSimple = {
        id: reservation.annonce.id,
        titre: reservation.annonce.titre,
        adresse: this.entityDetailsService.getShortAddressFromReservation(reservation),
        prix: reservation.annonce.prixParNuit,
        type: reservation.annonce.typeMaison,
        imageUrl: reservation.annonce.images.length > 0 ? reservation.annonce.images[0] : undefined
      };
      this.annoncesInfo.set(reservation.annonce.id, annonceInfo);

      // Informations du locataire
      const locataireInfo: LocataireInfoSimple = {
        id: reservation.locataire.id,
        nom: reservation.locataire.nom,
        prenom: reservation.locataire.prenom,
        email: reservation.locataire.email,
        telephone: reservation.locataire.telephone,
        avatarUrl: reservation.locataire.photoProfil || undefined
      };
      this.locatairesInfo.set(reservation.locataire.id, locataireInfo);
    });
  }

  // ===== MÉTHODES UTILITAIRES =====
  getReservationsFiltrees(): ReservationDetails[] {
    let reservations = this.toutes;

    // Filtre par statut
    if (this.filtreStatut !== 'TOUS') {
      reservations = reservations.filter(r => r.statut === this.filtreStatut);
    }

    // Filtre par période
    if (this.filtrePeriode !== 'TOUTES') {
      const maintenant = new Date();
      reservations = reservations.filter(r => {
        const dateArrivee = new Date(r.dateArrivee);
        const dateDepart = new Date(r.dateDepart);
        
        switch (this.filtrePeriode) {
          case 'AVENIR':
            return dateArrivee > maintenant;
          case 'PASSE':
            return dateDepart < maintenant;
          case 'EN_COURS':
            return dateArrivee <= maintenant && dateDepart >= maintenant;
          default:
            return true;
        }
      });
  }

    // Filtre par recherche
    if (this.recherche.trim()) {
      const rechercheLower = this.recherche.toLowerCase();
      reservations = reservations.filter(r => 
        r.annonce.titre.toLowerCase().includes(rechercheLower) ||
        r.locataire.nom.toLowerCase().includes(rechercheLower) ||
        r.locataire.prenom.toLowerCase().includes(rechercheLower) ||
        r.annonce.adresse.ville.toLowerCase().includes(rechercheLower)
      );
    }

    return reservations;
  }

  getReservationsPaginees(): ReservationDetails[] {
    const reservations = this.getReservationsFiltrees();
    const start = (this.page - 1) * this.itemsPerPage;
    return reservations.slice(start, start + this.itemsPerPage);
  }

  getTotalPages(): number {
    const reservations = this.getReservationsFiltrees();
    return Math.ceil(reservations.length / this.itemsPerPage);
  }

  // ===== GESTION DES POPUPS =====
  ouvrirPopupAnnonce(reservation: ReservationDetails): void {
    // Créer un objet AnnonceInfo à partir de ReservationDetails
    const annonceInfo: AnnonceInfo = {
      id: reservation.annonce.id,
      titre: reservation.annonce.titre,
      description: reservation.annonce.description,
      adresse: this.entityDetailsService.getFormattedAddressFromReservation(reservation),
      type: reservation.annonce.typeMaison,
      prix: reservation.prixParNuit,
      superficie: reservation.annonce.adresse.surface || 0,
      nombreChambres: reservation.annonce.nombreChambres,
      nombreSallesDeBain: reservation.annonce.nombreSallesDeBain,
      imageUrl: reservation.annonce.images?.[0] || undefined,
      equipements: reservation.annonce.equipements || [],
      proprietaire: {
        id: reservation.annonce.locateur.id,
        nom: reservation.annonce.locateur.nom || '',
        prenom: reservation.annonce.locateur.prenom || '',
        email: reservation.annonce.locateur.email || '',
        telephone: reservation.annonce.locateur.telephone || '',
        avatarUrl: reservation.annonce.locateur.photoProfil || undefined
      }
    };
    
    this.annonceSelectionnee = annonceInfo;
          this.showAnnoncePopup = true;
  }

  ouvrirPopupLocataire(reservation: ReservationDetails): void {
    // Créer un objet LocataireInfoComplet à partir de ReservationDetails
    const locataireInfo: LocataireInfoComplet = {
      id: reservation.locataire.id,
      nom: reservation.locataire.nom,
      prenom: reservation.locataire.prenom,
      email: reservation.locataire.email,
      telephone: reservation.locataire.telephone,
      avatarUrl: reservation.locataire.photoProfil || undefined,
      adresse: 'Adresse non disponible',
      bio: 'Aucune description disponible',
      nombreReservations: 0,
      noteMoyenne: 0,
      dateInscription: reservation.locataire.dateInscription
    };
    
    this.locataireSelectionne = locataireInfo;
    this.showLocatairePopup = true;
  }

  fermerPopupAnnonce(): void {
    this.showAnnoncePopup = false;
    this.annonceSelectionnee = null;
  }

  fermerPopupLocataire(): void {
    this.showLocatairePopup = false;
    this.locataireSelectionne = null;
  }

  // ===== MÉTHODES UTILITAIRES POUR LE TEMPLATE =====
  getShortAddress(reservation: ReservationDetails): string {
    return this.entityDetailsService.getShortAddressFromReservation(reservation);
  }

  getFormattedAddress(reservation: ReservationDetails): string {
    return this.entityDetailsService.getFormattedAddressFromReservation(reservation);
  }

  getFullName(reservation: ReservationDetails, type: 'locataire' | 'locateur'): string {
    return this.entityDetailsService.getFullNameFromReservation(reservation, type);
  }

  // ===== GESTION DU STATUT =====
  ouvrirFormulaireStatut(reservation: ReservationDetails): void {
    this.reservationSelectionnee = reservation;
    this.statutForm.patchValue({
      nouveauStatut: reservation.statut,
      message: reservation.messageProprietaire || ''
    });
    this.showStatutForm = true;
  }

  fermerFormulaireStatut(): void {
    this.showStatutForm = false;
    this.reservationSelectionnee = null;
    this.statutForm.reset();
  }

  modifierStatut(): void {
    if (this.statutForm.valid && this.reservationSelectionnee) {
      const { nouveauStatut, message } = this.statutForm.value;
      
      // Ici, vous devriez appeler votre service pour mettre à jour le statut
      // Pour l'instant, on met à jour localement
      this.reservationSelectionnee.statut = nouveauStatut;
      this.reservationSelectionnee.messageProprietaire = message;
      
      // Recatégoriser et recalculer
      this.categoriserReservations();
      this.calculerStatistiques();
      
      this.success = 'Statut modifié avec succès';
      this.fermerFormulaireStatut();
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => this.success = '', 3000);
    }
  }

  // ===== PAGINATION =====
  pagePrecedente(): void {
    if (this.page > 1) {
      this.page--;
    }
  }

  pageSuivante(): void {
    if (this.page < this.getTotalPages()) {
      this.page++;
    }
  }

  allerAPage(page: number): void {
      this.page = page;
  }

  // ===== FORMATAGE DES DONNÉES =====
  formaterDate(date: string | Date): string {
    if (!date) return 'N/A';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formaterPrix(prix: number): string {
    return `${prix.toFixed(2)} €`;
  }

  getStatutBadgeClass(reservation: ReservationDetails): string {
    return this.entityDetailsService.getStatusBadgeClassForReservation(reservation);
  }

  getLibelleStatut(reservation: ReservationDetails): string {
    return reservation.libelleStatut || reservation.statut;
  }

  // ===== ACTIONS =====
  rafraichir(): void {
    this.chargerReservations();
  }

  exporterDonnees(): void {
    // Logique d'export à implémenter
    console.log('Export des données...');
  }

  // ===== MÉTHODES MANQUANTES POUR CORRIGER LES ERREURS =====
  confirmerReservation(reservation: ReservationDetails): void {
    if (!confirm('Êtes-vous sûr de vouloir confirmer cette réservation ?')) {
      return;
    }
    
    // Ici, vous devriez appeler votre service pour confirmer la réservation
    reservation.statut = 'CONFIRMEE';
    this.categoriserReservations();
    this.calculerStatistiques();
    
    this.success = 'Réservation confirmée avec succès';
    setTimeout(() => this.success = '', 3000);
  }

  annulerReservation(reservation: ReservationDetails): void {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      return;
    }
    
    // Ici, vous devriez appeler votre service pour annuler la réservation
    reservation.statut = 'ANNULEE';
    this.categoriserReservations();
    this.calculerStatistiques();
    
    this.success = 'Réservation annulée avec succès';
    setTimeout(() => this.success = '', 3000);
  }

  changerStatutReservation(reservation: ReservationDetails): void {
    this.ouvrirFormulaireStatut(reservation);
  }

  appliquerChangementStatut(): void {
    this.modifierStatut();
  }

  formaterStatut(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE': return 'En attente';
      case 'CONFIRMEE': return 'Confirmée';
      case 'EN_COURS': return 'En cours';
      case 'TERMINEE': return 'Terminée';
      case 'ANNULEE': return 'Annulée';
      default: return statut;
    }
  }

  getAnnonceInfo(annonceId: string): AnnonceInfoSimple | undefined {
    return this.annoncesInfo.get(annonceId);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const currentPage = this.page;
    const pages: number[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1); // Séparateur
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push(-1); // Séparateur
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1); // Séparateur
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1); // Séparateur
        pages.push(totalPages);
      }
    }
    
    return pages;
  }
} 