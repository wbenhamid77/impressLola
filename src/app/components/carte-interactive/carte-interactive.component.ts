import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

// Déclarations de types pour Leaflet
declare var L: any;

interface Annonce {
  id: string;
  titre: string;
  description: string;
  prixParNuit: number;
  latitude: number;
  longitude: number;
  images?: string[];
  typeMaison: string;
  nombreChambres: number;
  capacite: number;
  noteMoyenne: number;
  nombreAvis: number;
  adresse?: {
    numero: string;
    rue: string;
    ville: string;
    codePostal: string;
    pays: string;
  };
  equipements: string[];
  estActive: boolean;
}

interface Stade {
  id: string;
  nom: string;
  ville: string;
  latitude: number;
  longitude: number;
  capacite: number;
  description: string;
}

@Component({
  selector: 'app-carte-interactive',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carte-interactive.component.html',
  styleUrls: ['./carte-interactive.component.css']
})
export class CarteInteractiveComponent implements OnInit, AfterViewInit, OnDestroy {
  // Propriétés pour la carte Leaflet
  private map: any = null;
  private markers: any[] = [];
  private stadeMarkers: any[] = [];
  private markerGroup: any = null;
  mapInitialized = false;
  mapError = false;
  mapLoading = false;

  // Données
  annonces: Annonce[] = [];
  stades: Stade[] = [];
  annoncesFiltrees: Annonce[] = [];
  annonceSelectionnee: Annonce | null = null;

  // Filtres
  stadeSelectionne: string = '';
  rayonFiltre: number = 10; // en km
  prixMin: number = 0;
  prixMax: number = 10000;
  typeMaison: string = '';

