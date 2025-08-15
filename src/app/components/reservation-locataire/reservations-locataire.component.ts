import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, of, Subject, takeUntil } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { EntityDetailsService, ReservationDetails } from '../../services/entity-details.service';
import { AuthService } from '../../services/auth.service';

// Interface pour les informations d'annonce enrichie
interface AnnonceInfoEnrichie {
  id: string;
  titre: string;
  description: string;
  adresse: {
    id: string;
    rue: string;
    numero: string;
    codePostal: string;
    ville: string;
    pays: string;
    complement?: string;
    surface?: number;
    locateurId: string;
    nomLocateur: string;
    dateCreation: string;
    dateModification: string;
    estActive: boolean;
  };
  prixParNuit: number;
  prixParSemaine: number;
  prixParMois: number;
  capacite: number;
  nombreChambres: number;
  nombreSallesDeBain: number;
  typeMaison: string;
  estActive: boolean;
  dateCreation: string;
  dateModification: string;
  equipements: string[];
  regles: string[];
  images: string[];
  imagesBlob: any[];
  noteMoyenne: number;
  nombreAvis: number;
  locateur: {
    id: string;
    nom: string;
    prenom: string;
    email: string | null;
    telephone: string | null;
    photoProfil: string | null;
    description: string | null;
    noteMoyenne: number;
    nombreAnnonces: number;
    estVerifie: boolean;
    raisonSociale: string | null;
  };
  latitude: number | null;
  longitude: number | null;
  distancesStades: any;
  stadeLePlusProche: any;
}

// Interface pour les informations de locateur simplifiée
interface LocateurInfoSimple {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  avatarUrl?: string;
}

// Interface pour les informations complètes du locateur
interface LocateurInfoComplet {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  avatarUrl?: string;
  dateInscription: string;
  nombreAnnonces: number;
  noteMoyenne: number;
  adresse: string;
  bio?: string;
}

// Interface pour les statistiques de réservation
interface StatistiquesReservation {
  total: number;
  enAttente: number;
  confirmees: number;
  enCours: number;
  terminees: number;
  annulees: number;
  revenus: number;
}

@Component({
  selector: 'app-reservations-locataire',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './reservations-locataire.component.html',
  styleUrls: ['./reservations-locataire.component.css']
})
export class ReservationsLocataireComponent implements OnInit, OnDestroy {
  // Math pour le template
  Math = Math;
  
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
  futures: ReservationDetails[] = [];
  passees: ReservationDetails[] = [];
  
  // Statistiques
  statistiques: StatistiquesReservation | null = null;
  
  // Informations des annonces et locateurs
  annoncesInfo: Map<string, AnnonceInfoEnrichie> = new Map();
  locateursInfo: Map<string, LocateurInfoSimple> = new Map();
  
  // Popups
  showAnnoncePopup = false;
  showLocateurPopup = false;
  annonceSelectionnee: AnnonceInfoEnrichie | null = null;
  locateurSelectionne: LocateurInfoComplet | null = null;
  
  // Filtres et recherche
  filtreStatut = 'TOUS';
  recherche = '';
  filtrePeriode = 'TOUTES';
  
  // Formulaire de modification de statut
  showStatutForm = false;
  reservationSelectionnee: ReservationDetails | null = null;
  statutForm: FormGroup;
  
  // Récapitulatif de réservation
  recapitulatif: {
    prixTotal: number;
    nombreNuits: number;
    fraisService: number;
    fraisNettoyage: number;
    fraisDepot: number;
  } | null = null;
  
  // Pagination
  page = 1;
  pageSize = 10;
  
  // Formulaire de création
  showCreationForm = false;
  creationForm: FormGroup;
  
  // Gestion de la destruction
  private destroy$ = new Subject<void>();

