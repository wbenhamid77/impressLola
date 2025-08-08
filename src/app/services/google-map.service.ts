import { Injectable } from '@angular/core';
import { GOOGLE_MAPS_CONFIG, GOOGLE_MAPS_STYLES } from '../config/google-maps.config';

export interface MapLocation {
  lat: number;
  lng: number;
  address?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleMapService {
  private map: any = null;
  private marker: any = null;
  private geocoder: any = null;
  private autocomplete: any = null;

  // Clé API Google Maps depuis la configuration
  private readonly GOOGLE_MAPS_API_KEY = GOOGLE_MAPS_CONFIG.apiKey;

  constructor() {
    this.loadGoogleMapsScript();
  }

  private loadGoogleMapsScript(): void {
    if (typeof (window as any).google === 'undefined') {
      const script = document.createElement('script');
      // Essayer sans clé API d'abord (pour le développement local)
      script.src = `https://maps.googleapis.com/maps/api/js?libraries=places`;
      script.async = true;
      script.defer = true;
      
      // Gestion des erreurs de chargement
      script.onerror = () => {
        console.error('Erreur lors du chargement de Google Maps API');
      };
      
      script.onload = () => {
        console.log('Google Maps API chargée avec succès');
      };
      
      document.head.appendChild(script);
    }
  }

  /**
   * Initialise la carte Google Maps
   */
  initMap(containerId: string, options: {
    center?: { lat: number; lng: number };
    zoom?: number;
    mapTypeId?: any;
  } = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const defaultOptions = {
        center: { lat: 48.8566, lng: 2.3522 }, // Paris par défaut
        zoom: 12,
        mapTypeId: 'roadmap',
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: true,
        rotateControl: true,
        fullscreenControl: true,
        styles: GOOGLE_MAPS_STYLES
      };

      const mapOptions = { ...defaultOptions, ...options };

      // Attendre que l'API Google Maps soit chargée
      const checkGoogleMaps = () => {
        if (typeof (window as any).google !== 'undefined' && (window as any).google.maps) {
          try {
            const container = document.getElementById(containerId);
            if (!container) {
              reject(new Error(`Container ${containerId} not found`));
              return;
            }

            console.log('Initialisation de la carte Google Maps...');
            this.map = new (window as any).google.maps.Map(container, mapOptions);
            this.geocoder = new (window as any).google.maps.Geocoder();

            // Attendre que la carte soit chargée avant d'ajouter le marqueur
            (window as any).google.maps.event.addListenerOnce(this.map, 'idle', () => {
              console.log('Carte chargée, ajout du marqueur...');
              // Ajouter un marqueur par défaut
              this.addMarker({
                lat: mapOptions.center.lat,
                lng: mapOptions.center.lng
              });
              if (this.map) {
                resolve(this.map);
              }
            });

          } catch (error) {
            console.error('Erreur lors de l\'initialisation de la carte:', error);
            reject(error);
          }
        } else {
          console.log('API Google Maps non encore chargée, nouvelle tentative...');
          // Limiter le nombre de tentatives
          if (attempts < 50) { // 10 secondes maximum
            setTimeout(() => {
              attempts++;
              checkGoogleMaps();
            }, 200);
          } else {
            reject(new Error('Impossible de charger Google Maps API après plusieurs tentatives'));
          }
        }
      };

      let attempts = 0;
      checkGoogleMaps();
    });
  }

  /**
   * Ajoute un marqueur sur la carte
   */
  addMarker(location: MapLocation, options: {
    draggable?: boolean;
    title?: string;
  } = {}): any {
    if (!this.map) {
      throw new Error('Carte non initialisée');
    }

    const defaultOptions = {
      draggable: true,
      title: 'Emplacement du logement'
    };

    const markerOptions = { ...defaultOptions, ...options };

    // Supprimer l'ancien marqueur s'il existe
    if (this.marker) {
      this.marker.setMap(null);
    }

    this.marker = new (window as any).google.maps.Marker({
      position: { lat: location.lat, lng: location.lng },
      map: this.map,
      draggable: markerOptions.draggable,
      title: markerOptions.title,
      icon: this.createCustomMarkerIcon()
    });

    // Ajouter un popup d'information
    const infoWindow = new (window as any).google.maps.InfoWindow({
      content: this.createInfoWindowContent(location)
    });

    this.marker.addListener('click', () => {
      infoWindow.open(this.map, this.marker);
    });

    // Écouter le déplacement du marqueur
    this.marker.addListener('dragend', () => {
      const position = this.marker!.getPosition();
      if (position) {
        this.updateInfoWindow(infoWindow, {
          lat: position.lat(),
          lng: position.lng()
        });
      }
    });

    return this.marker;
  }

  /**
   * Crée une icône de marqueur personnalisée
   */
  private createCustomMarkerIcon(): any {
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" style="stop-color:#C1272D;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#E53E3E;stop-opacity:1" />
            </radialGradient>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.3"/>
            </filter>
          </defs>
          <!-- Ombre -->
          <circle cx="25" cy="25" r="20" fill="#000000" opacity="0.2" filter="url(#shadow)"/>
          <!-- Marqueur principal -->
          <circle cx="25" cy="25" r="18" fill="url(#grad)" stroke="#FFFFFF" stroke-width="3"/>
          <!-- Centre blanc -->
          <circle cx="25" cy="25" r="10" fill="#FFFFFF"/>
          <!-- Centre rouge -->
          <circle cx="25" cy="25" r="5" fill="#C1272D"/>
          <!-- Animation de pulsation -->
          <circle cx="25" cy="25" r="25" fill="none" stroke="#C1272D" stroke-width="2" opacity="0.3">
            <animate attributeName="r" values="25;35;25" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite"/>
          </circle>
        </svg>
      `),
      scaledSize: new (window as any).google.maps.Size(50, 50),
      anchor: new (window as any).google.maps.Point(25, 50)
    };
  }

  /**
   * Crée le contenu de la fenêtre d'information
   */
  private createInfoWindowContent(location: MapLocation): string {
    return `
      <div style="padding: 10px; min-width: 200px; font-family: Arial, sans-serif;">
        <h4 style="margin: 0 0 10px 0; color: #C1272D; font-size: 14px;">
          <i class="fas fa-home"></i> Emplacement du logement
        </h4>
        <p style="margin: 5px 0; font-size: 12px; color: #4a5568;">
          <strong>Latitude:</strong> ${location.lat.toFixed(6)}
        </p>
        <p style="margin: 5px 0; font-size: 12px; color: #4a5568;">
          <strong>Longitude:</strong> ${location.lng.toFixed(6)}
        </p>
        ${location.address ? `
          <p style="margin: 5px 0; font-size: 12px; color: #4a5568;">
            <strong>Adresse:</strong> ${location.address}
          </p>
        ` : ''}
        <small style="color: #718096; font-style: italic;">
          Déplacez ce marqueur pour modifier l'emplacement
        </small>
      </div>
    `;
  }

  /**
   * Met à jour la fenêtre d'information
   */
  private updateInfoWindow(infoWindow: any, location: MapLocation): void {
    infoWindow.setContent(this.createInfoWindowContent(location));
  }

  /**
   * Centre la carte sur une position
   */
  centerOnLocation(lat: number, lng: number, zoom: number = 15): void {
    if (this.map) {
      this.map.setCenter({ lat, lng });
      this.map.setZoom(zoom);
    }
  }

  /**
   * Recherche d'adresse (geocoding)
   */
  async searchAddress(query: string): Promise<MapLocation[]> {
    return new Promise((resolve, reject) => {
      if (!this.geocoder) {
        reject(new Error('Geocoder non initialisé'));
        return;
      }

      this.geocoder.geocode({
        address: query,
        componentRestrictions: {
          country: 'FR'
        }
      }, (results: any, status: any) => {
        if (status === 'OK' && results) {
          const locations: MapLocation[] = results.slice(0, 5).map((result: any) => ({
            lat: result.geometry.location.lat(),
            lng: result.geometry.location.lng(),
            address: result.formatted_address
          }));
          resolve(locations);
        } else {
          resolve([]);
        }
      });
    });
  }

  /**
   * Obtient l'adresse à partir des coordonnées (reverse geocoding)
   */
  async getAddressFromCoordinates(lat: number, lng: number): Promise<string | null> {
    return new Promise((resolve, reject) => {
      if (!this.geocoder) {
        reject(new Error('Geocoder non initialisé'));
        return;
      }

      this.geocoder.geocode({
        location: { lat, lng }
      }, (results: any, status: any) => {
        if (status === 'OK' && results && results.length > 0) {
          resolve(results[0].formatted_address);
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Met à jour la position du marqueur
   */
  updateMarkerPosition(lat: number, lng: number, address?: string): void {
    if (this.marker && this.map) {
      const position = new (window as any).google.maps.LatLng(lat, lng);
      this.marker.setPosition(position);
      
      // Mettre à jour la fenêtre d'information si elle est ouverte
      const infoWindow = this.marker.get('infoWindow');
      if (infoWindow) {
        this.updateInfoWindow(infoWindow, { lat, lng, address });
      }
    }
  }

  /**
   * Nettoie la carte
   */
  destroy(): void {
    if (this.marker) {
      this.marker.setMap(null);
      this.marker = null;
    }
    this.map = null;
    this.geocoder = null;
  }

  /**
   * Obtient la carte actuelle
   */
  getMap(): any {
    return this.map;
  }

  /**
   * Obtient le marqueur actuel
   */
  getMarker(): any {
    return this.marker;
  }


} 