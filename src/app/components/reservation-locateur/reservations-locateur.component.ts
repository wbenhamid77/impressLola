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
  
  // Note: Formulaire de changement de statut supprimé - seules les actions confirmer/annuler sont disponibles
  
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
    private http: HttpClient
  ) {}

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
  
  // Note: Avec la nouvelle logique automatique, le locateur ne peut que confirmer ou annuler
  // Les autres transitions (EN_COURS, TERMINEE) sont gérées automatiquement par le scheduler

  // ===== ACTIONS SUR LES RÉSERVATIONS =====
  
  confirmerReservation(reservation: ReservationDetails): void {
    // Vérifier si la confirmation est encore possible
    const dateArrivee = new Date(reservation.dateArrivee || '');
    const maintenant = new Date();
    
    if (dateArrivee < maintenant) {
      this.error = 'Impossible de confirmer une réservation après la date d\'arrivée. Le système l\'annulera automatiquement.';
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir confirmer cette réservation ?\n\nElle passera automatiquement en cours à la date d\'arrivée.')) return;

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
          this.success = 'Réservation confirmée avec succès. Elle passera automatiquement en cours à la date d\'arrivée.';
          this.chargerReservations();
        },
        error: (err) => {
          console.error('Erreur lors de la confirmation:', err);
          if (err.status === 400) {
            this.error = 'Impossible de confirmer cette réservation. La date d\'arrivée est peut-être dépassée.';
          } else {
            this.error = 'Erreur lors de la confirmation de la réservation';
          }
        }
      });
  }

  annulerReservation(reservation: ReservationDetails): void {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?\n\nCette action est définitive.')) return;

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

  // Méthode supprimée - plus de formulaire de changement de statut

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
      'EN_ATTENTE': 'bg-amber-100 border border-amber-300 text-amber-700',
      'CONFIRMEE': 'bg-green-100 border border-green-300 text-green-700',
      'EN_COURS': 'bg-blue-100 border border-blue-300 text-blue-700',
      'TERMINEE': 'bg-gray-100 border border-gray-300 text-gray-700',
      'ANNULEE': 'bg-red-100 border border-red-300 text-red-700'
    };
    return classes[statut] || 'bg-gray-100 border border-gray-300 text-gray-700';
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

  // ===== INFORMATIONS SUR LES TRANSITIONS AUTOMATIQUES =====
  
  getInfoTransition(statut: string, dateArrivee?: string, dateDepart?: string): string {
    const maintenant = new Date();
    const arrivee = dateArrivee ? new Date(dateArrivee) : null;
    const depart = dateDepart ? new Date(dateDepart) : null;
    
    switch (statut) {
      case 'EN_ATTENTE':
        if (arrivee && arrivee < maintenant) {
          return '⚠️ Sera annulée automatiquement (date d\'arrivée dépassée)';
        }
        return '💡 Confirmez avant la date d\'arrivée pour valider la réservation';
        
      case 'CONFIRMEE':
        if (arrivee && arrivee <= maintenant) {
          return '🔄 Passera automatiquement en cours aujourd\'hui';
        }
        return '⏰ Passera automatiquement en cours à la date d\'arrivée';
        
      case 'EN_COURS':
        if (depart && depart <= maintenant) {
          return '🏁 Se terminera automatiquement aujourd\'hui';
        }
        return '⏰ Se terminera automatiquement à la date de départ';
        
      case 'TERMINEE':
        return '✅ Séjour terminé avec succès';
        
      case 'ANNULEE':
        return '❌ Réservation annulée';
        
      default:
        return '';
    }
  }

  peutConfirmer(statut: string, dateArrivee?: string): boolean {
    if (statut !== 'EN_ATTENTE') return false;
    
    if (!dateArrivee) return true;
    
    const arrivee = new Date(dateArrivee);
    const maintenant = new Date();
    
    return arrivee > maintenant;
  }

  peutAnnuler(statut: string): boolean {
    return statut === 'EN_ATTENTE' || statut === 'CONFIRMEE';
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