import { Component, OnInit, ChangeDetectionStrategy, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CreateAnnonceRequest } from '../../models/annonce.model';
// Services de carte supprimés - utilisation de Leaflet uniquement
import { StadeService } from '../../services/stade.service';
import * as L from 'leaflet';

// Configuration des icônes par défaut de Leaflet
(L.Icon.Default as any).mergeOptions({
  iconRetinaUrl: 'assets/images/marker-icon-2x.png',
  iconUrl: 'assets/images/marker-icon.png',
  shadowUrl: 'assets/images/marker-shadow.png'
});

@Component({
  selector: 'app-ajouter-annonce',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './ajouter-annonce.component.html',
  styleUrls: ['./ajouter-annonce.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AjouterAnnonceComponent implements OnInit, AfterViewInit, OnDestroy {
  annonceForm!: FormGroup;
  loading = false;
  error = '';
  success = '';
  isLocateur = false;
  formInitialized = false;

  // Gestion du formulaire multi-étapes
  currentStep = 1;
  readonly totalSteps = 7; // 1: Infos, 2: Images, 3: Caractéristiques, 4: Localisation, 5: Équipements, 6: Règles, 7: Résumé

  // Propriétés pour les cartes
  private mapStep4: any = null;
  private mapStep7: any = null;
  private markerStep4: any = null;
  private markerStep7: any = null;
  mapStep4Initialized = false;
  mapStep7Initialized = false;
  mapError = false;
  // Variables de recherche supprimées - utilisation de Leaflet uniquement

  // Propriétés pour la gestion des images
  selectedImages: Array<{file: File, preview: string, name: string, size: number}> = [];
  selectedFiles: File[] = [];
  imageErrors: string[] = [];
  isDragOver = false;
  maxFileSize = 5 * 1024 * 1024; // 5MB
  maxImages = 10;
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

  // Propriétés pour les coordonnées
  latitude: number = 0;
  longitude: number = 0;

  // Mapping des équipements
  private equipementsMapping: { [key: string]: string } = {
    wifi: 'WiFi',
    climatisation: 'Climatisation',
    chauffage: 'Chauffage',
    ascenseur: 'Ascenseur',
    parking: 'Parking',
    balcon: 'Balcon',
    vue: 'Vue exceptionnelle',
    securite: 'Système de sécurité',
    cuisine_equipee: 'Cuisine équipée',
    micro_ondes: 'Micro-ondes',
    lave_vaisselle: 'Lave-vaisselle',
    refrigerateur: 'Réfrigérateur',
    cafetiere: 'Cafetière',
    bouilloire: 'Bouilloire',
    mixeur: 'Mixeur',
    grill: 'Grill',
    ustensiles: 'Ustensiles de cuisine',
    vaisselle: 'Vaisselle complète',
    salle_bain_privee: 'Salle de bain privée',
    douche: 'Douche',
    bain: 'Baignoire',
    serviettes: 'Serviettes fournies',
    seche_cheveux: 'Sèche-cheveux',
    produits_hygiene: 'Produits d\'hygiène',
    peignoir: 'Peignoir',
    chaussons: 'Chaussons',
    linge_maison: 'Linge de maison',
    oreillers: 'Oreillers',
    couvertures: 'Couvertures',
    armoire: 'Armoire/Penderie',
    lit_bebe: 'Lit bébé disponible',
    lit_supplementaire: 'Lit supplémentaire',
    table_chevet: 'Table de chevet',
    lampe_chevet: 'Lampe de chevet',
    tv: 'Télévision',
    netflix: 'Netflix/Streaming',
    jeux: 'Jeux de société',
    livres: 'Livres',
    musique: 'Système audio',
    console_jeux: 'Console de jeux',
    projecteur: 'Projecteur',
    karaoke: 'Karaoké',
    jardin: 'Jardin',
    barbecue: 'Barbecue',
    piscine: 'Piscine',
    terrasse: 'Terrasse',
    hamac: 'Hamac',
    parasol: 'Parasol',
    chaises_longues: 'Chaises longues',
    accessible: 'Accessible aux personnes à mobilité réduite',
    rampe: 'Rampe d\'accès',
    ascenseur_accessible: 'Ascenseur accessible',
    salle_bain_accessible: 'Salle de bain accessible',
    conciergerie: 'Service de conciergerie',
    petit_dejeuner: 'Petit-déjeuner inclus',
    transfert: 'Service de transfert',
    guide: 'Guide touristique',
    menage: 'Service de ménage',
    cuisinier: 'Cuisinier privé',
    chauffeur: 'Chauffeur privé',
    massage: 'Service de massage'
  };

  // Mapping des règles
  private reglesMapping: { [key: string]: string } = {
    pas_fumeur: 'Pas de tabac',
    pas_animaux: 'Pas d\'animaux',
    animaux_autorises: 'Animaux autorisés',
    pas_fete: 'Pas de fête',
    calme: 'Respect des voisins',
    pas_alcool: 'Consommation d\'alcool interdite',
    pas_musique: 'Musique interdite',
    pas_visiteurs: 'Visiteurs non autorisés',
    check_in_flexible: 'Arrivée flexible',
    check_out_10h: 'Départ avant 10h',
    check_out_11h: 'Départ avant 11h',
    check_out_12h: 'Départ avant 12h',
    couvre_feu: 'Couvre-feu à 22h',
    silence_nuit: 'Silence de nuit (22h-7h)',
    camera: 'Caméras de surveillance',
    detecteur_fumee: 'Détecteur de fumée',
    extincteur: 'Extincteur',
    coffre_fort: 'Coffre-fort',
    gardien: 'Gardien 24h/24',
    interphone: 'Interphone',
    digicode: 'Digicode',
    nettoyage_inclus: 'Nettoyage inclus',
    linge_fourni: 'Linge de maison fourni',
    menage_fin_sejour: 'Ménage de fin de séjour',
    linge_propre: 'Linge propre à laisser',
    nettoyage_quotidien: 'Nettoyage quotidien',
    changement_linge: 'Changement de linge',
    pas_cuisine: 'Cuisine non autorisée',
    pas_lavage: 'Machine à laver non autorisée',
    pas_enfants: 'Enfants non autorisés',
    pas_etudiants: 'Étudiants non autorisés',
    pas_travailleurs: 'Travailleurs non autorisés',
    pas_photographie: 'Photographie interdite',
    wifi_gratuit: 'WiFi gratuit',
    electricite_incluse: 'Électricité incluse',
    eau_incluse: 'Eau incluse',
    chauffage_inclus: 'Chauffage inclus',
    parking_gratuit: 'Parking gratuit',
    menage_inclus: 'Ménage inclus'
  };

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router,
    private stadeService: StadeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.verifierRole();
    this.initForm();
    this.updateStepProgress();
  }

  // Navigation entre étapes
  goToStep(step: number): void {
    if (step < 1 || step > this.totalSteps) return;
    this.currentStep = step;
    // Initialiser la carte selon l'étape
    if (this.currentStep === 4) {
      setTimeout(() => this.initMapStep4(), 100);
    } else if (this.currentStep === 7) {
      setTimeout(() => this.initMapStep7(), 100);
    }
    // Mettre à jour la progression visuelle
    this.updateStepProgress();
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      if (this.currentStep === 4) {
        setTimeout(() => this.initMapStep4(), 100);
      } else if (this.currentStep === 7) {
        setTimeout(() => this.initMapStep7(), 100);
      }
      this.updateStepProgress();
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateStepProgress();
    }
  }

  private updateStepProgress(): void {
    // Mettre à jour la variable CSS pour la progression
    document.documentElement.style.setProperty('--current-step', this.currentStep.toString());
  }

  ngAfterViewInit(): void {
    // Forcer l'initialisation de la carte selon l'étape
    setTimeout(() => {
      console.log('ngAfterViewInit - Étape courante:', this.currentStep);
      if (this.currentStep === 4) {
        console.log('Tentative d\'initialisation carte étape 4...');
        this.initMapStep4();
      } else if (this.currentStep === 7) {
        console.log('Tentative d\'initialisation carte étape 7...');
        this.initMapStep7();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.mapStep4) {
      this.mapStep4.remove();
    }
    if (this.mapStep7) {
      this.mapStep7.remove();
    }
  }

  private async initMapStep4(): Promise<void> {
    if (this.mapStep4Initialized) {
      console.log('Carte étape 4 déjà initialisée');
      return;
    }

    try {
      console.log('🗺️ DÉBUT initialisation carte étape 4...');
      
      // Coordonnées par défaut (Casablanca, Maroc)
      const defaultLat = 33.5731;
      const defaultLng = -7.5898;

      const mapContainer = document.getElementById('map-step4');
      console.log('📍 Container map-step4 trouvé:', !!mapContainer);
      
      if (!mapContainer) {
        console.error('❌ Container map-step4 non trouvé');
        this.mapError = true;
        this.cdr.detectChanges();
            return;
      }

      // Nettoyer et configurer le conteneur
      mapContainer.innerHTML = '';
      mapContainer.style.width = '100%';
      mapContainer.style.height = '450px';
      mapContainer.style.position = 'relative';
      mapContainer.style.backgroundColor = '#f0f0f0';

      console.log('📐 Conteneur configuré');

      // Créer la carte Leaflet simple
      console.log('🌍 Création de la carte Leaflet...');
      this.mapStep4 = L.map(mapContainer, {
        center: [defaultLat, defaultLng],
        zoom: 13,
        zoomControl: true,
        attributionControl: true
      });

      console.log('✅ Carte Leaflet créée');

      // Ajouter les tuiles (version simple sans timeout)
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      });

      tileLayer.addTo(this.mapStep4);
      console.log('🗺️ Tuiles ajoutées');

      // Créer un marqueur personnalisé avec les couleurs du Maroc
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
        <div style="
            width: 30px;
            height: 30px;
            background: linear-gradient(135deg, #c1272d 0%, #006233 100%);
            border: 3px solid #ffd700;
            border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          position: relative;
        ">
          <div style="
              width: 8px;
              height: 8px;
            background: white;
              border-radius: 50%;
            "></div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
      });

      this.markerStep4 = L.marker([defaultLat, defaultLng], {
        draggable: true,
        title: 'Emplacement du logement',
        icon: customIcon
      }).addTo(this.mapStep4);

      console.log('Marqueur ajouté');

      // Ajouter un popup au marqueur avec style Maroc
      this.markerStep4.bindPopup(`
        <div style="text-align: center; min-width: 220px; padding: 8px;">
          <h4 style="margin: 0 0 8px 0; color: #c1272d; font-size: 14px; font-weight: bold;">
            📍 Emplacement du logement
          </h4>
          <p style="margin: 4px 0; color: #2d3748; font-size: 12px; font-family: 'Courier New', monospace;">
            <strong>Latitude:</strong> ${defaultLat.toFixed(6)}
          </p>
          <p style="margin: 4px 0; color: #2d3748; font-size: 12px; font-family: 'Courier New', monospace;">
            <strong>Longitude:</strong> ${defaultLng.toFixed(6)}
          </p>
          <small style="color: #006233; font-size: 11px; font-style: italic; display: block; margin-top: 8px;">
            🖱️ Déplacez ce marqueur pour modifier l'emplacement
          </small>
            </div>
      `);

      // Écouter les événements de déplacement du marqueur
      this.markerStep4.on('dragend', (event: L.DragEndEvent) => {
        const marker = event.target;
        const position = marker.getLatLng();
        
        // Mettre à jour les propriétés du composant
        this.latitude = position.lat;
        this.longitude = position.lng;
        
        if (this.annonceForm) {
          this.annonceForm.patchValue({
            latitude: position.lat,
            longitude: position.lng
          });
        }

        // Mettre à jour le popup
        marker.setPopupContent(`
          <div style="text-align: center; min-width: 220px; padding: 8px;">
            <h4 style="margin: 0 0 8px 0; color: #c1272d; font-size: 14px; font-weight: bold;">
              📍 Emplacement du logement
            </h4>
            <p style="margin: 4px 0; color: #2d3748; font-size: 12px; font-family: 'Courier New', monospace;">
              <strong>Latitude:</strong> ${position.lat.toFixed(6)}
            </p>
            <p style="margin: 4px 0; color: #2d3748; font-size: 12px; font-family: 'Courier New', monospace;">
              <strong>Longitude:</strong> ${position.lng.toFixed(6)}
            </p>
            <small style="color: #006233; font-size: 11px; font-style: italic; display: block; margin-top: 8px;">
              ✅ Position mise à jour
            </small>
          </div>
        `);

        // Mettre à jour l'affichage des coordonnées
        this.updateCoordinatesDisplay(position.lat, position.lng);
        
        console.log('Marqueur déplacé vers:', position.lat, position.lng);
      });

      // Écouter les clics sur la carte pour placer le marqueur
      this.mapStep4.on('click', (event: L.LeafletMouseEvent) => {
        const lat = event.latlng.lat;
        const lng = event.latlng.lng;
        
        // Déplacer le marqueur
        this.markerStep4.setLatLng([lat, lng]);
        
        // Mettre à jour les propriétés du composant
        this.latitude = lat;
        this.longitude = lng;
        
      if (this.annonceForm) {
        this.annonceForm.patchValue({
            latitude: lat,
            longitude: lng
          });
        }

        // Mettre à jour le popup
        this.markerStep4.setPopupContent(`
          <div style="text-align: center; min-width: 220px; padding: 8px;">
            <h4 style="margin: 0 0 8px 0; color: #c1272d; font-size: 14px; font-weight: bold;">
              📍 Emplacement du logement
            </h4>
            <p style="margin: 4px 0; color: #2d3748; font-size: 12px; font-family: 'Courier New', monospace;">
              <strong>Latitude:</strong> ${lat.toFixed(6)}
            </p>
            <p style="margin: 4px 0; color: #2d3748; font-size: 12px; font-family: 'Courier New', monospace;">
              <strong>Longitude:</strong> ${lng.toFixed(6)}
            </p>
            <small style="color: #006233; font-size: 11px; font-style: italic; display: block; margin-top: 8px;">
              🎯 Position sélectionnée par clic
            </small>
          </div>
        `);

        // Mettre à jour l'affichage des coordonnées
        this.updateCoordinatesDisplay(lat, lng);
        
        console.log('Clic sur la carte:', lat, lng);
      });

      // Finaliser l'initialisation
      setTimeout(() => {
        if (this.mapStep4) {
          this.mapStep4.invalidateSize();
          console.log('🔄 Carte redimensionnée');
        }
      }, 100);
      
      // IMPORTANT: Marquer comme initialisée
      this.mapStep4Initialized = true;
      this.mapError = false;
      
      // Forcer la détection des changements
      this.cdr.detectChanges();
      
      console.log('✅ Carte étape 4 - Initialisation TERMINÉE');

    } catch (error) {
      console.error('❌ Erreur carte étape 4:', error);
      console.log('🔄 Activation du fallback...');
      
      // Créer la carte de fallback
      this.createFallbackMap('map-step4');
      
      // Marquer comme initialisée (fallback compte comme initialisation)
      this.mapStep4Initialized = true;
      this.mapError = false;
      
      // Forcer la détection des changements
      this.cdr.detectChanges();
      
      console.log('✅ Fallback carte étape 4 activé');
    }
  }

  private async initMapStep7(): Promise<void> {
    if (this.mapStep7Initialized) return;

    try {
      console.log('Début de l\'initialisation de la carte étape 7...');
      
      // Utiliser les coordonnées du formulaire si disponibles
      const lat = this.latitude || 33.5731;
      const lng = this.longitude || -7.5898;

      // Attendre que le DOM soit prêt
      await new Promise(resolve => setTimeout(resolve, 500));

      const mapContainer = document.getElementById('map-step7');
      console.log('Container map étape 7 trouvé:', !!mapContainer);
      
      if (!mapContainer) {
        console.error('Container map étape 7 non trouvé');
        this.mapError = true;
        return;
      }

      // Vider le conteneur et s'assurer qu'il a les bonnes dimensions
      mapContainer.innerHTML = '';
      mapContainer.style.width = '100%';
      mapContainer.style.height = '100%';
      mapContainer.style.position = 'relative';
      mapContainer.style.borderRadius = '12px';
      mapContainer.style.overflow = 'hidden';

      console.log('Création de la carte Leaflet étape 7...');

      // Créer la carte Leaflet (lecture seule pour le résumé)
      this.mapStep7 = L.map('map-step7', {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true,
        touchZoom: true,
        attributionControl: true
      });

      console.log('Carte Leaflet étape 7 créée');

      // Ajouter la couche de tuiles
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 3,
        subdomains: 'abc'
      });

      tileLayer.addTo(this.mapStep7);

      // Créer un marqueur fixe pour le résumé
      const customIcon = L.divIcon({
        className: 'custom-marker-preview',
        html: `
          <div style="
              width: 40px;
              height: 40px;
              background: linear-gradient(135deg, #059669, #dc2626);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              border: 3px solid white;
            ">
            <i class="fas fa-home" style="color: white; font-size: 16px;"></i>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      });

      this.markerStep7 = L.marker([lat, lng], {
        icon: customIcon,
        draggable: false
      }).addTo(this.mapStep7);

      // Popup avec informations de l'annonce
      this.markerStep7.bindPopup(`
        <div style="text-align: center; min-width: 250px; padding: 12px;">
          <h4 style="margin: 0 0 8px 0; color: #059669; font-size: 16px; font-weight: bold;">
            🏠 ${this.annonceForm.get('titre')?.value || 'Votre logement'}
          </h4>
          <p style="margin: 4px 0; color: #6b7280; font-size: 13px;">
            📍 ${this.annonceForm.get('ville')?.value || 'Ville'}, ${this.annonceForm.get('pays')?.value || 'Maroc'}
          </p>
          <p style="margin: 4px 0; color: #dc2626; font-size: 14px; font-weight: bold;">
            💰 ${this.annonceForm.get('prixParNuit')?.value || '0'} DH/nuit
          </p>
          <small style="color: #6b7280; font-size: 11px; display: block; margin-top: 8px;">
            Coordonnées: ${lat.toFixed(4)}, ${lng.toFixed(4)}
          </small>
        </div>
      `);

      // Forcer le rafraîchissement de la carte
      setTimeout(() => {
        if (this.mapStep7) {
          this.mapStep7.invalidateSize();
          console.log('Carte étape 7 rafraîchie');
        }
      }, 500);
      
      this.mapStep7Initialized = true;
      console.log('Initialisation de la carte étape 7 terminée avec succès');

    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la carte étape 7:', error);
      console.log('Utilisation du fallback pour la carte étape 7...');
      this.createFallbackMap('map-step7');
      this.mapStep7Initialized = true;
      this.mapError = false;
      this.cdr.detectChanges();
    }
  }

  retryMapLoad(): void {
    this.mapError = false;
    this.mapStep4Initialized = false;
    this.mapStep7Initialized = false;
    if (this.currentStep === 4) {
      this.initMapStep4();
    } else if (this.currentStep === 7) {
      this.initMapStep7();
    }
  }

  // Méthode de fallback pour tester
  private createFallbackMap(containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        color: #0f172a;
      ">
        <div style="
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #059669, #dc2626);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        ">
          <i class="fas fa-map-marker-alt" style="color: white; font-size: 32px;"></i>
        </div>
        <h4 style="margin: 0 0 8px 0; font-size: 18px; font-weight: bold; color: #059669;">
          📍 Carte Interactive
        </h4>
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280;">
          Casablanca, Maroc
        </p>
        <div style="
          background: rgba(255,255,255,0.8);
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 12px;
          color: #374151;
          border: 1px solid #e5e7eb;
        ">
          <strong>Coordonnées:</strong><br>
          Lat: ${this.latitude || 33.5731}<br>
          Lng: ${this.longitude || -7.5898}
        </div>
      </div>
    `;
  }

  // Méthode de compatibilité
  private async initMap(): Promise<void> {
    if (this.currentStep === 4) {
      return this.initMapStep4();
    } else if (this.currentStep === 7) {
      return this.initMapStep7();
    }
  }

  // Méthode de test publique (accessible depuis la console)
  public testMap(): void {
    console.log('=== TEST DE LA CARTE ===');
    console.log('Étape actuelle:', this.currentStep);
    console.log('MapStep4 initialisée:', this.mapStep4Initialized);
    console.log('MapStep7 initialisée:', this.mapStep7Initialized);
    console.log('Erreur carte:', this.mapError);
    
    const container4 = document.getElementById('map-step4');
    const container7 = document.getElementById('map-step7');
    
    console.log('Container étape 4 existe:', !!container4);
    console.log('Container étape 7 existe:', !!container7);
    
    if (container4) {
      console.log('Contenu container 4:', container4.innerHTML.length > 0 ? 'Présent' : 'Vide');
    }
    if (container7) {
      console.log('Contenu container 7:', container7.innerHTML.length > 0 ? 'Présent' : 'Vide');
    }
    
    console.log('=== FIN TEST ===');
  }

  // Test simple sans Leaflet pour diagnostic
  public createSimpleMap(): void {
    console.log('🚀 Création d\'une carte simple pour test...');
    const container = document.getElementById('map-step4');
    if (container) {
      this.createFallbackMap('map-step4');
      this.mapStep4Initialized = true;
      this.mapError = false;
      this.cdr.detectChanges();
      console.log('✅ Carte simple créée avec succès !');
    } else {
      console.error('❌ Container map-step4 non trouvé');
    }
  }

  // Méthode de force reset - si la carte est bloquée
  public forceMapReset(): void {
    console.log('🔄 RESET FORCÉ de la carte...');
    this.mapStep4Initialized = false;
    this.mapStep7Initialized = false;
    this.mapError = false;
    
    if (this.mapStep4) {
      this.mapStep4.remove();
      this.mapStep4 = null;
    }
    
    this.cdr.detectChanges();
    
    // Relancer l'initialisation
    setTimeout(() => {
      this.initMapStep4();
    }, 100);
    
    console.log('✅ Reset terminé, initialisation relancée');
  }

  private async updateMarkerPopup(lat: number, lng: number): Promise<void> {
    if (this.markerStep4 && this.mapStep4) {
      this.markerStep4.setLatLng([lat, lng]);
      this.markerStep4.setPopupContent(`
        <div style="text-align: center; min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; color: #2d3748; font-size: 14px;">Emplacement du logement</h4>
          <p style="margin: 4px 0; color: #718096; font-size: 12px; font-family: 'Courier New', monospace;">
            Latitude: ${lat.toFixed(6)}
          </p>
          <p style="margin: 4px 0; color: #718096; font-size: 12px; font-family: 'Courier New', monospace;">
            Longitude: ${lng.toFixed(6)}
          </p>
          <small style="color: #a0aec0; font-size: 11px; font-style: italic;">
            Emplacement mis à jour
          </small>
        </div>
      `);
    }
  }

  // Méthodes de recherche Google supprimées - utilisation directe de Leaflet

  centerOnParis(): void {
    if (this.mapStep4) {
      this.mapStep4.setView([48.8566, 2.3522], 13);
    }
  }

  private initForm(): void {
      this.annonceForm = this.fb.group({
        titre: ['', [Validators.required, Validators.minLength(10)]],
        description: ['', [Validators.required, Validators.minLength(50)]],
      typeMaison: ['', Validators.required],
      nombreChambres: [1, [Validators.required, Validators.min(1), Validators.max(20)]],
      capacite: [2, [Validators.required, Validators.min(1), Validators.max(50)]],
      prixParNuit: [0, [Validators.required, Validators.min(1)]],
      ville: ['', Validators.required],
      pays: ['Maroc', Validators.required],
      rue: ['', Validators.required],
      codePostal: ['', Validators.required],
      latitude: [33.5731, Validators.required],
      longitude: [-7.5898, Validators.required],
        equipements: this.fb.group({
          wifi: [false],
          climatisation: [false],
          chauffage: [false],
          ascenseur: [false],
          parking: [false],
          balcon: [false],
        vue: [false],
        securite: [false],
          cuisine_equipee: [false],
          micro_ondes: [false],
          lave_vaisselle: [false],
          refrigerateur: [false],
          cafetiere: [false],
          bouilloire: [false],
        mixeur: [false],
        grill: [false],
        ustensiles: [false],
        vaisselle: [false],
          salle_bain_privee: [false],
          douche: [false],
          bain: [false],
          serviettes: [false],
          seche_cheveux: [false],
        produits_hygiene: [false],
        peignoir: [false],
        chaussons: [false],
          linge_maison: [false],
          oreillers: [false],
          couvertures: [false],
          armoire: [false],
          lit_bebe: [false],
        lit_supplementaire: [false],
        table_chevet: [false],
        lampe_chevet: [false],
          tv: [false],
          netflix: [false],
          jeux: [false],
          livres: [false],
          musique: [false],
        console_jeux: [false],
        projecteur: [false],
        karaoke: [false],
          jardin: [false],
          barbecue: [false],
          piscine: [false],
          terrasse: [false],
        hamac: [false],
        parasol: [false],
        chaises_longues: [false],
          accessible: [false],
          rampe: [false],
        ascenseur_accessible: [false],
        salle_bain_accessible: [false],
        conciergerie: [false],
        petit_dejeuner: [false],
        transfert: [false],
        guide: [false],
        menage: [false],
        cuisinier: [false],
        chauffeur: [false],
        massage: [false]
        }),
        regles: this.fb.group({
          pas_fumeur: [false],
          pas_animaux: [false],
          animaux_autorises: [false],
          pas_fete: [false],
          calme: [false],
        pas_alcool: [false],
        pas_musique: [false],
        pas_visiteurs: [false],
          check_in_flexible: [false],
          check_out_10h: [false],
          check_out_11h: [false],
          check_out_12h: [false],
        couvre_feu: [false],
        silence_nuit: [false],
          camera: [false],
          detecteur_fumee: [false],
          extincteur: [false],
          coffre_fort: [false],
        gardien: [false],
        interphone: [false],
        digicode: [false],
          nettoyage_inclus: [false],
          linge_fourni: [false],
          menage_fin_sejour: [false],
          linge_propre: [false],
        nettoyage_quotidien: [false],
        changement_linge: [false],
          pas_cuisine: [false],
          pas_lavage: [false],
          pas_enfants: [false],
        pas_etudiants: [false],
        pas_travailleurs: [false],
        pas_photographie: [false],
        wifi_gratuit: [false],
        electricite_incluse: [false],
        eau_incluse: [false],
        chauffage_inclus: [false],
        parking_gratuit: [false],
        menage_inclus: [false]
        })
      });

      this.formInitialized = true;
  }

  verifierRole(): void {
    const locataireId = localStorage.getItem('locataireId');
    const userId = localStorage.getItem('userId');
    const authToken = localStorage.getItem('authToken');
    
    console.log('Vérification du rôle:', { locataireId, userId, authToken });
    
    if (locataireId && userId && authToken) {
      this.isLocateur = true;
    } else {
      this.isLocateur = false;
      this.error = 'Vous devez être connecté en tant que locateur pour ajouter une annonce.';
    }
  }

  onSubmit(): void {
    // Demander confirmation avant l'envoi
    const confirmed = window.confirm("Êtes-vous sûr de vouloir publier cette annonce ? Le locataire verra toutes les informations que vous avez saisies.");
    if (!confirmed) {
      return;
    }
    if (this.annonceForm.invalid) {
      this.error = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      this.error = 'Vous devez être connecté pour créer une annonce.';
      return;
    }

      this.loading = true;
      this.error = '';

    const formValue = this.annonceForm.value;
    
    // Calculer automatiquement les informations du stade le plus proche
    const stadeInfo = this.stadeService.mettreAJourStadeAnnonce(formValue.latitude, formValue.longitude);
    
    const request: CreateAnnonceRequest = {
      titre: formValue.titre,
      description: formValue.description,
      typeMaison: formValue.typeMaison,
      nombreChambres: formValue.nombreChambres,
      capacite: formValue.capacite,
      prixParNuit: formValue.prixParNuit,
      prixParSemaine: formValue.prixParNuit * 7,
      prixParMois: formValue.prixParNuit * 30,
      nombreSallesDeBain: 1,
      latitude: formValue.latitude,
      longitude: formValue.longitude,
      stadePlusProche: stadeInfo.stadePlusProche,
      distanceStade: stadeInfo.distanceStade,
      adresseStade: stadeInfo.adresseStade,
          equipements: this.getSelectedEquipements(),
          regles: this.getSelectedRegles(),
      images: this.getSelectedImages(),
      adresse: {
        rue: formValue.rue,
        numero: '1',
        codePostal: formValue.codePostal,
        ville: formValue.ville,
        pays: formValue.pays,
        complement: '',
        surface: 100
      },
          locateurId: localStorage.getItem('locateurId') || localStorage.getItem('userId') || ''
        };

    console.log('Envoi de la requête:', request);

    this.apiService.creerAnnonce(request).subscribe({
      next: (response) => {
        console.log('Annonce créée avec succès:', response);
        this.success = 'Annonce créée avec succès !';
        this.annonceForm.reset();
        this.selectedImages = [];
        this.selectedFiles = [];
        
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2000);
      },
      error: (error) => {
        console.error('Erreur lors de la création de l\'annonce:', error);
        this.error = 'Une erreur est survenue lors de la création de l\'annonce.';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  getSelectedEquipements(): string[] {
    const equipements = this.annonceForm.get('equipements')?.value;
    if (!equipements) return [];

    return Object.keys(equipements)
      .filter(key => equipements[key] === true)
      .map(key => this.equipementsMapping[key] || key);
  }

  getSelectedRegles(): string[] {
    const regles = this.annonceForm.get('regles')?.value;
    if (!regles) return [];

    return Object.keys(regles)
      .filter(key => regles[key] === true)
      .map(key => this.reglesMapping[key] || key);
  }

  retourDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  mesAnnonces(): void {
    this.router.navigate(['/mes-annonces']);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files) {
      const fileArray = Array.from(files);
      this.selectedFiles = [...this.selectedFiles, ...fileArray];
      this.processFiles(fileArray);
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files) {
      const fileArray = Array.from(files);
      this.selectedFiles = [...this.selectedFiles, ...fileArray];
      this.processFiles(fileArray);
    }
  }

  private processFiles(files: File[]): void {
    this.imageErrors = [];
    
    files.forEach(file => {
      // Vérifier le type de fichier
      if (!this.allowedTypes.includes(file.type)) {
        this.imageErrors.push(`Le fichier "${file.name}" n'est pas un type d'image valide.`);
        return;
      }

      // Vérifier la taille du fichier
      if (file.size > this.maxFileSize) {
        this.imageErrors.push(`Le fichier "${file.name}" est trop volumineux (max 5MB).`);
        return;
      }

      // Vérifier le nombre maximum d'images
      if (this.selectedImages.length >= this.maxImages) {
        this.imageErrors.push(`Vous ne pouvez pas ajouter plus de ${this.maxImages} images.`);
        return;
      }

      // Vérifier si l'image n'est pas déjà sélectionnée
      const isDuplicate = this.selectedImages.some(img => img.name === file.name);
      if (isDuplicate) {
        this.imageErrors.push(`L'image "${file.name}" est déjà sélectionnée.`);
        return;
      }

      // Créer la preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        this.selectedImages.push({
          file: file,
          preview: preview,
          name: file.name,
          size: file.size
        });
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    this.selectedImages.splice(index, 1);
    this.selectedFiles.splice(index, 1);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getImagePreview(file: File): string {
    return URL.createObjectURL(file);
  }

  // Méthode pour obtenir les images en base64
  getSelectedImages(): string[] {
    return this.selectedImages.map(img => img.preview); // Retourner les previews en base64
  }

  private updateCoordinatesDisplay(lat: number, lng: number): void {
    const latDisplay = document.getElementById('lat-display');
    const lngDisplay = document.getElementById('lng-display');
    
    if (latDisplay) {
      latDisplay.textContent = lat.toFixed(6);
    }
    if (lngDisplay) {
      lngDisplay.textContent = lng.toFixed(6);
    }
  }

  // Méthodes pour la carte professionnelle
  getCurrentLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Mettre à jour les propriétés du composant
          this.latitude = lat;
          this.longitude = lng;
          
          // Mettre à jour le formulaire
          if (this.annonceForm) {
            this.annonceForm.patchValue({
              latitude: lat,
              longitude: lng
            });
          }
          
          // Centrer la carte sur la position actuelle
          if (this.mapStep4) {
            this.mapStep4.setView([lat, lng], 15);
            if (this.markerStep4) {
              this.markerStep4.setLatLng([lat, lng]);
            }
          }
          
          // Mettre à jour l'affichage des coordonnées
          this.updateCoordinatesDisplay(lat, lng);
          
          console.log('Position actuelle récupérée:', lat, lng);
        },
        (error) => {
          console.error('Erreur lors de la récupération de la position:', error);
        }
      );
    } else {
      console.error('Géolocalisation non supportée par ce navigateur');
    }
  }

  zoomIn(): void {
    if (this.mapStep4) {
      this.mapStep4.zoomIn();
    }
    if (this.mapStep7) {
      this.mapStep7.zoomIn();
    }
  }

  zoomOut(): void {
    if (this.mapStep4) {
      this.mapStep4.zoomOut();
    }
    if (this.mapStep7) {
      this.mapStep7.zoomOut();
    }
  }

  centerMap(): void {
      // Centrer sur Casablanca par défaut ou sur la position actuelle du marqueur
      const currentLat = this.annonceForm?.get('latitude')?.value || 33.5731;
      const currentLng = this.annonceForm?.get('longitude')?.value || -7.5898;
    
    if (this.mapStep4) {
      this.mapStep4.setView([currentLat, currentLng], 13);
    }
    if (this.mapStep7) {
      this.mapStep7.setView([currentLat, currentLng], 13);
    }
  }
} 