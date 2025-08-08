import { Injectable } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { MAPBOX_CONFIG } from '../config/mapbox.config';

export interface MapLocation {
  lat: number;
  lng: number;
  address?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private map: mapboxgl.Map | null = null;
  private marker: mapboxgl.Marker | null = null;
  private geocoder: any = null;

  constructor() {
    // Définir le token Mapbox
    (mapboxgl as any).accessToken = MAPBOX_CONFIG.accessToken;
  }

  /**
   * Initialise la carte Mapbox
   */
  initMap(containerId: string, options: {
    center?: [number, number];
    zoom?: number;
    style?: string;
  } = {}): mapboxgl.Map {
    const defaultOptions = {
      center: [2.3522, 48.8566] as [number, number], // Paris par défaut
      zoom: 12,
      style: 'mapbox://styles/mapbox/streets-v12' // Style professionnel
    };

    const mapOptions = { ...defaultOptions, ...options };

    this.map = new mapboxgl.Map({
      container: containerId,
      style: mapOptions.style,
      center: mapOptions.center,
      zoom: mapOptions.zoom,
      attributionControl: true,
      customAttribution: '© Mapbox © OpenStreetMap contributors'
    });

    // Ajouter les contrôles de navigation
    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    this.map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    this.map.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    }), 'top-right');

    return this.map;
  }

  /**
   * Ajoute un marqueur sur la carte
   */
  addMarker(location: MapLocation, options: {
    draggable?: boolean;
    popup?: boolean;
  } = {}): mapboxgl.Marker {
    if (!this.map) {
      throw new Error('Carte non initialisée');
    }

    const defaultOptions = {
      draggable: true,
      popup: true
    };

    const markerOptions = { ...defaultOptions, ...options };

    // Créer un marqueur personnalisé avec une icône moderne
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.innerHTML = `
      <div class="marker-pin">
        <div class="marker-icon">
          <i class="fas fa-map-marker-alt"></i>
        </div>
        <div class="marker-pulse"></div>
      </div>
    `;

    this.marker = new mapboxgl.Marker({
      element: el,
      draggable: markerOptions.draggable
    })
    .setLngLat([location.lng, location.lat])
    .addTo(this.map);

    // Ajouter un popup si demandé
    if (markerOptions.popup) {
      const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: false,
        maxWidth: '300px'
      })
      .setHTML(`
        <div class="marker-popup">
          <h4><i class="fas fa-home"></i> Emplacement du logement</h4>
          <p><strong>Latitude:</strong> ${location.lat.toFixed(6)}</p>
          <p><strong>Longitude:</strong> ${location.lng.toFixed(6)}</p>
          ${location.address ? `<p><strong>Adresse:</strong> ${location.address}</p>` : ''}
          <small>Déplacez ce marqueur pour modifier l'emplacement</small>
        </div>
      `);

      this.marker.setPopup(popup);
    }

    return this.marker;
  }

  /**
   * Met à jour la position du marqueur
   */
  updateMarkerPosition(lat: number, lng: number, address?: string): void {
    if (this.marker && this.map) {
      this.marker.setLngLat([lng, lat]);
      
      // Mettre à jour le popup
      const popup = this.marker.getPopup();
      if (popup) {
        popup.setHTML(`
          <div class="marker-popup">
            <h4><i class="fas fa-home"></i> Emplacement du logement</h4>
            <p><strong>Latitude:</strong> ${lat.toFixed(6)}</p>
            <p><strong>Longitude:</strong> ${lng.toFixed(6)}</p>
            ${address ? `<p><strong>Adresse:</strong> ${address}</p>` : ''}
            <small>Emplacement mis à jour</small>
          </div>
        `);
      }
    }
  }

  /**
   * Centre la carte sur une position
   */
  centerOnLocation(lat: number, lng: number, zoom: number = 15): void {
    if (this.map) {
      this.map.flyTo({
        center: [lng, lat],
        zoom: zoom,
        duration: 2000
      });
    }
  }

  /**
   * Recherche d'adresse (geocoding)
   */
  async searchAddress(query: string): Promise<MapLocation[]> {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_CONFIG.accessToken}&country=fr&limit=5`
      );
      
      const data = await response.json();
      
      return data.features.map((feature: any) => ({
        lat: feature.center[1],
        lng: feature.center[0],
        address: feature.place_name
      }));
    } catch (error) {
      console.error('Erreur lors de la recherche d\'adresse:', error);
      return [];
    }
  }

  /**
   * Obtient l'adresse à partir des coordonnées (reverse geocoding)
   */
  async getAddressFromCoordinates(lat: number, lng: number): Promise<string | null> {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_CONFIG.accessToken}&country=fr&limit=1`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        return data.features[0].place_name;
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'adresse:', error);
      return null;
    }
  }

  /**
   * Nettoie la carte
   */
  destroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }

  /**
   * Obtient la carte actuelle
   */
  getMap(): mapboxgl.Map | null {
    return this.map;
  }

  /**
   * Obtient le marqueur actuel
   */
  getMarker(): mapboxgl.Marker | null {
    return this.marker;
  }
} 