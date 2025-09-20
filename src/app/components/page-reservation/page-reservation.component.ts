import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservationService } from '../../services/reservation.service';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ModePaiement } from '../../models/reservation.model';
import { Annonce } from '../../models/annonce.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-page-reservation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './page-reservation.component.html',
  styleUrls: ['./page-reservation.component.css']
})
export class PageReservationComponent implements OnInit {
  annonceId: string = '';
  annonce: Annonce | null = null;
  
  // Jours réservés par statut
  joursReservesEnAttente: string[] = [];
  joursReservesConfirmes: string[] = [];
  joursReservesEnCours: string[] = [];
  
  reservationsParJour: { [date: string]: any[] } = {};
  moisActuel: Date = new Date();
  calendrier: Date[][] = [];
  isLoading = false;
  errorMessage = '';
  
  // Dates sélectionnées
  dateArrivee: string = '';
  dateDepart: string = '';
  
  // État de soumission
  isSubmitting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservationService: ReservationService,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.annonceId = this.route.snapshot.paramMap.get('id') || '';
    if (this.annonceId) {
      this.chargerAnnonce();
      this.chargerJoursReserves();
      this.genererCalendrier();
    }
  }

  async chargerAnnonce(): Promise<void> {
    try {
      this.annonce = await firstValueFrom(this.apiService.getAnnonceById(this.annonceId));
      console.log('📋 Annonce chargée:', this.annonce);
    } catch (error) {
      console.error('❌ Erreur lors du chargement de l\'annonce:', error);
      this.errorMessage = 'Erreur lors du chargement de l\'annonce';
    }
  }

  async chargerJoursReserves(): Promise<void> {
    if (!this.annonceId) return;

    try {
      this.isLoading = true;
      this.errorMessage = '';

      // Charger les jours réservés par statut
      const [joursEnAttente, joursConfirmes, joursEnCours] = await Promise.all([
        firstValueFrom(this.reservationService.getJoursReservesParStatut(this.annonceId, 'EN_ATTENTE')),
        firstValueFrom(this.reservationService.getJoursReservesParStatut(this.annonceId, 'CONFIRMEE')),
        firstValueFrom(this.reservationService.getJoursReservesParStatut(this.annonceId, 'EN_COURS'))
      ]);

      this.joursReservesEnAttente = joursEnAttente || [];
      this.joursReservesConfirmes = joursConfirmes || [];
      this.joursReservesEnCours = joursEnCours || [];

      // Créer un résumé des réservations basé sur les jours réservés
      this.creerResumeReservations();

      console.log('📅 Jours réservés chargés:', {
        enAttente: this.joursReservesEnAttente,
        confirmes: this.joursReservesConfirmes,
        enCours: this.joursReservesEnCours
      });

    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des jours réservés:', error);
      this.errorMessage = 'Erreur lors du chargement de la disponibilité';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Crée un résumé des réservations basé sur les jours réservés
   */
  private creerResumeReservations(): void {
    this.reservationsParJour = {};
    
    // Ajouter les jours en attente
    this.joursReservesEnAttente.forEach(date => {
      if (!this.reservationsParJour[date]) {
        this.reservationsParJour[date] = [];
      }
      this.reservationsParJour[date].push({
        statut: 'EN_ATTENTE',
        locataire: { nom: 'Locataire', prenom: 'Test', email: 'test@example.com', telephone: '0123456789' }
      });
    });

    // Ajouter les jours confirmés
    this.joursReservesConfirmes.forEach(date => {
      if (!this.reservationsParJour[date]) {
        this.reservationsParJour[date] = [];
      }
      this.reservationsParJour[date].push({
        statut: 'CONFIRMEE',
        locataire: { nom: 'Locataire', prenom: 'Test', email: 'test@example.com', telephone: '0123456789' }
      });
    });

    // Ajouter les jours en cours
    this.joursReservesEnCours.forEach(date => {
      if (!this.reservationsParJour[date]) {
        this.reservationsParJour[date] = [];
      }
      this.reservationsParJour[date].push({
        statut: 'EN_COURS',
        locataire: { nom: 'Locataire', prenom: 'Test', email: 'test@example.com', telephone: '0123456789' }
      });
    });
  }

  /**
   * Génère le calendrier du mois
   */
  genererCalendrier(): void {
    const annee = this.moisActuel.getFullYear();
    const mois = this.moisActuel.getMonth();
    
    const premierJour = new Date(annee, mois, 1);
    const dernierJour = new Date(annee, mois + 1, 0);
    
    const premierJourSemaine = premierJour.getDay();
    const nombreJours = dernierJour.getDate();
    
    this.calendrier = [];
    let semaine: Date[] = [];
    
    // Ajouter les jours vides du début
    for (let i = 0; i < premierJourSemaine; i++) {
      semaine.push(new Date(annee, mois, 0 - (premierJourSemaine - i - 1)));
    }
    
    // Ajouter les jours du mois
    for (let jour = 1; jour <= nombreJours; jour++) {
      semaine.push(new Date(annee, mois, jour));
      
      if (semaine.length === 7) {
        this.calendrier.push(semaine);
        semaine = [];
      }
    }
    
    // Ajouter les jours vides de la fin uniquement si la semaine est partielle
    if (semaine.length > 0) {
      let jourMoisSuivant = 1;
      while (semaine.length < 7) {
        semaine.push(new Date(annee, mois + 1, jourMoisSuivant++));
      }
      this.calendrier.push(semaine);
    }
  }

  /**
   * Indique si la date appartient au mois affiché
   */
  isDansMois(date: Date): boolean {
    return (
      date.getFullYear() === this.moisActuel.getFullYear() &&
      date.getMonth() === this.moisActuel.getMonth()
    );
  }

  /**
   * Vérifie si un jour est réservé
   */
  estJourReserve(date: Date): boolean {
    const dateStr = this.formaterDate(date);
    return this.joursReservesEnAttente.includes(dateStr) ||
           this.joursReservesConfirmes.includes(dateStr) ||
           this.joursReservesEnCours.includes(dateStr);
  }

  /**
   * Retourne le statut d'un jour réservé
   */
  getStatutJour(date: Date): string | null {
    const dateStr = this.formaterDate(date);
    
    if (this.joursReservesEnAttente.includes(dateStr)) return 'EN_ATTENTE';
    if (this.joursReservesConfirmes.includes(dateStr)) return 'CONFIRMEE';
    if (this.joursReservesEnCours.includes(dateStr)) return 'EN_COURS';
    
    return null;
  }

  /**
   * Gère le clic sur un jour (sélection de dates pour réservation)
   */
  onJourClick(date: Date): void {
    const dateStr = this.formaterDate(date);
    
    // Si c'est un jour réservé, ne rien faire
    if (this.estJourReserve(date)) {
      return;
    }
    
    // Si le jour n'est pas disponible, ne rien faire
    if (!this.estJourDisponible(date)) {
      return;
    }

    // Si aucune date d'arrivée n'est sélectionnée, la définir
    if (!this.dateArrivee) {
      this.dateArrivee = dateStr;
      console.log('📅 Date d\'arrivée sélectionnée:', dateStr);
      return;
    }

    // Si une date d'arrivée est déjà sélectionnée
    if (this.dateArrivee && !this.dateDepart) {
      // Vérifier que la date de départ est après la date d'arrivée
      if (new Date(dateStr) > new Date(this.dateArrivee)) {
        this.dateDepart = dateStr;
        console.log('📅 Date de départ sélectionnée:', dateStr);
        console.log('📅 Période sélectionnée:', this.dateArrivee, 'au', dateStr);
      } else {
        // Si la date sélectionnée est avant ou égale à l'arrivée, la remplacer
        this.dateArrivee = dateStr;
        this.dateDepart = '';
        console.log('📅 Nouvelle date d\'arrivée sélectionnée:', dateStr);
      }
      return;
    }

    // Si les deux dates sont sélectionnées, recommencer avec la nouvelle date
    this.dateArrivee = dateStr;
    this.dateDepart = '';
    console.log('📅 Nouvelle sélection - Date d\'arrivée:', dateStr);
  }

  /**
   * Vérifie si un jour est dans la période sélectionnée
   */
  estDansPeriodeSelectionnee(date: Date): boolean {
    if (!this.dateArrivee || !this.dateDepart) return false;
    
    const dateStr = this.formaterDate(date);
    const dateObj = new Date(dateStr);
    const arrivee = new Date(this.dateArrivee);
    const depart = new Date(this.dateDepart);
    
    return dateObj > arrivee && dateObj < depart;
  }

  /**
   * Vérifie si un jour est sélectionné (arrivée ou départ)
   */
  estJourSelectionne(date: Date): boolean {
    const dateStr = this.formaterDate(date);
    return dateStr === this.dateArrivee || dateStr === this.dateDepart;
  }

  /**
   * Vérifie si un jour est disponible
   */
  estJourDisponible(date: Date): boolean {
    return this.isDansMois(date) && !this.estJourReserve(date) && !this.estJourPasse(date);
  }

  /**
   * Vérifie si un jour est dans le passé
   */
  estJourPasse(date: Date): boolean {
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    return date < aujourdhui;
  }

  /**
   * Formate une date en string YYYY-MM-DD
   */
  formaterDate(date: Date): string {
    const annee = date.getFullYear();
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    const jour = String(date.getDate()).padStart(2, '0');
    return `${annee}-${mois}-${jour}`;
  }

  /**
   * Formate le mois pour l'affichage
   */
  formaterMois(): string {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long' 
    };
    return this.moisActuel.toLocaleDateString('fr-FR', options);
  }

  /**
   * Passe au mois précédent
   */
  moisPrecedent(): void {
    this.moisActuel.setMonth(this.moisActuel.getMonth() - 1);
    this.genererCalendrier();
  }

  /**
   * Passe au mois suivant
   */
  moisSuivant(): void {
    this.moisActuel.setMonth(this.moisActuel.getMonth() + 1);
    this.genererCalendrier();
  }

  /**
   * Retourne les classes CSS pour un jour
   */
  getClassesJour(date: Date): string {
    let classes = 'jour';
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    
    if (!this.isDansMois(date)) {
      classes += ' hors-mois';
      return classes;
    }

    if (this.estJourPasse(date)) {
      classes += ' jour-passe';
    } else if (this.estJourReserve(date)) {
      const statut = this.getStatutJour(date);
      if (statut === 'EN_ATTENTE') classes += ' jour-en-attente';
      else if (statut === 'CONFIRMEE') classes += ' jour-confirme';
      else if (statut === 'EN_COURS') classes += ' jour-en-cours';
    } else if (this.estJourSelectionne(date)) {
      classes += ' jour-selectionne';
    } else if (this.estDansPeriodeSelectionnee(date)) {
      classes += ' jour-periode';
    } else {
      classes += ' jour-disponible';
    }

    if (this.isDansMois(date) && date.getTime() === aujourdhui.getTime()) {
      classes += ' aujourd-hui';
    }
    
    return classes;
  }

  /**
   * Retourne le tooltip pour un jour
   */
  getTooltipJour(date: Date): string {
    if (!this.isDansMois(date)) {
      return '';
    }
    if (this.estJourPasse(date)) {
      return 'Jour passé';
    }
    
    if (this.estJourReserve(date)) {
      const statut = this.getStatutJour(date);
      return `Réservé - ${statut}`;
    }
    
    if (this.estJourSelectionne(date)) {
      const dateStr = this.formaterDate(date);
      if (dateStr === this.dateArrivee) return 'Date d\'arrivée sélectionnée';
      if (dateStr === this.dateDepart) return 'Date de départ sélectionnée';
    }
    
    if (this.estDansPeriodeSelectionnee(date)) {
      return 'Dans la période sélectionnée';
    }
    
    return 'Disponible';
  }

  /**
   * Retourne le nombre de réservations pour une date
   */
  getNombreReservationsPourDate(date: Date): number {
    const dateStr = this.formaterDate(date);
    return this.reservationsParJour[dateStr]?.length || 0;
  }

  /**
   * Efface la date d'arrivée
   */
  effacerDateArrivee(): void {
    this.dateArrivee = '';
    this.dateDepart = '';
    console.log('📅 Date d\'arrivée effacée');
  }

  /**
   * Efface la date de départ
   */
  effacerDateDepart(): void {
    this.dateDepart = '';
    console.log('📅 Date de départ effacée');
  }

  /**
   * Calcule la durée du séjour
   */
  calculerDureeSejour(): number {
    if (!this.dateArrivee || !this.dateDepart) return 0;
    
    const d1 = new Date(this.dateArrivee);
    const d2 = new Date(this.dateDepart);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Calcule le prix total de la réservation
   */
  calculerPrixTotal(): number {
    if (!this.annonce || !this.dateArrivee || !this.dateDepart) return 0;
    
    const duree = this.calculerDureeSejour();
    return duree * this.annonce.prixParNuit;
  }

  /**
   * Soumet la réservation
   */
  async soumettreReservation(): Promise<void> {
    console.log('🔍 Début de soumettreReservation');
    console.log('📅 Date arrivée:', this.dateArrivee);
    console.log('📅 Date départ:', this.dateDepart);
    console.log('🏠 Annonce ID:', this.annonceId);

    if (!this.dateArrivee || !this.dateDepart) {
      console.log('❌ Dates manquantes, arrêt de la soumission');
      this.errorMessage = 'Veuillez sélectionner vos dates de séjour';
      return;
    }

    if (!this.annonceId) {
      console.log('❌ ID annonce manquant');
      this.errorMessage = 'Erreur: ID de l\'annonce manquant';
      return;
    }

    try {
      this.isSubmitting = true;
      this.errorMessage = '';

      // Récupérer l'ID du locataire connecté
      const locataireId = this.authService.getLocataireId();
      console.log('👤 Locataire ID récupéré:', locataireId);
      
      if (!locataireId) {
        this.errorMessage = 'Session locataire introuvable. Veuillez vous connecter.';
        console.error('❌ Aucun ID de locataire trouvé');
        return;
      }

      // Créer le payload de réservation selon le format attendu par l'API
      const reservationData = {
        annonceId: this.annonceId,
        dateArrivee: this.dateArrivee,
        dateDepart: this.dateDepart,
        nombreVoyageurs: 1, // Valeur par défaut
        modePaiement: 'PAIEMENT_SUR_PLACE' as ModePaiement, // Valeur par défaut
        messageProprietaire: '' // Message optionnel
      };

      console.log('📝 Payload de réservation:', reservationData);
      console.log('🚀 Appel de l\'API de création...');

      // Appeler le service de réservation
      const response = await firstValueFrom(
        this.reservationService.creerReservation(reservationData, locataireId)
      );

      console.log('✅ Réservation créée avec succès:', response);
      
      // Afficher un message de succès
      this.errorMessage = '';
      alert('Réservation créée avec succès !');
      
      // Rediriger vers le dashboard
      this.router.navigate(['/dashboard-locataire']);

    } catch (error: any) {
      console.error('❌ Erreur lors de la création de la réservation:', error);
      this.errorMessage = `Erreur lors de la création de la réservation: ${error.message || 'Erreur inconnue'}`;
    } finally {
      this.isSubmitting = false;
    }
  }

  /**
   * Retour à la page précédente
   */
  retour(): void {
    this.router.navigate(['/dashboard-locataire']);
  }

  /**
   * Retourne l'adresse complète formatée
   */
  getAdresseComplete(): string {
    if (!this.annonce?.adresse) return 'Adresse non disponible';
    
    const adresse = this.annonce.adresse;
    let adresseComplete = '';
    
    if (adresse.numero) adresseComplete += adresse.numero + ' ';
    if (adresse.rue) adresseComplete += adresse.rue + ', ';
    if (adresse.codePostal) adresseComplete += adresse.codePostal + ' ';
    if (adresse.ville) adresseComplete += adresse.ville;
    if (adresse.pays) adresseComplete += ', ' + adresse.pays;
    
    return adresseComplete || 'Adresse non disponible';
  }
}
