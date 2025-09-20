import { Component, OnInit, ChangeDetectorRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Annonce } from '../../models/annonce.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-modifier-annonce',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './modifier-annonce.component.html',
  styleUrls: ['./modifier-annonce.component.css']
})
export class ModifierAnnonceComponent implements OnInit, AfterViewInit, OnDestroy {
  annonceForm!: FormGroup;
  annonceId: string = '';
  annonce: Annonce | null = null;
  loading = true;
  saving = false;
  error = '';
  success = '';
  isLocateur = false;

  // Propriétés pour la carte
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  mapInitialized = false;
  mapError = false;
  searchQuery = '';
  searchResults: any[] = [];
  showSearchResults = false;

  // Propriétés pour la gestion des images
  selectedImages: Array<{file: File, preview: string, name: string, size: number}> = [];
  imageErrors: string[] = [];
  isDragOver = false;
  maxFileSize = 5 * 1024 * 1024; // 5MB
  maxImages = 10;
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

  // Propriétés pour les modales
  modal: string | null = null;
  
  // Formulaires pour les équipements et règles
  equipementsForm!: FormGroup;
  reglesForm!: FormGroup;
  
  // Propriétés pour les réservations
  reservationsStats: any = null;
  recentReservations: any[] = [];
  filteredReservations: any[] = [];
  selectedReservation: any = null;
  reservationFilter = 'TOUS';
  reservationPeriodFilter = 'TOUTES';

  equipementsDisponibles = [
    'WiFi', 'Climatisation', 'Chauffage', 'Ascenseur', 'Parking', 'Balcon', 
    'Cuisine équipée', 'Micro-ondes', 'Lave-vaisselle', 'Réfrigérateur', 
    'Cafetière', 'Bouilloire', 'Salle de bain privée', 'Douche', 'Baignoire', 
    'Serviettes fournies', 'Sèche-cheveux', 'Linge de maison', 'Oreillers', 
    'Couvertures', 'Armoire/Penderie', 'Lit bébé disponible', 'Télévision', 
    'Netflix/Streaming', 'Jeux de société', 'Livres', 'Système audio', 
    'Jardin', 'Barbecue', 'Piscine', 'Terrasse', 'Vue exceptionnelle', 
    'Accessible aux personnes à mobilité réduite', 'Rampe d\'accès', 'Ascenseur accessible'
  ];