  constructor(
    private entityDetailsService: EntityDetailsService,
    private formBuilder: FormBuilder,
    private auth: AuthService
  ) {
    this.statutForm = this.formBuilder.group({
      nouveauStatut: ['', Validators.required],
      message: ['']
    });
    
    this.creationForm = this.formBuilder.group({
      dateArrivee: ['', Validators.required],
      dateDepart: ['', Validators.required],
      nombreVoyageurs: [1, [Validators.required, Validators.min(1)]],
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

    const locataireId = this.auth.getLocataireId();
    if (!locataireId) {
      this.error = 'Utilisateur non connecté';
      this.loading = false;
      return;
    }

    // Utilisation de l'API documentée : GET /api/reservations/locataire/{locataireId}
    // this.http.get<ReservationDetails[]>(`${environment.apiUrl}/reservations/locataire/${locataireId}`)
    //   .pipe(
    //     catchError(error => {
    //       console.error('Erreur lors du chargement des réservations:', error);
    //       this.error = 'Erreur lors du chargement des réservations';
    //       return of([]);
    //     }),
    //     finalize(() => this.loading = false)
    //   )
    //   .subscribe({
    //     next: (reservations: ReservationDetails[]) => {
    //       this.toutes = reservations;
    //       this.categoriserReservations();
    //       this.calculerStatistiques();
    //       this.extraireInfosAnnoncesEtLocateurs();
    //     },
    //     error: (error) => {
    //       console.error('Erreur lors du chargement des réservations:', error);
    //       this.error = 'Erreur lors du chargement des réservations';
    //     }
    //   });

    // Simulation de l'API documentée pour le développement
    // Simuler des données de réservations selon la structure de l'API
    setTimeout(() => {
      const reservationsSimulees: ReservationDetails[] = [
        {
          id: "res-001",
          annonce: {
            id: "annonce-001",
            titre: "Appartement de charme au cœur de Paris",
            description: "Magnifique appartement rénové avec vue sur la Seine",
            adresse: {
              id: "adresse-001",
              rue: "Rue de Rivoli",
              numero: "15",
              codePostal: "75001",
              ville: "Paris",
              pays: "France",
              complement: "2ème étage",
              surface: 65,
              locateurId: "locateur-001",
              nomLocateur: "Jean Dupont",
              dateCreation: "2024-01-01T00:00:00",
              dateModification: "2024-01-01T00:00:00",
              estActive: true
            },
            prixParNuit: 150.00,
            prixParSemaine: 900.00,
            prixParMois: 3500.00,
            capacite: 4,
            nombreChambres: 2,
            nombreSallesDeBain: 1,
            typeMaison: "APPARTEMENT",
            estActive: true,
            dateCreation: "2024-01-01T00:00:00",
            dateModification: "2024-01-01T00:00:00",
            equipements: ["WiFi", "Cuisine équipée", "Climatisation"],
            regles: ["Non-fumeur", "Pas d'animaux"],
            images: ["image1.jpg", "image2.jpg"],
            imagesBlob: [],
            noteMoyenne: 4.8,
            nombreAvis: 25,
            locateur: {
              id: "locateur-001",
              nom: "Dupont",
              prenom: "Jean",
              email: "jean.dupont@email.com",
              telephone: "+33123456789",
              photoProfil: "photo1.jpg",
              description: "Propriétaire expérimenté",
              noteMoyenne: 4.9,
              nombreAnnonces: 3,
              estVerifie: true,
              raisonSociale: null
            },
            latitude: 48.8566,
            longitude: 2.3522,
            distancesStades: null,
            stadeLePlusProche: null
          },
          locataire: {
            id: locataireId,
            role: "LOCATAIRE",
            nom: "Martin",
            prenom: "Sophie",
            email: "sophie.martin@email.com",
            telephone: "+33987654321",
            statutKyc: "VÉRIFIÉ",
            dateInscription: "2024-01-01T00:00:00",
            derniereConnexion: "2024-01-15T10:00:00",
            estActif: true,
            photoProfil: "photo2.jpg",
            dateModification: "2024-01-15T10:00:00"
          },
          dateArrivee: "2024-07-15",
          dateDepart: "2024-07-22",
          nombreNuits: 7,
          nombreVoyageurs: 2,
          prixParNuit: 150.00,
          prixTotal: 1050.00,
          fraisService: 52.50,
          fraisNettoyage: 80.00,
          fraisDepot: 200.00,
          montantTotal: 1382.50,
          statut: "CONFIRMEE",
          libelleStatut: "Confirmée",
          messageProprietaire: "Bonjour, nous aimerions réserver votre logement pour nos vacances d'été.",
          dateCreation: "2024-01-15T10:30:00",
          dateModification: "2024-01-16T14:20:00",
          dateConfirmation: "2024-01-16T14:20:00",
          dateAnnulation: null,
          raisonAnnulation: null
        },
        {
          id: "res-002",
          annonce: {
            id: "annonce-002",
            titre: "Maison avec vue sur la mer",
            description: "Superbe maison moderne avec terrasse panoramique",
            adresse: {
              id: "adresse-002",
              rue: "Promenade des Anglais",
              numero: "25",
              codePostal: "06000",
              ville: "Nice",
              pays: "France",
              complement: "Résidence Le Palais",
              surface: 120,
              locateurId: "locateur-002",
              nomLocateur: "Marie Laurent",
              dateCreation: "2024-01-01T00:00:00",
              dateModification: "2024-01-01T00:00:00",
              estActive: true
            },
            prixParNuit: 200.00,
            prixParSemaine: 1200.00,
            prixParMois: 4500.00,
            capacite: 6,
            nombreChambres: 3,
            nombreSallesDeBain: 2,
            typeMaison: "MAISON",
            estActive: true,
            dateCreation: "2024-01-01T00:00:00",
            dateModification: "2024-01-01T00:00:00",
            equipements: ["Piscine", "Jardin", "Parking privé"],
            regles: ["Animaux acceptés", "Fêtes autorisées"],
            images: ["image3.jpg", "image4.jpg"],
            imagesBlob: [],
            noteMoyenne: 4.9,
            nombreAvis: 18,
            locateur: {
              id: "locateur-002",
              nom: "Laurent",
              prenom: "Marie",
              email: "marie.laurent@email.com",
              telephone: "+33456789012",
              photoProfil: "photo3.jpg",
              description: "Passionnée de décoration",
              noteMoyenne: 4.8,
              nombreAnnonces: 2,
              estVerifie: true,
              raisonSociale: null
            },
            latitude: 43.7102,
            longitude: 7.2620,
            distancesStades: null,
            stadeLePlusProche: null
          },
          locataire: {
            id: locataireId,
            role: "LOCATAIRE",
            nom: "Martin",
            prenom: "Sophie",
            email: "sophie.martin@email.com",
            telephone: "+33987654321",
            statutKyc: "VÉRIFIÉ",
            dateInscription: "2024-01-01T00:00:00",
            derniereConnexion: "2024-01-15T10:00:00",
            estActif: true,
            photoProfil: "photo2.jpg",
            dateModification: "2024-01-15T10:00:00"
          },
          dateArrivee: "2024-08-01",
          dateDepart: "2024-08-08",
          nombreNuits: 7,
          nombreVoyageurs: 4,
          prixParNuit: 200.00,
          prixTotal: 1400.00,
          fraisService: 70.00,
          fraisNettoyage: 100.00,
          fraisDepot: 300.00,
          montantTotal: 1870.00,
          statut: "EN_ATTENTE",
          libelleStatut: "En attente de confirmation",
          messageProprietaire: "Bonjour, nous cherchons un logement pour nos vacances en famille.",
          dateCreation: "2024-01-20T15:45:00",
          dateModification: "2024-01-20T15:45:00",
          dateConfirmation: null,
          dateAnnulation: null,
          raisonAnnulation: null
        }
      ];

      this.toutes = reservationsSimulees;
      this.categoriserReservations();
      this.calculerStatistiques();
      this.extraireInfosAnnoncesEtLocateurs();
      this.loading = false;
    }, 1000);
  }

  // ===== CATÉGORISATION DES RÉSERVATIONS =====
  categoriserReservations(): void {
    this.enAttente = this.toutes.filter(r => r.statut === 'EN_ATTENTE');
    this.confirmees = this.toutes.filter(r => r.statut === 'CONFIRMEE');
    this.enCours = this.toutes.filter(r => r.statut === 'EN_COURS');
    this.terminees = this.toutes.filter(r => r.statut === 'TERMINEE');
    this.annulees = this.toutes.filter(r => r.statut === 'ANNULEE');
    
    // Réservations futures (dates à venir)
    const aujourdhui = new Date();
    this.futures = this.toutes.filter(r => {
      const dateArrivee = new Date(r.dateArrivee);
      return dateArrivee > aujourdhui;
    });
    
    // Réservations passées (dates terminées)
    this.passees = this.toutes.filter(r => {
      const dateDepart = new Date(r.dateDepart);
      return dateDepart < aujourdhui;
    });
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
  extraireInfosAnnoncesEtLocateurs(): void {
    this.toutes.forEach(reservation => {
      // Informations de l'annonce
      const annonceInfo: AnnonceInfoEnrichie = {
        id: reservation.annonce.id,
        titre: reservation.annonce.titre,
        description: reservation.annonce.description,
        adresse: {
          id: reservation.annonce.adresse.id,
          rue: reservation.annonce.adresse.rue,
          numero: reservation.annonce.adresse.numero,
          codePostal: reservation.annonce.adresse.codePostal,
          ville: reservation.annonce.adresse.ville,
          pays: reservation.annonce.adresse.pays,
          complement: reservation.annonce.adresse.complement,
          surface: reservation.annonce.adresse.surface,
          locateurId: reservation.annonce.adresse.locateurId,
          nomLocateur: reservation.annonce.adresse.nomLocateur,
          dateCreation: reservation.annonce.adresse.dateCreation,
          dateModification: reservation.annonce.adresse.dateModification,
          estActive: reservation.annonce.adresse.estActive
        },
        prixParNuit: reservation.annonce.prixParNuit,
        prixParSemaine: reservation.annonce.prixParSemaine,
        prixParMois: reservation.annonce.prixParMois,
        capacite: reservation.annonce.capacite,
        nombreChambres: reservation.annonce.nombreChambres,
        nombreSallesDeBain: reservation.annonce.nombreSallesDeBain,
        typeMaison: reservation.annonce.typeMaison,
        estActive: reservation.annonce.estActive,
        dateCreation: reservation.annonce.dateCreation,
        dateModification: reservation.annonce.dateModification,
        equipements: reservation.annonce.equipements,
        regles: reservation.annonce.regles,
        images: reservation.annonce.images,
        imagesBlob: reservation.annonce.imagesBlob,
        noteMoyenne: reservation.annonce.noteMoyenne,
        nombreAvis: reservation.annonce.nombreAvis,
        locateur: {
          id: reservation.annonce.locateur.id,
          nom: reservation.annonce.locateur.nom,
          prenom: reservation.annonce.locateur.prenom,
                     email: reservation.annonce.locateur.email,
           telephone: reservation.annonce.locateur.telephone,
           photoProfil: reservation.annonce.locateur.photoProfil,
           description: reservation.annonce.locateur.description,
           noteMoyenne: reservation.annonce.locateur.noteMoyenne,
           nombreAnnonces: reservation.annonce.locateur.nombreAnnonces,
           estVerifie: reservation.annonce.locateur.estVerifie,
           raisonSociale: reservation.annonce.locateur.raisonSociale
        },
        latitude: reservation.annonce.latitude,
        longitude: reservation.annonce.longitude,
        distancesStades: reservation.annonce.distancesStades,
        stadeLePlusProche: reservation.annonce.stadeLePlusProche
      };
      this.annoncesInfo.set(reservation.annonce.id, annonceInfo);

      // Informations du locateur
      const locateurInfo: LocateurInfoSimple = {
        id: reservation.annonce.locateur.id,
        nom: reservation.annonce.locateur.nom,
        prenom: reservation.annonce.locateur.prenom,
        email: reservation.annonce.locateur.email || '',
        telephone: reservation.annonce.locateur.telephone || '',
        avatarUrl: reservation.annonce.locateur.photoProfil || undefined
      };
      this.locateursInfo.set(reservation.annonce.locateur.id, locateurInfo);
    });
  }

  // ===== MÉTHODES UTILITAIRES =====
  
  // Obtenir la date minimale (aujourd'hui) pour les champs de date
  getDateMin(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // ===== MÉTHODES DE FILTRAGE ET PAGINATION =====
  
  // Obtenir les réservations filtrées selon les critères
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
        r.annonce.locateur.nom.toLowerCase().includes(rechercheLower) ||
        r.annonce.locateur.prenom.toLowerCase().includes(rechercheLower) ||
        r.annonce.adresse.ville.toLowerCase().includes(rechercheLower)
      );
    }

    return reservations;
  }

  // Obtenir les réservations paginées
  getReservationsPaginees(): ReservationDetails[] {
    const reservations = this.getReservationsFiltrees();
    const start = (this.page - 1) * this.pageSize;
    return reservations.slice(start, start + this.pageSize);
  }

  // Obtenir le nombre total de pages
  getNombrePages(): number {
    const reservations = this.getReservationsFiltrees();
    return Math.ceil(reservations.length / this.pageSize);
  }

  // ===== MÉTHODES DE FORMATAGE =====
  
  // Formater le statut pour l'affichage
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

  // Obtenir la classe CSS pour le statut
  getClasseStatut(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE': return 'en-attente';
      case 'CONFIRMEE': return 'confirmee';
      case 'EN_COURS': return 'en-cours';
      case 'TERMINEE': return 'terminee';
      case 'ANNULEE': return 'annulee';
      default: return 'en-attente';
    }
  }

