import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../services/reservation.service';
import { firstValueFrom } from 'rxjs';
import { EntityDetailsService, LocataireDetails } from '../../services/entity-details.service';

@Component({
  selector: 'app-calendrier-locateur',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendrier-locateur.component.html',
  styleUrls: ['../calendrier-shared.css']
})
export class CalendrierLocateurComponent implements OnInit {
  @Input() annonceId: string = '';

  // Jours réservés par statut
  joursReservesEnAttente: string[] = [];
  joursReservesConfirmes: string[] = [];
  joursReservesEnCours: string[] = [];
  
  // Légende des statuts avec compteurs
  legendItems = [
    { class: 'jour-disponible', label: 'Disponible', count: 0 },
    { class: 'jour-en-attente', label: 'En attente', count: 0 },
    { class: 'jour-confirme', label: 'Confirmée', count: 0 },
    { class: 'jour-en-cours', label: 'En cours', count: 0 },
    { class: 'jour-passe', label: 'Passé', count: 0 }
  ];
  
  reservationsParJour: { [date: string]: any[] } = {};
  moisActuel: Date = new Date();
  calendrier: Date[][] = [];
  isLoading = false;
  errorMessage = '';
  jourSelectionnePourInfo: Date | null = null;
  resumeModalOpen = false;

  constructor(
    private reservationService: ReservationService,
    private entityDetailsService: EntityDetailsService
  ) {}

  ngOnInit(): void {
    console.log('🏢 Calendrier Locateur initialisé pour l\'annonce:', this.annonceId);
    this.chargerJoursReserves();
    this.genererCalendrier();
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

      // Charger les réservations détaillées par jour (avec infos locataire)
      await this.chargerReservationsParJour();

      console.log('📅 Jours réservés chargés pour le locateur:', {
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
   * Charge les réservations réelles de l'annonce et enrichit par jour avec les infos locataire
   */
  private async chargerReservationsParJour(): Promise<void> {
    if (!this.annonceId) {
      this.reservationsParJour = {};
      return;
    }

    try {
      // Récupère toutes les réservations de l'annonce
      const reservations = await firstValueFrom(this.reservationService.getReservationsAnnonce(this.annonceId));

      // Indexe les détails locataire par ID (appel API par locataire unique)
      const uniqueLocataireIds = Array.from(new Set(reservations.map(r => r.locataireId).filter(Boolean)));
      const idToLocataire: { [id: string]: LocataireDetails } = {};

      await Promise.all(uniqueLocataireIds.map(async (id) => {
        try {
          idToLocataire[id] = await firstValueFrom(this.entityDetailsService.getLocataireDetails(id));
        } catch {
          idToLocataire[id] = {
            id,
            role: 'LOCATAIRE',
            nom: 'Inconnu',
            prenom: '',
            email: 'Non renseigné',
            telephone: 'Non renseigné',
            statutKyc: 'NON_VERIFIE',
            dateInscription: '',
            derniereConnexion: '',
            estActif: false,
            dateModification: ''
          } as LocataireDetails;
        }
      }));

      // Réinitialise la map et répartit les réservations sur chaque jour couvert
      this.reservationsParJour = {};
      for (const res of reservations) {
        const locataire = idToLocataire[res.locataireId];
        const departExclue = new Date(res.dateDepart);
        for (let d = new Date(res.dateArrivee); d < departExclue; d.setDate(d.getDate() + 1)) {
          const dateStr = this.formaterDate(d);
          if (!this.reservationsParJour[dateStr]) this.reservationsParJour[dateStr] = [];
          this.reservationsParJour[dateStr].push({
            statut: res.statut,
            dateCreation: res.dateCreation,
            locataire
          });
        }
      }

      // Met à jour les compteurs de la légende
      this.legendItems = this.legendItems.map(item => {
        if (item.label === 'En attente') return { ...item, count: this.joursReservesEnAttente.length };
        if (item.label === 'Confirmée') return { ...item, count: this.joursReservesConfirmes.length };
        if (item.label === 'En cours') return { ...item, count: this.joursReservesEnCours.length };
        return item;
      });
    } catch (e) {
      console.error('Erreur lors du chargement des réservations détaillées:', e);
      // Fallback: conserver l'ancien résumé simplifié
      this.creerResumeReservations();
    }
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
   * Gère le clic sur un jour (consultation uniquement)
   */
  onJourClick(date: Date): void {
    // Mode consultation uniquement pour le locateur
    if (this.estJourReserve(date)) {
      this.jourSelectionnePourInfo = date;
      console.log('📅 Affichage des informations pour le jour réservé:', this.formaterDate(date));
    }
  }

  /**
   * Ferme le popup d'information
   */
  fermerPopupInfo(): void {
    this.jourSelectionnePourInfo = null;
  }

  /** Ouvre/ferme le popup Résumé */
  openResumeModal(): void { this.resumeModalOpen = true; }
  closeResumeModal(): void { this.resumeModalOpen = false; }

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
    
    return 'Disponible';
  }

  /**
   * Retourne les réservations pour une date
   */
  getReservationsPourDate(date: Date): any[] {
    const dateStr = this.formaterDate(date);
    return this.reservationsParJour[dateStr] || [];
  }

  /**
   * Retourne les réservations pour une date (string)
   */
  getReservationsPourDateFromString(dateStr: string): any[] {
    return this.reservationsParJour[dateStr] || [];
  }

  /**
   * Retourne le nombre de réservations pour une date
   */
  getNombreReservationsPourDate(date: Date): number {
    return this.getReservationsPourDate(date).length;
  }

  /**
   * Retourne toutes les dates réservées
   */
  getDatesReservees(): string[] {
    return Object.keys(this.reservationsParJour);
  }
} 