  // États
  isLoading = true;
  errorMessage = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.chargerDonnees();
  }

  ngAfterViewInit(): void {
    this.initialiserCarte();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  async chargerDonnees(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      // Charger les annonces et les stades en parallèle
      const [annoncesResponse, stadesResponse] = await Promise.all([
        this.apiService.getAnnonces().toPromise(),
        this.apiService.getStades().toPromise()
      ]);

      if (annoncesResponse && annoncesResponse.length > 0) {
        this.annonces = annoncesResponse;
        this.annoncesFiltrees = [...this.annonces];
        console.log(`${this.annonces.length} annonces chargées`);
      } else {
        // Données de test si l'API ne fonctionne pas
        this.annonces = this.getDonneesTestAnnonces();
        this.annoncesFiltrees = [...this.annonces];
        console.log('Utilisation des données de test pour les annonces');
      }

      if (stadesResponse && stadesResponse.length > 0) {
        this.stades = stadesResponse;
        console.log(`${this.stades.length} stades chargés`);
      } else {
        // Données de test pour les stades
        this.stades = this.getDonneesTestStades();
        console.log('Utilisation des données de test pour les stades');
      }

      this.isLoading = false;
      
      // Attendre un peu avant d'ajouter les marqueurs
      setTimeout(() => {
        this.ajouterMarqueursCarte();
      }, 1000);
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      // Utiliser les données de test en cas d'erreur
      this.annonces = this.getDonneesTestAnnonces();
      this.annoncesFiltrees = [...this.annonces];
      this.stades = this.getDonneesTestStades();
      this.isLoading = false;
      console.log('Utilisation des données de test suite à une erreur');
    }
  }

  getDonneesTestAnnonces(): Annonce[] {
    return [
      {
        id: '1',
        titre: 'Villa moderne près du stade',
        description: 'Belle villa moderne avec piscine',
        prixParNuit: 500,
        latitude: 33.5731,
        longitude: -7.5898, // Casablanca
        images: ['villa1.jpg'],
        typeMaison: 'VILLA',
        nombreChambres: 4,
        capacite: 8,
        noteMoyenne: 4.5,
        nombreAvis: 12,
        adresse: { numero: '123', rue: 'Avenue Hassan II', ville: 'Casablanca', codePostal: '20000', pays: 'Maroc' },
        equipements: ['Piscine', 'WiFi', 'Parking'],
        estActive: true
      },
      {
        id: '2',
        titre: 'Appartement centre-ville',
        description: 'Appartement moderne en centre-ville',
        prixParNuit: 300,
        latitude: 31.6295,
        longitude: -7.9811, // Marrakech
        images: ['appart1.jpg'],
        typeMaison: 'APPARTEMENT',
        nombreChambres: 2,
        capacite: 4,
        noteMoyenne: 4.2,
        nombreAvis: 8,
        adresse: { numero: '456', rue: 'Boulevard Mohammed V', ville: 'Marrakech', codePostal: '40000', pays: 'Maroc' },
        equipements: ['WiFi', 'Climatisation'],
        estActive: true
      },
      {
        id: '3',
        titre: 'Studio moderne Rabat',
        description: 'Studio moderne en centre-ville de Rabat',
        prixParNuit: 200,
        latitude: 34.0209,
        longitude: -6.8416, // Rabat
        images: ['studio1.jpg'],
        typeMaison: 'STUDIO',
        nombreChambres: 1,
        capacite: 2,
        noteMoyenne: 4.0,
        nombreAvis: 5,
        adresse: { numero: '789', rue: 'Avenue Mohammed V', ville: 'Rabat', codePostal: '10000', pays: 'Maroc' },
        equipements: ['WiFi', 'Climatisation'],
        estActive: true
      },
      {
        id: '4',
        titre: 'Maison traditionnelle Fès',
        description: 'Maison traditionnelle dans la médina de Fès',
        prixParNuit: 400,
        latitude: 34.0331,
        longitude: -5.0003, // Fès
        images: ['maison1.jpg'],
        typeMaison: 'MAISON',
        nombreChambres: 3,
        capacite: 6,
        noteMoyenne: 4.7,
        nombreAvis: 15,
        adresse: { numero: '321', rue: 'Rue de la Médina', ville: 'Fès', codePostal: '30000', pays: 'Maroc' },
        equipements: ['WiFi', 'Parking', 'Jardin'],
        estActive: true
      }
    ];
  }

  getDonneesTestStades(): Stade[] {
    return [
      {
        id: '1',
        nom: 'Stade Mohammed V',
        ville: 'Casablanca',
        latitude: 33.5731,
        longitude: -7.5898,
        capacite: 67000,
        description: 'Stade principal de Casablanca'
      },
      {
        id: '2',
        nom: 'Stade de Marrakech',
        ville: 'Marrakech',
        latitude: 31.6295,
        longitude: -7.9811,
        capacite: 45000,
        description: 'Stade de Marrakech'
      },
      {
        id: '3',
        nom: 'Stade Moulay Abdellah',
        ville: 'Rabat',
        latitude: 34.0209,
        longitude: -6.8416,
        capacite: 52000,
        description: 'Stade de Rabat'
      },
      {
        id: '4',
        nom: 'Stade de Fès',
        ville: 'Fès',
        latitude: 34.0331,
        longitude: -5.0003,
        capacite: 35000,
        description: 'Stade de Fès'
      }
    ];
  }

  async initialiserCarte(): Promise<void> {
    if (this.mapInitialized || this.mapError) return;

    try {
      this.mapLoading = true;

      // Vérifier si l'élément existe
      const mapElement = document.getElementById('carte-interactive');
      if (!mapElement) {
        console.error('Élément carte-interactive non trouvé');
        this.mapError = true;
        this.mapLoading = false;
        return;
      }

      // Vérifier si Leaflet est chargé
      if (typeof L === 'undefined') {
        console.error('Leaflet n\'est pas chargé');
        this.mapError = true;
        this.mapLoading = false;
        return;
      }

      // Configuration de la carte Leaflet centrée sur le Maroc
      this.map = L.map('carte-interactive').setView([31.6295, -7.9811], 5);

      // Ajouter la couche de tuiles OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(this.map);

      // Créer un groupe pour les marqueurs
      this.markerGroup = L.layerGroup().addTo(this.map);

      this.mapInitialized = true;
      this.mapLoading = false;

      console.log('Carte Leaflet initialisée avec succès');

      // Ajouter les marqueurs après l'initialisation
      setTimeout(() => {
        this.ajouterMarqueursCarte();
      }, 500);

    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la carte:', error);
      this.mapError = true;
      this.mapLoading = false;
    }
  }

  ajouterMarqueursCarte(): void {
    if (!this.map || !this.mapInitialized || !this.markerGroup) {
      console.log('Carte non initialisée, impossible d\'ajouter les marqueurs');
      return;
    }

    try {
      // Nettoyer les marqueurs existants
      this.markerGroup.clearLayers();
      this.markers = [];
      this.stadeMarkers = [];

      console.log(`Ajout de ${this.annoncesFiltrees.length} marqueurs d'annonces`);

      // Ajouter les marqueurs des annonces
      this.annoncesFiltrees.forEach((annonce, index) => {
        if (annonce.latitude && annonce.longitude && !isNaN(annonce.latitude) && !isNaN(annonce.longitude)) {
          try {
            const marker = L.marker([annonce.latitude, annonce.longitude], {
              icon: this.creerIconeAnnonce()
            });

            marker.bindPopup(this.creerPopupAnnonce(annonce));
            
            marker.on('click', () => {
              this.selectionnerAnnonce(annonce);
            });
            
            this.markers.push(marker);
            this.markerGroup.addLayer(marker);
            console.log(`Marqueur annonce ${index + 1} ajouté: ${annonce.titre}`);
          } catch (error) {
            console.error(`Erreur lors de l'ajout du marqueur annonce ${index + 1}:`, error);
          }
        } else {
          console.warn(`Annonce ${index + 1} invalide:`, annonce);
        }
      });

      // Ajouter les marqueurs des stades
      this.stades.forEach((stade, index) => {
        if (stade.latitude && stade.longitude && !isNaN(stade.latitude) && !isNaN(stade.longitude)) {
          try {
            const marker = L.marker([stade.latitude, stade.longitude], {
              icon: this.creerIconeStade()
            });

            marker.bindPopup(this.creerPopupStade(stade));
            
            this.stadeMarkers.push(marker);
            this.markerGroup.addLayer(marker);
            console.log(`Marqueur stade ${index + 1} ajouté: ${stade.nom}`);
          } catch (error) {
            console.error(`Erreur lors de l'ajout du marqueur stade ${index + 1}:`, error);
          }
        } else {
          console.warn(`Stade ${index + 1} invalide:`, stade);
        }
      });

      // Ajuster la vue pour afficher tous les marqueurs
      if (this.markers.length > 0) {
        const group = new L.featureGroup(this.markers);
        const bounds = group.getBounds();
        if (bounds.isValid()) {
          this.map.fitBounds(bounds.pad(0.3)); // Plus d'espace autour des marqueurs
          console.log(`Vue ajustée pour ${this.markers.length} marqueurs`);
        } else {
          // Si les bounds ne sont pas valides, centrer sur le Maroc avec un zoom approprié
          this.map.setView([31.6295, -7.9811], 5);
          console.log('Centrage sur le Maroc avec zoom 5');
        }
      } else {
        console.log('Aucun marqueur valide à afficher');
        // Garder la vue centrée sur le Maroc
        this.map.setView([31.6295, -7.9811], 5);
      }

    } catch (error) {
      console.error('Erreur lors de l\'ajout des marqueurs:', error);
    }
  }

  creerIconeAnnonce(): any {
    return L.divIcon({
      html: `
        <div style="
          width: 32px; 
          height: 32px; 
          background: #dc2626; 
          border: 3px solid #ffffff; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          <i class="fas fa-home" style="color: white; font-size: 14px;"></i>
        </div>
      `,
      className: 'custom-marker-annonce',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  }

  creerIconeStade(): any {
    return L.divIcon({
      html: `
        <div style="
          width: 32px; 
          height: 32px; 
          background: #059669; 
          border: 3px solid #ffffff; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          <i class="fas fa-futbol" style="color: white; font-size: 14px;"></i>
        </div>
      `,
      className: 'custom-marker-stade',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  }

  creerPopupAnnonce(annonce: Annonce): string {
    return `
      <div class="popup-annonce" style="min-width: 300px; max-width: 350px;">
        <div class="popup-image" style="margin-bottom: 12px;">
          <img src="${this.getImagePath(annonce.images?.[0])}" alt="${annonce.titre}"
               style="width: 100%; height: 150px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        </div>
        <div class="popup-content">
          <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: bold; color: #1f2937; line-height: 1.3;">${annonce.titre}</h3>
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; display: flex; align-items: center;">
            <i class="fas fa-map-marker-alt" style="color: #dc2626; margin-right: 6px;"></i>
            ${annonce.adresse?.ville || 'Ville non spécifiée'}
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin: 12px 0;">
            <span style="font-weight: bold; color: #059669; font-size: 20px;">${this.formaterPrix(annonce.prixParNuit)}</span>
            <span style="background: #f3f4f6; color: #374151; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">
              ${this.getTypeMaisonLabel(annonce.typeMaison)}
            </span>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 12px;">
            <button onclick="window.open('/detail-annonce/${annonce.id}', '_blank')"
                    style="flex: 1; padding: 10px 16px; background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 14px; transition: all 0.2s;">
              <i class="fas fa-eye" style="margin-right: 6px;"></i>
              Voir détails
            </button>
            <button onclick="navigator.clipboard.writeText(window.location.origin + '/detail-annonce/${annonce.id}')"
                    style="padding: 10px; background: #f3f4f6; color: #374151; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s;"
                    title="Copier le lien">
              <i class="fas fa-share"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  creerPopupStade(stade: Stade): string {
    return `
      <div class="popup-stade" style="min-width: 250px; max-width: 300px;">
        <div style="text-align: center; margin-bottom: 12px;">
          <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #059669, #047857); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 8px;">
            <i class="fas fa-futbol" style="color: white; font-size: 20px;"></i>
          </div>
        </div>
        <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: bold; color: #1f2937; text-align: center;">${stade.nom}</h3>
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; text-align: center; display: flex; align-items: center; justify-content: center;">
          <i class="fas fa-map-marker-alt" style="color: #059669; margin-right: 6px;"></i>
          ${stade.ville}
        </p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px; text-align: center;">
          <p style="margin: 0; color: #166534; font-size: 14px; font-weight: 600;">
            <i class="fas fa-users" style="margin-right: 6px;"></i>
            Capacité: ${stade.capacite.toLocaleString()} places
          </p>
        </div>
      </div>
    `;
  }

  selectionnerAnnonce(annonce: Annonce): void {
    this.annonceSelectionnee = annonce;
  }

  filtrerParStade(): void {
    if (!this.stadeSelectionne) {
      this.annoncesFiltrees = [...this.annonces];
    } else {
      const stade = this.stades.find(s => s.id === this.stadeSelectionne);
      if (stade) {
        this.annoncesFiltrees = this.annonces.filter(annonce => {
          if (!annonce.latitude || !annonce.longitude) return false;
          
          const distance = this.calculerDistance(
            stade.latitude, stade.longitude,
            annonce.latitude, annonce.longitude
          );
          
          return distance <= this.rayonFiltre;
        });
      }
    }
    
    this.appliquerFiltres();
  }

  appliquerFiltres(): void {
    let annoncesFiltrees = [...this.annoncesFiltrees];

    // Filtre par prix
    if (this.prixMin > 0 || this.prixMax < 10000) {
      annoncesFiltrees = annoncesFiltrees.filter(annonce => 
        annonce.prixParNuit >= this.prixMin && annonce.prixParNuit <= this.prixMax
      );
    }

    // Filtre par type de maison
    if (this.typeMaison) {
      annoncesFiltrees = annoncesFiltrees.filter(annonce => 
        annonce.typeMaison === this.typeMaison
      );
    }

    this.annoncesFiltrees = annoncesFiltrees;
    this.ajouterMarqueursCarte();
  }

  calculerDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  reinitialiserFiltres(): void {
    this.stadeSelectionne = '';
    this.rayonFiltre = 10;
    this.prixMin = 0;
    this.prixMax = 10000;
    this.typeMaison = '';
    this.annoncesFiltrees = [...this.annonces];
    this.ajouterMarqueursCarte();
  }

  getImagePath(imageName: string | undefined): string {
    if (!imageName) return '';
    return `http://localhost:8080/api/images/${imageName}`;
  }

  formaterPrix(prix: number): string {
    if (!prix || prix === 0) return 'Prix non disponible';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(prix);
  }

  getTypeMaisonLabel(type: string): string {
    const types: { [key: string]: string } = {
      'APPARTEMENT': 'Appartement',
      'MAISON': 'Maison',
      'VILLA': 'Villa',
      'STUDIO': 'Studio',
      'CHAMBRE': 'Chambre'
    };
    return types[type] || type;
  }

  getTypeMaisonIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'APPARTEMENT': 'fas fa-building',
      'MAISON': 'fas fa-home',
      'VILLA': 'fas fa-crown',
      'STUDIO': 'fas fa-cube',
      'CHAMBRE': 'fas fa-bed'
    };
    return icons[type] || 'fas fa-home';
  }

  getTypeMaisonColor(type: string): string {
    const colors: { [key: string]: string } = {
      'APPARTEMENT': 'bg-blue-100 text-blue-800',
      'MAISON': 'bg-green-100 text-green-800',
      'VILLA': 'bg-purple-100 text-purple-800',
      'STUDIO': 'bg-orange-100 text-orange-800',
      'CHAMBRE': 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }

  getCapaciteIcon(capacite: number): string {
    if (capacite <= 2) return 'fas fa-user';
    if (capacite <= 4) return 'fas fa-users';
    if (capacite <= 6) return 'fas fa-user-friends';
    return 'fas fa-users-cog';
  }

  getCapaciteColor(capacite: number): string {
    if (capacite <= 2) return 'bg-green-100 text-green-800';
    if (capacite <= 4) return 'bg-blue-100 text-blue-800';
    if (capacite <= 6) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  }

  getChambresIcon(nombreChambres: number): string {
    if (nombreChambres === 1) return 'fas fa-bed';
    if (nombreChambres <= 3) return 'fas fa-bed';
    return 'fas fa-home';
  }

  getChambresColor(nombreChambres: number): string {
    if (nombreChambres === 1) return 'bg-gray-100 text-gray-800';
    if (nombreChambres <= 3) return 'bg-indigo-100 text-indigo-800';
    return 'bg-cyan-100 text-cyan-800';
  }

  getPrixIcon(prix: number): string {
    if (prix <= 200) return 'fas fa-coins';
    if (prix <= 400) return 'fas fa-money-bill-wave';
    if (prix <= 600) return 'fas fa-gem';
    return 'fas fa-crown';
  }

  getPrixColor(prix: number): string {
    if (prix <= 200) return 'text-green-600';
    if (prix <= 400) return 'text-blue-600';
    if (prix <= 600) return 'text-purple-600';
    return 'text-red-600';
  }

  voirDetailsAnnonce(annonceId: string): void {
    window.open(`/detail-annonce/${annonceId}`, '_blank');
  }

  onImageError(event: any): void {
    console.log('Erreur de chargement d\'image, utilisation de l\'icône par défaut');
    // L'image sera automatiquement remplacée par l'icône par défaut grâce à la logique *ngIf dans le template
  }

}
