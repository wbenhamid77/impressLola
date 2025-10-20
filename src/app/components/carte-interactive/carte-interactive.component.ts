import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ImageService } from '../../services/image.service';

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
  styleUrls: ['./carte-interactive.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
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

  // Optimisations de performance
  private filterTimeout: any = null;
  private markerUpdateTimeout: any = null;
  private isUpdatingMarkers = false;
  private maxMarkersPerUpdate = 50; // Limite pour éviter les blocages

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private imageService: ImageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chargerDonnees();
  }

  ngAfterViewInit(): void {
    this.initialiserCarte();
  }

  async chargerDonnees(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      this.cdr.markForCheck();

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
      this.cdr.markForCheck();
      
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
      this.cdr.markForCheck();
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
        images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop'],
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
        images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop'],
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
        images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop'],
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
        images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop'],
        typeMaison: 'MAISON',
        nombreChambres: 3,
        capacite: 6,
        noteMoyenne: 4.7,
        nombreAvis: 15,
        adresse: { numero: '321', rue: 'Rue de la Médina', ville: 'Fès', codePostal: '30000', pays: 'Maroc' },
        equipements: ['WiFi', 'Parking', 'Jardin'],
        estActive: true
      },
      {
        id: '5',
        titre: 'Chambre simple Agadir',
        description: 'Chambre simple près de la plage',
        prixParNuit: 150,
        latitude: 30.4278,
        longitude: -9.5981, // Agadir
        images: [], // Pas d'image pour tester le fallback
        typeMaison: 'CHAMBRE',
        nombreChambres: 1,
        capacite: 2,
        noteMoyenne: 3.8,
        nombreAvis: 3,
        adresse: { numero: '555', rue: 'Boulevard de la Corniche', ville: 'Agadir', codePostal: '80000', pays: 'Maroc' },
        equipements: ['WiFi', 'Vue mer'],
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
    if (!this.map || !this.mapInitialized || !this.markerGroup || this.isUpdatingMarkers) {
      console.log('Carte non initialisée ou mise à jour en cours, impossible d\'ajouter les marqueurs');
      return;
    }

    // Annuler la mise à jour précédente si elle existe
    if (this.markerUpdateTimeout) {
      clearTimeout(this.markerUpdateTimeout);
    }

    this.isUpdatingMarkers = true;

    // Utiliser requestAnimationFrame pour éviter les blocages
    this.markerUpdateTimeout = setTimeout(() => {
      this.performMarkerUpdate();
    }, 100);
  }

  private performMarkerUpdate(): void {
    try {
      // Nettoyer les marqueurs existants
      this.markerGroup.clearLayers();
      this.markers = [];
      this.stadeMarkers = [];

      console.log(`Ajout de ${this.annoncesFiltrees.length} marqueurs d'annonces`);

      // Ajouter les marqueurs par lots pour éviter les blocages
      this.addMarkersInBatches();

    } catch (error) {
      console.error('Erreur lors de l\'ajout des marqueurs:', error);
      this.isUpdatingMarkers = false;
    }
  }

  private addMarkersInBatches(): void {
    const annoncesValides = this.annoncesFiltrees.filter(annonce => 
      annonce.latitude && annonce.longitude && !isNaN(annonce.latitude) && !isNaN(annonce.longitude)
    );

    const stadesValides = this.stades.filter(stade => 
      stade.latitude && stade.longitude && !isNaN(stade.latitude) && !isNaN(stade.longitude)
    );

    let currentIndex = 0;
    const batchSize = Math.min(this.maxMarkersPerUpdate, 20);

    const addBatch = () => {
      const endIndex = Math.min(currentIndex + batchSize, annoncesValides.length);
      
      // Ajouter les marqueurs d'annonces pour ce lot
      for (let i = currentIndex; i < endIndex; i++) {
        const annonce = annoncesValides[i];
        try {
          const marker = L.marker([annonce.latitude, annonce.longitude], {
            icon: this.creerIconeAnnonce(annonce)
          });

          marker.bindPopup(this.creerPopupAnnonce(annonce));
          
          marker.on('click', () => {
            this.selectionnerAnnonce(annonce);
          });
          
          this.markers.push(marker);
          this.markerGroup.addLayer(marker);
        } catch (error) {
          console.error(`Erreur lors de l'ajout du marqueur annonce ${i + 1}:`, error);
        }
      }

      currentIndex = endIndex;

      // Si il reste des annonces, continuer avec le prochain lot
      if (currentIndex < annoncesValides.length) {
        requestAnimationFrame(addBatch);
      } else {
        // Ajouter les marqueurs de stades
        this.addStadeMarkers();
        this.finalizeMapView();
      }
    };

    // Démarrer l'ajout par lots
    if (annoncesValides.length > 0) {
      addBatch();
    } else {
      this.addStadeMarkers();
      this.finalizeMapView();
    }
  }

  private addStadeMarkers(): void {
    this.stades.forEach((stade, index) => {
      if (stade.latitude && stade.longitude && !isNaN(stade.latitude) && !isNaN(stade.longitude)) {
        try {
          const marker = L.marker([stade.latitude, stade.longitude], {
            icon: this.creerIconeStade()
          });

          marker.bindPopup(this.creerPopupStade(stade));
          
          this.stadeMarkers.push(marker);
          this.markerGroup.addLayer(marker);
        } catch (error) {
          console.error(`Erreur lors de l'ajout du marqueur stade ${index + 1}:`, error);
        }
      }
    });
  }

  private finalizeMapView(): void {
    // Ajuster la vue pour afficher tous les marqueurs
    if (this.markers.length > 0) {
      const group = new L.featureGroup(this.markers);
      const bounds = group.getBounds();
      if (bounds.isValid()) {
        this.map.fitBounds(bounds.pad(0.3));
        console.log(`Vue ajustée pour ${this.markers.length} marqueurs`);
      } else {
        this.map.setView([31.6295, -7.9811], 5);
        console.log('Centrage sur le Maroc avec zoom 5');
      }
    } else {
      console.log('Aucun marqueur valide à afficher');
      this.map.setView([31.6295, -7.9811], 5);
    }

    this.isUpdatingMarkers = false;
    this.cdr.markForCheck();
  }

  creerIconeAnnonce(annonce?: Annonce): any {
    // Si on a une annonce avec une image, créer une icône avec image
    if (annonce && annonce.images && annonce.images.length > 0) {
      return L.divIcon({
        html: `
          <div style="
            width: 40px; 
            height: 40px; 
            border: 3px solid #ffffff; 
            border-radius: 50%; 
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            position: relative;
          ">
            <img src="${this.getImagePath(annonce.images[0])}" 
                 alt="${annonce.titre}"
                 style="width: 100%; height: 100%; object-fit: cover;"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div style="
              width: 100%; 
              height: 100%; 
              background: #dc2626; 
              display: none; 
              align-items: center; 
              justify-content: center;
              position: absolute;
              top: 0;
              left: 0;
            ">
              <i class="fas fa-home" style="color: white; font-size: 16px;"></i>
            </div>
          </div>
        `,
        className: 'custom-marker-annonce-with-image',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
    }
    
    // Icône par défaut sans image
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
    const hasImage = annonce.images && annonce.images.length > 0;
    const imageUrl = hasImage ? this.getImagePath(annonce.images?.[0]) : '';
    
    return `
      <div class="popup-annonce" style="min-width: 300px; max-width: 350px;">
        <div class="popup-image" style="margin-bottom: 12px; position: relative;">
          ${hasImage ? `
            <img src="${imageUrl}" alt="${annonce.titre}"
                 style="width: 100%; height: 150px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div style="
              width: 100%; 
              height: 150px; 
              background: linear-gradient(135deg, #f3f4f6, #e5e7eb); 
              border-radius: 12px; 
              display: none; 
              align-items: center; 
              justify-content: center;
              position: absolute;
              top: 0;
              left: 0;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            ">
              <div style="text-align: center; color: #6b7280;">
                <div style="width: 40px; height: 40px; background: #dc2626; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                  <i class="fas fa-home" style="color: white; font-size: 18px;"></i>
                </div>
                <p style="margin: 0; font-size: 12px; font-weight: 500;">Image non disponible</p>
              </div>
            </div>
          ` : `
            <div style="
              width: 100%; 
              height: 150px; 
              background: linear-gradient(135deg, #f3f4f6, #e5e7eb); 
              border-radius: 12px; 
              display: flex; 
              align-items: center; 
              justify-content: center;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            ">
              <div style="text-align: center; color: #6b7280;">
                <div style="width: 40px; height: 40px; background: #dc2626; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                  <i class="fas fa-home" style="color: white; font-size: 18px;"></i>
                </div>
                <p style="margin: 0; font-size: 12px; font-weight: 500;">Pas d'image</p>
              </div>
            </div>
          `}
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
    // Annuler le filtre précédent
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }

    // Appliquer le filtre avec debounce
    this.filterTimeout = setTimeout(() => {
      this.performStadeFilter();
    }, 300);
  }

  private performStadeFilter(): void {
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
    // Annuler le filtre précédent
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }

    // Appliquer les filtres avec debounce
    this.filterTimeout = setTimeout(() => {
      this.performFilters();
    }, 200);
  }

  private performFilters(): void {
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
    this.cdr.markForCheck();
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
    // Annuler les timeouts en cours
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }
    if (this.markerUpdateTimeout) {
      clearTimeout(this.markerUpdateTimeout);
    }

    this.stadeSelectionne = '';
    this.rayonFiltre = 10;
    this.prixMin = 0;
    this.prixMax = 10000;
    this.typeMaison = '';
    this.annoncesFiltrees = [...this.annonces];
    this.ajouterMarqueursCarte();
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    // Nettoyer les timeouts
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }
    if (this.markerUpdateTimeout) {
      clearTimeout(this.markerUpdateTimeout);
    }

    // Nettoyer la carte
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    // Nettoyer les marqueurs
    this.markers = [];
    this.stadeMarkers = [];
    this.markerGroup = null;
  }

  getImagePath(imageName: string | undefined): string {
    return this.imageService.getImagePath(imageName);
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
    this.imageService.onImageError(event);
  }

  onImageLoad(event: any): void {
    this.imageService.onImageLoad(event);
  }

}