  // Obtenir l'icône pour le statut
  getIconeStatut(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE': return 'fa-clock';
      case 'CONFIRMEE': return 'fa-check-circle';
      case 'EN_COURS': return 'fa-play-circle';
      case 'TERMINEE': return 'fa-flag-checkered';
      case 'ANNULEE': return 'fa-times-circle';
      default: return 'fa-question-circle';
    }
  }

  // Formater la date pour l'affichage
  formaterDate(date: string): string {
    if (!date) return 'Date non définie';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Formater le prix pour l'affichage
  formaterPrix(prix: number): string {
    if (!prix) return '0,00 €';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(prix);
  }

  // Calculer la durée du séjour
  calculerDureeSejour(dateArrivee: string, dateDepart: string): number {
    if (!dateArrivee || !dateDepart) return 0;
    const arrivee = new Date(dateArrivee);
    const depart = new Date(dateDepart);
    const difference = depart.getTime() - arrivee.getTime();
    return Math.ceil(difference / (1000 * 3600 * 24));
  }

  // Obtenir le nombre de réservations par statut
  getNombreReservationsParStatut(statut: string): number {
    switch (statut) {
      case 'EN_ATTENTE': return this.enAttente.length;
      case 'CONFIRMEE': return this.confirmees.length;
      case 'EN_COURS': return this.enCours.length;
      case 'TERMINEE': return this.terminees.length;
      case 'ANNULEE': return this.annulees.length;
      case 'FUTURES': return this.futures.length;
      case 'PASSEES': return this.passees.length;
      default: return this.toutes.length;
    }
  }

  // Obtenir les numéros de page à afficher
  getPages(): number[] {
    const totalPages = this.getNombrePages();
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
      } else if (currentPage >= totalPages - 3) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  }

  // ===== MÉTHODES DE GESTION DES POPUPS =====
  
  // Ouvrir le popup de l'annonce
  ouvrirPopupAnnonce(reservation: ReservationDetails): void {
    const annonceInfo = this.annoncesInfo.get(reservation.annonce.id);
    if (annonceInfo) {
      this.annonceSelectionnee = annonceInfo;
      this.showAnnoncePopup = true;
    } else {
      this.error = 'Informations de l\'annonce non disponibles';
    }
  }

  // Ouvrir le popup du locateur
  ouvrirPopupLocateur(reservation: ReservationDetails): void {
    if (reservation.annonce.locateur) {
      this.locateurSelectionne = {
        id: reservation.annonce.locateur.id,
        nom: reservation.annonce.locateur.nom,
        prenom: reservation.annonce.locateur.prenom,
        email: reservation.annonce.locateur.email || '',
        telephone: reservation.annonce.locateur.telephone || '',
        avatarUrl: reservation.annonce.locateur.photoProfil || undefined,
        dateInscription: '2024-01-01', // À récupérer depuis l'API
        nombreAnnonces: reservation.annonce.locateur.nombreAnnonces,
        noteMoyenne: reservation.annonce.locateur.noteMoyenne,
        adresse: `${reservation.annonce.adresse.ville}, ${reservation.annonce.adresse.pays}`,
        bio: reservation.annonce.locateur.description || 'Aucune description disponible'
      };
      this.showLocateurPopup = true;
    } else {
      this.error = 'Informations du locateur non disponibles';
    }
  }

  // Fermer le popup de l'annonce
  fermerPopupAnnonce(): void {
    this.showAnnoncePopup = false;
    this.annonceSelectionnee = null;
  }

  // Fermer le popup du locateur
  fermerPopupLocateur(): void {
    this.showLocateurPopup = false;
    this.locateurSelectionne = null;
  }

  // ===== MÉTHODES DE GESTION DES FORMULAIRES =====
  
  // Fermer le formulaire de statut
  fermerFormulaireStatut(): void {
    this.showStatutForm = false;
    this.reservationSelectionnee = null;
    this.statutForm.reset();
    this.recapitulatif = null;
  }

  // Ouvrir le formulaire de statut
  ouvrirFormulaireStatut(reservation: ReservationDetails): void {
    this.reservationSelectionnee = reservation;
    this.showStatutForm = true;
    
    // Calculer le récapitulatif
    this.recapitulatif = {
      prixTotal: reservation.prixTotal || 0,
      nombreNuits: reservation.nombreNuits || 0,
      fraisService: reservation.fraisService || 0,
      fraisNettoyage: reservation.fraisNettoyage || 0,
      fraisDepot: reservation.fraisDepot || 0
    };
  }

  // Confirmer une réservation
  confirmerReservation(): void {
    if (!this.recapitulatif) {
      this.error = 'Impossible de confirmer la réservation : récapitulatif manquant';
      return;
    }

    this.loading = true;
    this.error = '';

    // Simulation pour l'instant
    setTimeout(() => {
      this.loading = false;
      this.success = 'Réservation confirmée avec succès !';
      this.fermerFormulaireStatut();
      setTimeout(() => this.success = '', 5000);
    }, 2000);
  }

  // ===== MÉTHODES DE GESTION DES RÉSERVATIONS =====
  
  // Annuler une réservation
  annulerReservation(reservation: ReservationDetails): void {
    if (!reservation) {
      this.error = 'Aucune réservation sélectionnée pour l\'annulation';
      return;
    }

    if (reservation.statut !== 'EN_ATTENTE' && reservation.statut !== 'CONFIRMEE') {
      this.error = 'Cette réservation ne peut plus être annulée';
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir annuler votre réservation pour "${reservation.annonce.titre}" ?`)) {
      this.loading = true;
      this.error = '';

      // Simulation de l'API d'annulation : PUT /api/reservations/{id}/annuler
      setTimeout(() => {
        reservation.statut = 'ANNULEE';
        reservation.libelleStatut = 'Annulée';
        reservation.dateAnnulation = new Date().toISOString();
        reservation.raisonAnnulation = 'Annulation par le locataire';
        
        this.categoriserReservations();
        this.calculerStatistiques();
        
        this.success = 'Réservation annulée avec succès';
        this.loading = false;
        setTimeout(() => this.success = '', 5000);
      }, 1000);
    }
  }

  // Traiter le paiement d'une réservation
  traiterPaiement(reservation: ReservationDetails): void {
    if (!reservation) {
      this.error = 'Aucune réservation sélectionnée pour le paiement';
      return;
    }

    if (reservation.statut !== 'CONFIRMEE') {
      this.error = 'Seules les réservations confirmées peuvent être payées';
      return;
    }

    this.loading = true;
    this.error = '';

    // Simulation de l'API de paiement
    setTimeout(() => {
      this.success = `Paiement de ${this.formaterPrix(reservation.montantTotal)} traité avec succès pour "${reservation.annonce.titre}"`;
      this.loading = false;
      setTimeout(() => this.success = '', 5000);
    }, 2000);
  }

  // Voir les détails d'une réservation
  detailsReservation(reservation: ReservationDetails): void {
    if (!reservation) {
      this.error = 'Aucune réservation sélectionnée';
      return;
    }

    // Ici vous pouvez implémenter l'ouverture d'un modal ou la navigation vers une page de détails
    console.log('Détails de la réservation:', reservation);
    
    // Exemple d'affichage des détails
    const details = `
      Réservation : ${reservation.annonce.titre}
      Statut : ${reservation.libelleStatut}
      Dates : ${this.formaterDate(reservation.dateArrivee)} → ${this.formaterDate(reservation.dateDepart)}
      Durée : ${reservation.nombreNuits} nuits
      Voyageurs : ${reservation.nombreVoyageurs}
      Montant total : ${this.formaterPrix(reservation.montantTotal)}
      Message : ${reservation.messageProprietaire || 'Aucun message'}
    `;
    
    alert(details);
  }

  // ===== MÉTHODES DE GESTION DES FAVORIS =====
  
  // Ajouter une annonce aux favoris
  ajouterAuxFavorisAPI(annonceId: string): void {
    const locataireId = this.auth.getLocataireId();
    if (!locataireId) {
      this.error = 'Utilisateur non connecté';
      return;
    }

    // API documentée : POST /api/locataires/{locataireId}/favoris/{annonceId}
    // Simulation pour le développement
    this.success = 'Annonce ajoutée aux favoris avec succès !';
    setTimeout(() => this.success = '', 5000);
  }

  // Retirer une annonce des favoris
  retirerDesFavorisAPI(annonceId: string): void {
    const locataireId = this.auth.getLocataireId();
    if (!locataireId) {
      this.error = 'Utilisateur non connecté';
      return;
    }

    // API documentée : DELETE /api/locataires/{locataireId}/favoris/{annonceId}
    // Simulation pour le développement
    this.success = 'Annonce retirée des favoris avec succès !';
    setTimeout(() => this.success = '', 5000);
  }

  // Consulter ses annonces favorites
  consulterFavoris(): void {
    const locataireId = this.auth.getLocataireId();
    if (!locataireId) {
      this.error = 'Utilisateur non connecté';
      return;
    }

    // API documentée : GET /api/locataires/{locataireId}/favoris
    this.success = 'Consultation des favoris...';
    setTimeout(() => this.success = '', 3000);
  }

  // Vérifier si une annonce est dans les favoris
  verifierFavori(annonceId: string): Observable<boolean> {
    const locataireId = this.auth.getLocataireId();
    if (!locataireId) {
      this.error = 'Utilisateur non connecté';
      return of(false);
    }

    // API documentée : GET /api/locataires/{locataireId}/favoris/{annonceId}/check
    // Simulation pour le développement
    return of(false);
  }

  // ===== MÉTHODES DE VÉRIFICATION DE DISPONIBILITÉ =====
  
  // Vérifier la disponibilité d'une annonce
  verifierDisponibilite(annonceId: string, dateArrivee: string, dateDepart: string): Observable<boolean> {
    // API documentée : GET /api/reservations/disponibilite?annonceId=...&dateArrivee=...&dateDepart=...
    // Simulation pour le développement
    return of(true);
  }

  // ===== MÉTHODES DE GESTION DES FORMULAIRES =====
  
  // Ouvrir le formulaire de création
  ouvrirFormulaireCreation(): void {
    this.showCreationForm = true;
    this.creationForm.reset({
      nombreVoyageurs: 1
    });
  }

  // Fermer le formulaire de création
  fermerFormulaireCreation(): void {
    this.showCreationForm = false;
    this.creationForm.reset();
  }

  // Créer une nouvelle réservation
  creerReservation(annonceId: string, donneesReservation: any): void {
    this.loading = true;
    this.error = '';

    const reservationData = {
      annonceId: annonceId,
      dateArrivee: donneesReservation.dateArrivee,
      dateDepart: donneesReservation.dateDepart,
      nombreVoyageurs: donneesReservation.nombreVoyageurs,
      messageProprietaire: donneesReservation.message || ''
    };

    // API documentée : POST /api/reservations?locataireId=...
    // Simulation pour le développement
    setTimeout(() => {
      this.loading = false;
      this.success = 'Réservation créée avec succès !';
      this.chargerReservations();
      this.fermerFormulaireCreation();
      setTimeout(() => this.success = '', 5000);
    }, 2000);
  }

  // ===== MÉTHODES DE GESTION DES FORMULAIRES DE CRÉATION =====
  
  // Calculer le récapitulatif avec vérification
  calculerRecapitulatifAvecVerification(): void {
    if (this.creationForm.valid) {
      const formData = this.creationForm.value;
      const dateArrivee = new Date(formData.dateArrivee);
      const dateDepart = new Date(formData.dateDepart);
      
      if (dateArrivee >= dateDepart) {
        this.error = 'La date de départ doit être postérieure à la date d\'arrivée';
        return;
      }
      
      const nombreNuits = this.calculerDureeSejour(formData.dateArrivee, formData.dateDepart);
      
      // Ici vous pouvez ajouter la logique de calcul des prix
      // Pour l'instant, on simule
      this.success = `Récapitulatif calculé : ${nombreNuits} nuits pour ${formData.nombreVoyageurs} voyageurs`;
      setTimeout(() => this.success = '', 3000);
    } else {
      this.error = 'Veuillez remplir tous les champs obligatoires';
    }
  }

  // Soumettre la réservation
  soumettreReservation(): void {
    if (this.creationForm.valid) {
      const formData = this.creationForm.value;
      
      // Ici vous devriez appeler la méthode creerReservation avec l'ID de l'annonce
      // Pour l'instant, on simule avec un ID fictif
      this.creerReservation('annonce-simulee', formData);
    } else {
      this.error = 'Veuillez remplir tous les champs obligatoires';
    }
  }

  // ===== MÉTHODES DE PAGINATION =====
  
  // Aller à la page précédente
  pagePrecedente(): void {
    if (this.page > 1) {
      this.page--;
    }
  }

  // Aller à la page suivante
  pageSuivante(): void {
    if (this.page < this.getNombrePages()) {
      this.page++;
    }
  }

  // Aller à une page spécifique
  allerAPage(page: number): void {
    if (page >= 1 && page <= this.getNombrePages()) {
      this.page = page;
    }
  }

  // ===== MÉTHODES DE FILTRAGE AVANCÉ =====
  
  // Filtrer par statut avec mise à jour automatique
  filtrerParStatut(statut: string): void {
    this.filtreStatut = statut;
    this.page = 1; // Retour à la première page
    this.categoriserReservations();
    this.calculerStatistiques();
  }

  // Filtrer par période
  filtrerParPeriode(periode: string): void {
    this.filtrePeriode = periode;
    this.page = 1;
  }

  // Recherche avancée
  rechercher(): void {
    this.page = 1;
    // La logique de recherche est déjà implémentée dans getReservationsFiltrees()
  }

  // Réinitialiser tous les filtres
  reinitialiserFiltres(): void {
    this.filtreStatut = 'TOUS';
    this.filtrePeriode = 'TOUTES';
    this.recherche = '';
    this.page = 1;
  }

  // ===== MÉTHODES DE COMPTAGE ET STATISTIQUES =====
  
  // Obtenir le nombre total de réservations
  getNombreTotalReservations(): number {
    return this.toutes.length;
  }

  // Obtenir le montant total des réservations confirmées
  getMontantTotalReservationsConfirmees(): number {
    return this.confirmees.reduce((sum, r) => sum + r.montantTotal, 0);
  }

  // Obtenir le montant total des réservations en cours
  getMontantTotalReservationsEnCours(): number {
    return this.enCours.reduce((sum, r) => sum + r.montantTotal, 0);
  }

  // Obtenir le montant total des réservations terminées
  getMontantTotalReservationsTerminees(): number {
    return this.terminees.reduce((sum, r) => sum + r.montantTotal, 0);
  }

  // ===== MÉTHODES DE VÉRIFICATION =====
  
  // Vérifier si une réservation est en cours actuellement
  estReservationEnCours(reservation: ReservationDetails): boolean {
    const maintenant = new Date();
    const dateArrivee = new Date(reservation.dateArrivee);
    const dateDepart = new Date(reservation.dateDepart);
    return dateArrivee <= maintenant && dateDepart >= maintenant;
  }

  // Vérifier si une réservation est future
  estReservationFuture(reservation: ReservationDetails): boolean {
    const maintenant = new Date();
    const dateArrivee = new Date(reservation.dateArrivee);
    return dateArrivee > maintenant;
  }

  // Vérifier si une réservation est passée
  estReservationPassee(reservation: ReservationDetails): boolean {
    const maintenant = new Date();
    const dateDepart = new Date(reservation.dateDepart);
    return dateDepart < maintenant;
  }

  // ===== MÉTHODES UTILITAIRES POUR LE TEMPLATE =====
  
  // Obtenir l'adresse courte d'une réservation
  getShortAddress(reservation: ReservationDetails): string {
    if (reservation.annonce.adresse) {
      return `${reservation.annonce.adresse.ville}, ${reservation.annonce.adresse.pays}`;
    }
    return 'Adresse non disponible';
  }

  // Obtenir l'adresse formatée d'une réservation
  getFormattedAddress(reservation: ReservationDetails): string {
    if (reservation.annonce.adresse) {
      const adresse = reservation.annonce.adresse;
      let formatted = '';
      if (adresse.numero && adresse.rue) {
        formatted += `${adresse.numero} ${adresse.rue}`;
      }
      if (adresse.codePostal && adresse.ville) {
        formatted += formatted ? ', ' : '';
        formatted += `${adresse.codePostal} ${adresse.ville}`;
      }
      if (adresse.pays) {
        formatted += formatted ? ', ' : '';
        formatted += adresse.pays;
      }
      return formatted || 'Adresse non disponible';
    }
    return 'Adresse non disponible';
  }

  // Obtenir le nom complet d'une personne
  getFullName(reservation: ReservationDetails, type: 'locataire' | 'locateur'): string {
    if (type === 'locataire' && reservation.locataire) {
      return `${reservation.locataire.prenom} ${reservation.locataire.nom}`;
    } else if (type === 'locateur' && reservation.annonce.locateur) {
      return `${reservation.annonce.locateur.prenom} ${reservation.annonce.locateur.nom}`;
    }
    return 'Nom non disponible';
  }

  // ===== MÉTHODES DE GESTION DES MESSAGES =====
  
  // Effacer l'erreur
  effacerErreur(): void {
    this.error = '';
  }

  // Effacer le succès
  effacerSucces(): void {
    this.success = '';
  }

  // ===== MÉTHODES D'EXPORT ET UTILITAIRES =====
  
  // Rafraîchir les données
  rafraichir(): void {
    this.chargerReservations();
  }

  // Exporter les données
  exporterDonnees(): void {
    // Logique d'export à implémenter
    console.log('Export des données...');
    this.success = 'Export des données en cours...';
    setTimeout(() => this.success = '', 3000);
  }

  // Obtenir la classe du badge de statut
  getStatutBadgeClass(reservation: ReservationDetails): string {
    return this.entityDetailsService.getStatusBadgeClassForReservation(reservation);
  }

  // Obtenir le libellé du statut
  getLibelleStatut(reservation: ReservationDetails): string {
    return reservation.libelleStatut || reservation.statut;
  }
} 