  reglesDisponibles = [
    'Pas de tabac', 'Pas d\'animaux', 'Animaux autorisés', 'Pas de fête', 
    'Respect des voisins', 'Arrivée flexible', 'Départ avant 10h', 'Départ avant 11h', 
    'Départ avant 12h', 'Caméras de surveillance', 'Détecteur de fumée', 'Extincteur', 
    'Coffre-fort', 'Nettoyage inclus', 'Linge de maison fourni', 'Ménage de fin de séjour', 
    'Linge propre à laisser', 'Cuisine non autorisée', 'Machine à laver non autorisée', 
    'Visiteurs non autorisés', 'Enfants non autorisés', 'Service de conciergerie', 
    'Petit-déjeuner inclus', 'Service de transfert', 'Guide touristique'
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.verifierTypeUtilisateur();
    this.annonceId = this.route.snapshot.paramMap.get('id') || '';
    
    if (this.annonceId) {
      this.chargerAnnonce();
    } else {
      this.error = 'ID de l\'annonce non trouvé';
      this.loading = false;
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    if (this.mapInitialized) return;

    try {
      // Coordonnées par défaut (Paris) ou celles de l'annonce
      const defaultLat = this.annonce?.latitude || 48.8566;
      const defaultLng = this.annonce?.longitude || 2.3522;

      // Initialiser la carte avec des options simples et stables
      this.map = L.map('map', {
        center: [defaultLat, defaultLng],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true,
        touchZoom: true,
        attributionControl: true
      });

      // Ajouter la couche de tuiles OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 3
      }).addTo(this.map);

      // Créer un marqueur simple et stable
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="marker-pin">
            <div class="marker-icon">
              <i class="fas fa-map-marker-alt"></i>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });

      // Ajouter le marqueur
      this.marker = L.marker([defaultLat, defaultLng], {
        draggable: true,
        icon: customIcon,
        title: 'Emplacement du logement'
      }).addTo(this.map);

      // Ajouter un popup simple
      this.marker.bindPopup(`
        <div class="marker-popup">
          <h4>Emplacement du logement</h4>
          <p>Latitude: ${defaultLat.toFixed(6)}</p>
          <p>Longitude: ${defaultLng.toFixed(6)}</p>
          <small>Déplacez ce marqueur pour modifier l'emplacement</small>
        </div>
      `);

      // Mettre à jour les coordonnées dans le formulaire
      if (this.annonceForm) {
        this.annonceForm.patchValue({
          latitude: defaultLat,
          longitude: defaultLng
        });
      }

      // Écouter les événements de déplacement du marqueur
      this.marker.on('dragend', (event: L.DragEndEvent) => {
        const marker = event.target;
        const position = marker.getLatLng();
        
        if (this.annonceForm) {
          this.annonceForm.patchValue({
            latitude: position.lat,
            longitude: position.lng
          });
        }

        // Mettre à jour le popup
        marker.setPopupContent(`
          <div class="marker-popup">
            <h4>Emplacement du logement</h4>
            <p>Latitude: ${position.lat.toFixed(6)}</p>
            <p>Longitude: ${position.lng.toFixed(6)}</p>
            <small>Emplacement mis à jour</small>
          </div>
        `);
      });

      // Écouter les clics sur la carte
      this.map.on('click', (event: L.LeafletMouseEvent) => {
        const latlng = event.latlng;
        
        if (this.marker) {
          this.marker.setLatLng(latlng);
          
          // Mettre à jour le popup
          this.marker.setPopupContent(`
            <div class="marker-popup">
              <h4>Emplacement du logement</h4>
              <p>Latitude: ${latlng.lat.toFixed(6)}</p>
              <p>Longitude: ${latlng.lng.toFixed(6)}</p>
              <small>Emplacement défini par clic</small>
            </div>
          `);
        }

        if (this.annonceForm) {
          this.annonceForm.patchValue({
            latitude: latlng.lat,
            longitude: latlng.lng
          });
        }
      });

      this.mapInitialized = true;
      console.log('Carte simplifiée initialisée avec succès');

    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la carte:', error);
    }
  }

  // Méthode simplifiée pour centrer sur Paris (optionnel)
  centerOnParis(): void {
    if (this.map) {
      this.map.setView([48.8566, 2.3522], 13);
    }
  }

  verifierTypeUtilisateur(): void {
    const userType = this.authService.getUserType();
    if (userType === 'LOCATEUR') {
      this.isLocateur = true;
    } else {
      this.isLocateur = false;
      this.error = 'Accès réservé aux locateurs uniquement';
      this.loading = false;
    }
  }

  chargerAnnonce(): void {
    this.loading = true;
    this.error = '';
    console.log('Chargement de l\'annonce:', this.annonceId);
    
    // Essayer d'abord de récupérer depuis les annonces déjà chargées
    const annoncesCachees = localStorage.getItem('annoncesCachees');
    if (annoncesCachees) {
      try {
        const annonces = JSON.parse(annoncesCachees);
        const annonceCachee = annonces.find((a: any) => a.id === this.annonceId);
        
        if (annonceCachee) {
          console.log('Annonce trouvée dans le cache:', annonceCachee);
          this.annonce = annonceCachee;
          this.initialiserFormulaire();
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }
      } catch (e) {
        console.warn('Erreur lors du parsing du cache:', e);
      }
    }
    
    // Si pas dans le cache, essayer l'API
    this.apiService.getAnnonceById(this.annonceId).subscribe({
      next: (annonce) => {
        console.log('Annonce récupérée avec succès via API:', annonce);
        this.annonce = annonce;
        this.initialiserFormulaire();
        this.loading = false;
        // Forcer la mise à jour de la vue
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'annonce:', error);
        
        // Gestion détaillée des erreurs
        let errorMessage = 'Erreur lors du chargement de l\'annonce';
        
        if (error.status === 404) {
          errorMessage = 'Annonce non trouvée. Elle a peut-être été supprimée.';
        } else if (error.status === 500) {
          errorMessage = 'Erreur serveur (500). Le serveur rencontre des difficultés techniques. Essayez de revenir à "Mes Annonces" et réessayez.';
        } else if (error.status === 403) {
          errorMessage = 'Accès interdit. Vous n\'avez pas les permissions pour accéder à cette annonce.';
        } else if (error.status === 401) {
          errorMessage = 'Non autorisé. Veuillez vous reconnecter.';
        } else if (error.error?.message) {
          errorMessage = `Erreur: ${error.error.message}`;
        } else if (error.message) {
          errorMessage = `Erreur: ${error.message}`;
        }
        
        this.error = errorMessage;
        this.loading = false;
        
        // Log détaillé pour le débogage
        console.error('Détails de l\'erreur:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
          error: error.error
        });
      }
    });
  }

  initialiserFormulaire(): void {
    if (!this.annonce) {
      console.error('Aucune annonce disponible pour initialiser le formulaire');
      return;
    }

    console.log('Initialisation du formulaire avec les données:', this.annonce);

    // S'assurer que les équipements et règles sont des tableaux
    const equipements = Array.isArray(this.annonce.equipements) ? this.annonce.equipements : [];
    const regles = Array.isArray(this.annonce.regles) ? this.annonce.regles : [];

    console.log('Équipements:', equipements);
    console.log('Règles:', regles);

    this.annonceForm = this.fb.group({
      titre: [this.annonce.titre || '', [Validators.required, Validators.minLength(10)]],
      description: [this.annonce.description || '', [Validators.required, Validators.minLength(50)]],
      adresse: this.fb.group({
        rue: [this.annonce.adresse?.rue || '', Validators.required],
        numero: [this.annonce.adresse?.numero || '', Validators.required],
        codePostal: [this.annonce.adresse?.codePostal || '', Validators.required],
        ville: [this.annonce.adresse?.ville || '', Validators.required],
        pays: [this.annonce.adresse?.pays || 'France', Validators.required],
        complement: [this.annonce.adresse?.complement || '']
      }),
      prixParNuit: [this.annonce.prixParNuit || 0, [Validators.required, Validators.min(1)]],
      prixParSemaine: [this.annonce.prixParSemaine || 0, [Validators.required, Validators.min(1)]],
      prixParMois: [this.annonce.prixParMois || 0, [Validators.required, Validators.min(1)]],
      capacite: [this.annonce.capacite || 1, [Validators.required, Validators.min(1)]],
      nombreChambres: [this.annonce.nombreChambres || 1, [Validators.required, Validators.min(1)]],
      nombreSallesDeBain: [this.annonce.nombreSallesDeBain || 1, [Validators.required, Validators.min(1)]],
      typeMaison: [this.annonce.typeMaison || 'APPARTEMENT', Validators.required],
      equipements: [equipements],
      regles: [regles],
      stadePlusProche: [this.annonce.stadePlusProche || '', Validators.required],
      distanceStade: [this.annonce.distanceStade || 0, [Validators.required, Validators.min(0)]],
      adresseStade: [this.annonce.adresseStade || '', Validators.required],
      latitude: [this.annonce.latitude || 0, Validators.required],
      longitude: [this.annonce.longitude || 0, Validators.required]
    });

    // Initialiser les formulaires des équipements et règles
    this.initialiserFormulairesEquipementsRegles();

    // Charger les données de réservations
    this.chargerDonneesReservations();

    console.log('Formulaire initialisé:', this.annonceForm.value);
  }

  isEquipementSelected(equipement: string): boolean {
    const equipements = this.annonceForm.get('equipements')?.value;
    console.log('Vérification équipement:', equipement, 'dans:', equipements);
    return Array.isArray(equipements) && equipements.includes(equipement);
  }

  isRegleSelected(regle: string): boolean {
    const regles = this.annonceForm.get('regles')?.value;
    console.log('Vérification règle:', regle, 'dans:', regles);
    return Array.isArray(regles) && regles.includes(regle);
  }

  toggleEquipement(equipement: string): void {
    const equipements = this.annonceForm.get('equipements')?.value || [];
    const index = equipements.indexOf(equipement);
    
    if (index > -1) {
      equipements.splice(index, 1);
    } else {
      equipements.push(equipement);
    }
    
    this.annonceForm.patchValue({ equipements });
  }

  toggleRegle(regle: string): void {
    const regles = this.annonceForm.get('regles')?.value || [];
    const index = regles.indexOf(regle);
    
    if (index > -1) {
      regles.splice(index, 1);
    } else {
      regles.push(regle);
    }
    
    this.annonceForm.patchValue({ regles });
  }

  onSubmit(): void {
    if (this.annonceForm.invalid) {
      this.error = 'Veuillez corriger les erreurs dans le formulaire';
      return;
    }

    this.saving = true;
    this.error = '';
    this.success = '';

    const annonceData = this.annonceForm.value;
    
    // Combiner les images existantes avec les nouvelles
    const existingImages = this.annonce?.images || [];
    const newImages = this.getSelectedImages();
    const allImages = [...existingImages, ...newImages];
    
    // Ajouter les champs manquants de l'annonce originale
    const annonceComplete: Annonce = {
      ...this.annonce!,
      ...annonceData,
      images: allImages,
      dateModification: new Date().toISOString()
    };

    console.log('Modification de l\'annonce:', annonceComplete);

    this.apiService.modifierAnnonce(this.annonceId, annonceComplete).subscribe({
      next: (annonceModifiee) => {
        console.log('Annonce modifiée avec succès:', annonceModifiee);
        this.success = 'Annonce modifiée avec succès !';
        this.saving = false;
        
        // Nettoyer le cache des annonces
        this.nettoyerCacheAnnonces();
        
        // Rediriger vers mes annonces après 2 secondes
        setTimeout(() => {
          this.router.navigate(['/mes-annonces']);
        }, 2000);
      },
      error: (error) => {
        console.error('Erreur lors de la modification:', error);
        
        // Gestion spécifique de l'erreur 500
        if (error.status === 500) {
          this.error = 'Erreur serveur (500) lors de la modification. Le serveur rencontre des difficultés techniques. Les modifications ont été sauvegardées localement. Veuillez réessayer plus tard ou contacter l\'administrateur.';
          
          // Sauvegarder les modifications localement
          this.sauvegarderModificationsLocales(annonceComplete);
        } else {
          this.error = 'Erreur lors de la modification: ' + (error.error?.message || error.message || 'Erreur inconnue');
        }
        
        this.saving = false;
      }
    });
  }

  sauvegarderModificationsLocales(annonceModifiee: Annonce): void {
    try {
      // Récupérer les annonces du cache
      const annoncesCachees = localStorage.getItem('annoncesCachees');
      if (annoncesCachees) {
        const annonces = JSON.parse(annoncesCachees);
        
        // Mettre à jour l'annonce dans le cache
        const index = annonces.findIndex((a: any) => a.id === this.annonceId);
        if (index !== -1) {
          annonces[index] = annonceModifiee;
          localStorage.setItem('annoncesCachees', JSON.stringify(annonces));
          console.log('Modifications sauvegardées localement');
          
          // Afficher un message de succès local
          this.success = 'Modifications sauvegardées localement. Les changements seront synchronisés avec le serveur une fois le problème résolu.';
        }
      }
    } catch (e) {
      console.warn('Erreur lors de la sauvegarde locale:', e);
    }
  }

  nettoyerCacheAnnonces(): void {
    try {
      localStorage.removeItem('annoncesCachees');
      console.log('Cache des annonces nettoyé après modification');
    } catch (e) {
      console.warn('Erreur lors du nettoyage du cache:', e);
    }
  }

  retourMesAnnonces(): void {
    this.router.navigate(['/mes-annonces']);
  }

  retourDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  synchroniserAvecServeur(): void {
    if (!this.annonceForm.valid) {
      this.error = 'Veuillez corriger les erreurs dans le formulaire avant de synchroniser';
      return;
    }

    this.saving = true;
    this.error = '';
    this.success = '';

    const annonceData = this.annonceForm.value;
    const annonceComplete: Annonce = {
      ...this.annonce!,
      ...annonceData,
      dateModification: new Date().toISOString()
    };

    console.log('Tentative de synchronisation avec le serveur:', annonceComplete);

    this.apiService.modifierAnnonce(this.annonceId, annonceComplete).subscribe({
      next: (annonceModifiee) => {
        console.log('Synchronisation réussie:', annonceModifiee);
        this.success = 'Synchronisation réussie ! L\'annonce a été mise à jour sur le serveur.';
        this.saving = false;
        
        // Nettoyer le cache
        this.nettoyerCacheAnnonces();
        
        // Rediriger après 3 secondes
        setTimeout(() => {
          this.router.navigate(['/mes-annonces']);
        }, 3000);
      },
      error: (error) => {
        console.error('Erreur lors de la synchronisation:', error);
        this.error = 'La synchronisation a échoué. Le serveur est toujours indisponible. Veuillez réessayer plus tard.';
        this.saving = false;
      }
    });
  }

  // Méthodes de gestion des images
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
      this.processFiles(Array.from(files));
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files) {
      this.processFiles(Array.from(files));
    }
  }

  private processFiles(files: File[]): void {
    this.imageErrors = [];
    
    files.forEach(file => {
      // Vérifier le type de fichier
      if (!this.allowedTypes.includes(file.type)) {
        this.imageErrors.push(`${file.name}: Type de fichier non autorisé`);
        return;
      }
      
      // Vérifier la taille
      if (file.size > this.maxFileSize) {
        this.imageErrors.push(`${file.name}: Fichier trop volumineux (max ${this.formatFileSize(this.maxFileSize)})`);
        return;
      }
      
      // Vérifier le nombre maximum d'images
      if (this.selectedImages.length >= this.maxImages) {
        this.imageErrors.push(`Nombre maximum d'images atteint (${this.maxImages})`);
        return;
      }
      
      // Vérifier les doublons
      const isDuplicate = this.selectedImages.some(img => img.name === file.name);
      if (isDuplicate) {
        this.imageErrors.push(`${file.name}: Image déjà sélectionnée`);
        return;
      }
      
      // Créer la preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        this.selectedImages.push({
          file,
          preview,
          name: file.name,
          size: file.size
        });
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    this.selectedImages.splice(index, 1);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getSelectedImages(): string[] {
    return this.selectedImages.map(img => img.preview);
  }

  removeExistingImage(index: number): void {
    if (this.annonce && this.annonce.images) {
      this.annonce.images.splice(index, 1);
      // Mettre à jour le formulaire
      this.annonceForm.patchValue({
        images: this.annonce.images
      });
    }
  }

  // Méthodes pour la carte professionnelle
  getCurrentLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Mettre à jour le formulaire
          if (this.annonceForm) {
            this.annonceForm.patchValue({
              latitude: lat,
              longitude: lng
            });
          }
          
          // Centrer la carte sur la position actuelle
          if (this.map) {
            this.map.setView([lat, lng], 15);
            if (this.marker) {
              this.marker.setLatLng([lat, lng]);
            }
          }
          
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
    if (this.map) {
      this.map.zoomIn();
    }
  }

  zoomOut(): void {
    if (this.map) {
      this.map.zoomOut();
    }
  }

  centerMap(): void {
    if (this.map) {
      const currentLat = this.annonceForm?.get('latitude')?.value || 48.8566;
      const currentLng = this.annonceForm?.get('longitude')?.value || 2.3522;
      this.map.setView([currentLat, currentLng], 13);
    }
  }

  onSearchInput(): void {
    // Implémentation de la recherche d'adresse
    console.log('Recherche d\'adresse:', this.searchQuery);
  }

  selectSearchResult(result: any): void {
    // Implémentation de la sélection d'un résultat
    console.log('Résultat sélectionné:', result);
  }

  retryMapLoad(): void {
    this.mapError = false;
    this.initMap();
  }

  // Méthodes pour les modales
  openModal(modalType: string): void {
    this.modal = modalType;
  }

  closeModal(): void {
    this.modal = null;
  }

  // Méthodes pour les équipements et règles
  initialiserFormulairesEquipementsRegles(): void {
    // Initialiser le formulaire des équipements
    this.equipementsForm = this.fb.group({
      wifi: [this.isEquipementSelected('WiFi')],
      climatisation: [this.isEquipementSelected('Climatisation')],
      chauffage: [this.isEquipementSelected('Chauffage')],
      ascenseur: [this.isEquipementSelected('Ascenseur')],
      parking: [this.isEquipementSelected('Parking')],
      balcon: [this.isEquipementSelected('Balcon')],
      vue: [this.isEquipementSelected('Vue exceptionnelle')],
      securite: [this.isEquipementSelected('Système de sécurité')],
      cuisine_equipee: [this.isEquipementSelected('Cuisine équipée')],
      micro_ondes: [this.isEquipementSelected('Micro-ondes')],
      lave_vaisselle: [this.isEquipementSelected('Lave-vaisselle')],
      refrigerateur: [this.isEquipementSelected('Réfrigérateur')],
      cafetiere: [this.isEquipementSelected('Cafetière')],
      bouilloire: [this.isEquipementSelected('Bouilloire')],
      mixeur: [this.isEquipementSelected('Mixeur')],
      grill: [this.isEquipementSelected('Grill')],
      ustensiles: [this.isEquipementSelected('Ustensiles de cuisine')],
      vaisselle: [this.isEquipementSelected('Vaisselle complète')],
      salle_bain_privee: [this.isEquipementSelected('Salle de bain privée')],
      douche: [this.isEquipementSelected('Douche')],
      bain: [this.isEquipementSelected('Baignoire')],
      serviettes: [this.isEquipementSelected('Serviettes fournies')],
      seche_cheveux: [this.isEquipementSelected('Sèche-cheveux')],
      produits_hygiene: [this.isEquipementSelected('Produits d\'hygiène')],
      peignoir: [this.isEquipementSelected('Peignoir')],
      chaussons: [this.isEquipementSelected('Chaussons')],
      linge_maison: [this.isEquipementSelected('Linge de maison')],
      oreillers: [this.isEquipementSelected('Oreillers')],
      couvertures: [this.isEquipementSelected('Couvertures')],
      armoire: [this.isEquipementSelected('Armoire/Penderie')],
      lit_bebe: [this.isEquipementSelected('Lit bébé disponible')],
      lit_supplementaire: [this.isEquipementSelected('Lit supplémentaire')],
      table_chevet: [this.isEquipementSelected('Table de chevet')],
      lampe_chevet: [this.isEquipementSelected('Lampe de chevet')],
      tv: [this.isEquipementSelected('Télévision')],
      netflix: [this.isEquipementSelected('Netflix/Streaming')],
      jeux: [this.isEquipementSelected('Jeux de société')],
      livres: [this.isEquipementSelected('Livres')],
      musique: [this.isEquipementSelected('Système audio')],
      console_jeux: [this.isEquipementSelected('Console de jeux')],
      projecteur: [this.isEquipementSelected('Projecteur')],
      karaoke: [this.isEquipementSelected('Karaoké')],
      jardin: [this.isEquipementSelected('Jardin')],
      barbecue: [this.isEquipementSelected('Barbecue')],
      piscine: [this.isEquipementSelected('Piscine')],
      terrasse: [this.isEquipementSelected('Terrasse')],
      hamac: [this.isEquipementSelected('Hamac')],
      parasol: [this.isEquipementSelected('Parasol')],
      chaises_longues: [this.isEquipementSelected('Chaises longues')],
      accessible: [this.isEquipementSelected('Accessible aux personnes à mobilité réduite')],
      rampe: [this.isEquipementSelected('Rampe d\'accès')],
      ascenseur_accessible: [this.isEquipementSelected('Ascenseur accessible')],
      salle_bain_accessible: [this.isEquipementSelected('Salle de bain accessible')],
      conciergerie: [this.isEquipementSelected('Service de conciergerie')],
      petit_dejeuner: [this.isEquipementSelected('Petit-déjeuner inclus')],
      transfert: [this.isEquipementSelected('Service de transfert')],
      guide: [this.isEquipementSelected('Guide touristique')],
      menage: [this.isEquipementSelected('Ménage')],
      cuisinier: [this.isEquipementSelected('Cuisinier privé')],
      chauffeur: [this.isEquipementSelected('Chauffeur privé')],
      massage: [this.isEquipementSelected('Massage')]
    });

    // Initialiser le formulaire des règles
    this.reglesForm = this.fb.group({
      pas_fumeur: [this.isRegleSelected('Pas de tabac')],
      pas_animaux: [this.isRegleSelected('Pas d\'animaux')],
      animaux_autorises: [this.isRegleSelected('Animaux autorisés')],
      pas_fete: [this.isRegleSelected('Pas de fête')],
      calme: [this.isRegleSelected('Respect des voisins')],
      check_in_flexible: [this.isRegleSelected('Arrivée flexible')],
      check_out_10h: [this.isRegleSelected('Départ avant 10h')],
      check_out_11h: [this.isRegleSelected('Départ avant 11h')],
      check_out_12h: [this.isRegleSelected('Départ avant 12h')],
      couvre_feu: [this.isRegleSelected('Couvre-feu à 22h')],
      silence_nuit: [this.isRegleSelected('Silence de nuit')],
      camera: [this.isRegleSelected('Caméras de surveillance')],
      detecteur_fumee: [this.isRegleSelected('Détecteur de fumée')],
      extincteur: [this.isRegleSelected('Extincteur')],
      coffre_fort: [this.isRegleSelected('Coffre-fort')],
      gardien: [this.isRegleSelected('Gardien 24h/24')],
      interphone: [this.isRegleSelected('Interphone')],
      digicode: [this.isRegleSelected('Digicode')],
      nettoyage_inclus: [this.isRegleSelected('Nettoyage inclus')],
      linge_fourni: [this.isRegleSelected('Linge de maison fourni')],
      menage_fin_sejour: [this.isRegleSelected('Ménage de fin de séjour')],
      linge_propre: [this.isRegleSelected('Linge propre à laisser')],
      nettoyage_quotidien: [this.isRegleSelected('Nettoyage quotidien')],
      changement_linge: [this.isRegleSelected('Changement de linge')],
      pas_cuisine: [this.isRegleSelected('Cuisine non autorisée')],
      pas_lavage: [this.isRegleSelected('Machine à laver non autorisée')],
      pas_enfants: [this.isRegleSelected('Enfants non autorisés')],
      pas_etudiants: [this.isRegleSelected('Étudiants non autorisés')],
      pas_travailleurs: [this.isRegleSelected('Travailleurs non autorisés')],
      pas_photographie: [this.isRegleSelected('Photographie interdite')],
      wifi_gratuit: [this.isRegleSelected('WiFi gratuit')],
      electricite_incluse: [this.isRegleSelected('Électricité incluse')],
      eau_incluse: [this.isRegleSelected('Eau incluse')],
      chauffage_inclus: [this.isRegleSelected('Chauffage inclus')],
      parking_gratuit: [this.isRegleSelected('Parking gratuit')],
      menage_inclus: [this.isRegleSelected('Ménage inclus')]
    });
  }

  getEquipementsPreview(): string[] {
    const equipements = this.annonceForm.get('equipements')?.value || [];
    return Array.isArray(equipements) ? equipements.slice(0, 5) : [];
  }

  getReglesPreview(): string[] {
    const regles = this.annonceForm.get('regles')?.value || [];
    return Array.isArray(regles) ? regles.slice(0, 5) : [];
  }

  // Méthodes pour les réservations
  chargerDonneesReservations(): void {
    // Simuler des données de réservations pour l'instant
    this.reservationsStats = {
      enAttente: 2,
      confirmees: 5,
      enCours: 1,
      terminees: 8
    };

    this.recentReservations = [
      {
        id: 'res-001',
        dateArrivee: '2024-01-15',
        dateDepart: '2024-01-20',
        nombreVoyageurs: 4,
        statut: 'CONFIRMEE'
      },
      {
        id: 'res-002',
        dateArrivee: '2024-01-25',
        dateDepart: '2024-01-28',
        nombreVoyageurs: 2,
        statut: 'EN_ATTENTE'
      }
    ];

    this.filteredReservations = [...this.recentReservations];
  }

  filterReservations(): void {
    let filtered = [...this.recentReservations];

    if (this.reservationFilter !== 'TOUS') {
      filtered = filtered.filter(r => r.statut === this.reservationFilter);
    }

    if (this.reservationPeriodFilter === 'FUTURES') {
      const today = new Date();
      filtered = filtered.filter(r => new Date(r.dateArrivee) >= today);
    } else if (this.reservationPeriodFilter === 'PASSEES') {
      const today = new Date();
      filtered = filtered.filter(r => new Date(r.dateDepart) < today);
    }

    this.filteredReservations = filtered;
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  getStatusClass(statut: string): string {
    const classes: { [key: string]: string } = {
      'EN_ATTENTE': 'badge-warning',
      'CONFIRMEE': 'badge-success',
      'EN_COURS': 'badge-info',
      'TERMINEE': 'badge-secondary',
      'ANNULEE': 'badge-danger'
    };
    return classes[statut] || 'badge-secondary';
  }

  formatStatus(statut: string): string {
    const statuses: { [key: string]: string } = {
      'EN_ATTENTE': 'En attente',
      'CONFIRMEE': 'Confirmée',
      'EN_COURS': 'En cours',
      'TERMINEE': 'Terminée',
      'ANNULEE': 'Annulée'
    };
    return statuses[statut] || statut;
  }

  openReservationDetails(reservation: any): void {
    this.selectedReservation = reservation;
    this.modal = 'reservation-details';
  }

  viewReservationDetails(reservation: any): void {
    this.openReservationDetails(reservation);
  }

  confirmReservation(reservation: any): void {
    console.log('Confirmation de la réservation:', reservation.id);
    // TODO: Implémenter la logique de confirmation
  }

  cancelReservation(reservation: any): void {
    console.log('Annulation de la réservation:', reservation.id);
    // TODO: Implémenter la logique d'annulation
  }

  startReservation(reservation: any): void {
    console.log('Début de la réservation:', reservation.id);
    // TODO: Implémenter la logique de début
  }

  endReservation(reservation: any): void {
    console.log('Fin de la réservation:', reservation.id);
    // TODO: Implémenter la logique de fin
  }

  calculateDuration(dateArrivee: string, dateDepart: string): number {
    if (!dateArrivee || !dateDepart) return 0;
    const arrivee = new Date(dateArrivee);
    const depart = new Date(dateDepart);
    const diffTime = depart.getTime() - arrivee.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
} 